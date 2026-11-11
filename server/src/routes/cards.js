/**
 * The cards that sit on a tree.
 */
import { db } from '../db/db.js';
import { supabase } from '../db/supabase.js';
import { store } from '../lib/store.js';
import { authRateLimiter, trackRateLimiter } from '../lib/rate-limit.js';
import { safeEqual, dbErrorHint } from '../lib/errors.js';
import {
  resolveTree,
  resolveTreeOwner,
  resolveCardOwner,
  isSlugAvailableGlobally,
  isCallerSuperAdmin,
  isTreeOwnerBlocked,
} from '../lib/ownership.js';
import {
  invalidatePublicTreeCache,
  invalidatePublicTreeCacheForTree,
  publicTreeCache,
  PUBLIC_CACHE_TTL_MS,
  treeInfoCache,
} from '../lib/cache.js';
import { toPublicCard, sanitizeTreeForPublic } from '../lib/public-payload.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

/**
 * Register the routes on the app.
 * @param {import('express').Express} app
 */
export function registerCardRoutes(app) {
  // Add Card (requires tree ownership)
  app.post('/api/admin/trees/:id/cards', async (req, res) => {
    const currentId = req.userId;
    if (!currentId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const treeId = parseInt(req.params.id, 10);
    const ownerId = await resolveTreeOwner(treeId);
    if (ownerId === null) {
      return res.status(404).json({ error: 'Tree not found' });
    }
    if (ownerId !== currentId) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to add cards to this tree' });
    }

    let createdCard;
    try {
      createdCard = await db.createCard({
        treeId,
        type: req.body.type || 'link',
        title: req.body.title || 'New Link',
        url: req.body.url || 'https://',
        thumbnailUrl: req.body.thumbnailUrl || null,
        position: req.body.position || 0,
        lockType: req.body.lockType || req.body.lock_type || 'none',
        lockValue: req.body.lockValue || req.body.lock_value || null,
        settings: req.body.settings || {},
      });
    } catch (err) {
      return res.status(503).json({
        error: 'This card could not be saved to the database. Nothing was changed.',
        details: err?.message || null,
        hint: dbErrorHint(err),
      });
    }

    if (createdCard) {
      store.cards.push(createdCard);
      await invalidatePublicTreeCacheForTree(treeId);
      return res.status(201).json(createdCard);
    }

    const tree = store.trees.find((t) => t.id === treeId && !t.deletedAt);
    if (!tree) return res.status(404).json({ error: 'Tree not found' });

    const currentCards = store.cards.filter((c) => c.treeId === treeId);
    const newCard = {
      id: Date.now(),
      treeId,
      type: req.body.type || 'link',
      title: req.body.title || 'New Link',
      url: req.body.url || 'https://',
      thumbnailUrl: req.body.thumbnailUrl || null,
      position: currentCards.length,
      visible: true,
      animation: req.body.animation || 'none',
      settings: req.body.settings || {},
      createdAt: new Date().toISOString(),
    };

    store.cards.push(newCard);
    res.status(201).json(newCard);
  });

  // Update Card (requires ownership of parent tree)
  app.put('/api/admin/cards/:id', async (req, res) => {
    const currentId = req.userId;
    if (!currentId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const cardId = parseInt(req.params.id, 10);
    const ownerId = await resolveCardOwner(cardId);
    if (ownerId === null) {
      return res.status(404).json({ error: 'Card not found' });
    }
    if (ownerId !== currentId) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to edit this card' });
    }

    let updatedDb;
    try {
      updatedDb = await db.updateCard(cardId, req.body);
    } catch (err) {
      return res.status(503).json({
        error: 'This card could not be saved to the database. Nothing was changed.',
        details: err?.message || null,
        hint: dbErrorHint(err),
      });
    }
    if (updatedDb) {
      await invalidatePublicTreeCacheForTree(updatedDb.treeId ?? updatedDb.tree_id);
      return res.json(updatedDb);
    }

    const cardIndex = store.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return res.status(404).json({ error: 'Card not found' });

    store.cards[cardIndex] = {
      ...store.cards[cardIndex],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    res.json(store.cards[cardIndex]);
  });

  // Delete Card (requires ownership of parent tree)
  app.delete('/api/admin/cards/:id', async (req, res) => {
    const currentId = req.userId;
    if (!currentId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const cardId = parseInt(req.params.id, 10);
    const ownerId = await resolveCardOwner(cardId);
    if (ownerId === null) {
      return res.status(404).json({ error: 'Card not found' });
    }
    if (ownerId !== currentId) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this card' });
    }

    await db.deleteCard(cardId);

    const cardIndex = store.cards.findIndex((c) => c.id === cardId);
    if (cardIndex !== -1) {
      store.cards.splice(cardIndex, 1);
    }
    await invalidatePublicTreeCacheForTree(await db.getCardTreeId(cardId));
    res.json({ success: true, id: cardId });
  });

  // Sync whole tree and cards state to database (requires ownership)
  app.post('/api/admin/trees/:id/sync', async (req, res) => {
    const currentId = req.userId;
    if (!currentId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const treeId = parseInt(req.params.id, 10);
    const tree = await resolveTree(treeId);
    if (!tree) {
      return res.status(404).json({ error: 'Tree not found' });
    }
    if (tree.ownerId !== currentId) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this tree' });
    }

    const { treeUpdates, cards } = req.body;
    if (treeUpdates?.slug) {
      const cleanSlug = treeUpdates.slug.toLowerCase().trim();
      // Only a real change needs the uniqueness check.
      if (cleanSlug !== tree.slug) {
        const available = await isSlugAvailableGlobally(cleanSlug, treeId);
        if (!available) {
          return res.status(409).json({ error: 'This URL slug is already taken or invalid' });
        }
      }
    }

    // The tree settings and the cards do not depend on each other, so they are
    // written at the same time. The save then takes as long as the slowest
    // write instead of the sum of both.
    const treeWrite = treeUpdates
      ? db.updateTree(treeId, treeUpdates)
      : Promise.resolve(null);
    const cardsWrite =
      Array.isArray(cards) && cards.length > 0
        ? db.syncTreeCards(treeId, cards)
        : Array.isArray(cards) && cards.length === 0
          // An empty list means "I have no cards", which is also what a failed
          // load looks like. Deleting cards is done one by one, so keep the
          // live ones.
          ? db.getCards(treeId).then((c) => c || [])
          : Promise.resolve([]);

    const [savedTree, savedCards] = await Promise.all([
      treeWrite.catch((err) => ({ __error: err })),
      cardsWrite.catch((err) => ({ __error: err })),
    ]);

    if (savedTree?.__error) {
      return res.status(503).json({
        success: false,
        error: 'The tree could not be saved to the database. Nothing was changed.',
        details: savedTree.__error?.message || null,
        hint: dbErrorHint(savedTree.__error),
      });
    }
    if (savedCards?.__error) {
      return res.status(503).json({
        success: false,
        error: 'The cards could not be saved to the database. Nothing was changed.',
        details: savedCards.__error?.message || null,
        hint: dbErrorHint(savedCards.__error),
      });
    }

    if (treeUpdates) {
      const treeIdx = store.trees.findIndex((t) => t.id === treeId);
      if (treeIdx !== -1) {
        store.trees[treeIdx] = { ...store.trees[treeIdx], ...(savedTree || treeUpdates) };
      }
      store.cards = store.cards.filter((c) => c.treeId !== treeId);
      store.cards.push(...savedCards);
    }

    const finalTree = savedTree
      ? { ...savedTree, cards: savedCards }
      : (await db.getTreeById(treeId)) || store.trees.find((t) => t.id === treeId);
    invalidatePublicTreeCache(finalTree?.slug || treeUpdates?.slug);
    res.json({
      success: true,
      tree: finalTree,
      cards: savedCards,
      message: 'Tree and cards successfully saved to database',
    });
  });
}
