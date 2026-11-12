/**
 * The trees (public pages) of an account.
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
export function registerTreeRoutes(app) {
  // Check Slug Availability globally
  app.get('/api/admin/trees/check-slug/:slug', async (req, res) => {
    const slug = req.params.slug.toLowerCase().trim();
    const available = await isSlugAvailableGlobally(slug);
    res.json({
      available,
      reason: available ? undefined : 'Reserved keyword or already claimed by another card',
    });
  });

  // List Trees (filtered strictly by current authenticated user)
  app.get('/api/admin/trees', async (req, res) => {
    const currentId = req.userId;
    if (!currentId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const dbTrees = await db.getTrees(currentId);
    if (dbTrees !== null) {
      return res.json(dbTrees);
    }

    const activeTrees = store.trees
      .filter((t) => !t.deletedAt && t.adminId === currentId)
      .map((t) => {
        const treeCards = store.cards.filter((c) => c.treeId === t.id);
        return {
          ...t,
          cardCount: treeCards.length,
        };
      });
    res.json(activeTrees);
  });

  // Create Tree (enforces global slug uniqueness and ownership)
  app.post('/api/admin/trees', async (req, res) => {
    const currentId = req.userId;
    if (!currentId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, slug, title } = req.body;
    if (!slug || slug.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    const cleanSlug = slug.toLowerCase().trim();
    const available = await isSlugAvailableGlobally(cleanSlug);
    if (!available) {
      return res.status(409).json({ error: 'This URL slug is already taken or reserved across IndiaTaps' });
    }

    const adminId = currentId;
    const createdDbTree = await db.createTree({
      adminId,
      name: name || cleanSlug,
      slug: cleanSlug,
      title: title || cleanSlug,
    });
    if (createdDbTree) {
      store.trees.push(createdDbTree);
      return res.status(201).json(createdDbTree);
    }

    const newTree = {
      id: Date.now(),
      adminId,
      name: name || cleanSlug,
      slug: cleanSlug,
      status: 'live',
      title: title || cleanSlug,
      bio: '',
      avatarUrl: null,
      themeId: 'classic-light',
      customTheme: {
        name: 'Classic Clean',
        backgroundType: 'solid',
        backgroundValue: '#F3F3F1',
        buttonStyle: 'fill',
        buttonColor: '#FFFFFF',
        buttonTextColor: '#111111',
        buttonRadius: 9999,
        fontFamily: 'Inter',
        textColor: '#111111',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.trees.push(newTree);
    res.status(201).json(newTree);
  });

  // Get Tree Details with Cards (requires ownership)
  // The numbers of a tree: views, clicks, where the visitors came from.
  app.get('/api/admin/trees/:id/analytics', async (req, res) => {
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
      return res.status(403).json({ error: 'Forbidden: You do not have permission to see this tree' });
    }

    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 7), 365);
    const analytics = await db.getTreeAnalytics(treeId, days);
    if (!analytics) {
      return res.status(503).json({ error: 'The numbers could not be read from the database.' });
    }
    res.json(analytics);
  });

  app.get('/api/admin/trees/:id', async (req, res) => {
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
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view or edit this tree' });
    }

    const dbTree = await db.getTreeById(treeId);
    if (dbTree) {
      return res.json(dbTree);
    }

    const tree = store.trees.find((t) => t.id === treeId && !t.deletedAt);
    if (!tree) return res.status(404).json({ error: 'Tree not found' });

    const treeCards = store.cards.filter((c) => c.treeId === treeId);
    res.json({ ...tree, cards: treeCards });
  });

  // Update Tree (requires ownership & global slug uniqueness check)
  app.put('/api/admin/trees/:id', async (req, res) => {
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
      return res.status(403).json({ error: 'Forbidden: You do not have permission to edit this tree' });
    }

    if (req.body.slug) {
      const cleanSlug = req.body.slug.toLowerCase().trim();
      // Only a real change needs the uniqueness check. Checking every time
      // costs a database round trip on every save.
      if (cleanSlug !== tree.slug) {
        const available = await isSlugAvailableGlobally(cleanSlug, treeId);
        if (!available) {
          return res.status(409).json({ error: 'This URL slug is already taken or invalid' });
        }
      }
    }

    // Remember the slug the tree had before this change. A renamed tree must
    // also stop being served under its old URL.
    const previousSlug = (await db.getTreeById(treeId))?.slug;

    let updatedDb;
    try {
      updatedDb = await db.updateTree(treeId, req.body);
    } catch (err) {
      return res.status(503).json({
        error: 'This tree could not be saved to the database. Nothing was changed.',
        details: err?.message || null,
        hint: dbErrorHint(err),
      });
    }
    if (updatedDb) {
      invalidatePublicTreeCache(updatedDb.slug || req.body?.slug);
      if (previousSlug && previousSlug !== updatedDb.slug) {
        invalidatePublicTreeCache(previousSlug);
      }
      // The slug may have changed, so the cached copy is stale now.
      treeInfoCache.delete(treeId);
      return res.json(updatedDb);
    }

    const treeIndex = store.trees.findIndex((t) => t.id === treeId && !t.deletedAt);
    if (treeIndex === -1) return res.status(404).json({ error: 'Tree not found' });

    const updatedTree = {
      ...store.trees[treeIndex],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    store.trees[treeIndex] = updatedTree;
    invalidatePublicTreeCache(updatedTree.slug);
    res.json(updatedTree);
  });

  // Delete Tree (requires ownership)
  app.delete('/api/admin/trees/:id', async (req, res) => {
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
      return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this tree' });
    }

    await db.deleteTree(treeId);

    const treeIndex = store.trees.findIndex((t) => t.id === treeId);
    if (treeIndex !== -1) {
      store.trees[treeIndex].deletedAt = new Date().toISOString();
    }
    // A deleted tree must stop being public right away.
    await invalidatePublicTreeCacheForTree(treeId);
    treeInfoCache.delete(treeId);
    res.json({ success: true, id: treeId });
  });

  // Restore Tree (undo a delete, requires ownership)
  app.post('/api/admin/trees/:id/restore', async (req, res) => {
    const currentId = req.userId;
    if (!currentId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const treeId = parseInt(req.params.id, 10);
    const info = await db.getTreeInfo(treeId, { includeDeleted: true });
    if (!info) {
      return res.status(404).json({ error: 'Tree not found' });
    }
    if (info.adminId !== currentId) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to restore this tree' });
    }
    if (!info.deletedAt) {
      // Nothing to restore, it is already there.
      return res.json({ success: true, restored: false, tree: await db.getTreeById(treeId) });
    }

    // A deleted tree keeps its slug, so nobody else can have taken it.
    const slugTaken = await db.isSlugUsedByOtherTree(info.slug, treeId);
    if (slugTaken) {
      return res.status(409).json({
        error: `The address /${info.slug} was taken while this card was deleted. Change the address first, then restore.`,
      });
    }

    try {
      const restored = await db.restoreTree(treeId);
      treeInfoCache.delete(treeId);
      invalidatePublicTreeCache(restored?.slug || info.slug);
      return res.json({ success: true, restored: true, tree: restored });
    } catch (err) {
      return res.status(503).json({
        success: false,
        error: 'This card could not be restored. Nothing was changed.',
        details: err?.message || null,
        hint: dbErrorHint(err),
      });
    }
  });
}
