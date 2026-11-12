/**
 * What a visitor sees, and the tracking of views and clicks.
 */
import { db } from '../db/db.js';
import { supabase } from '../db/supabase.js';
import { store } from '../lib/store.js';
import { authRateLimiter, trackRateLimiter, trackIpLimiter } from '../lib/rate-limit.js';
import { safeEqual, dbErrorHint } from '../lib/errors.js';
import {
  resolveTree,
  resolveTreeOwner,
  resolveCardOwner,
  isSlugAvailableGlobally,
  isCallerSuperAdmin,
  isTreeOwnerBlocked,
  isOwnerStateBlocked,
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
export function registerPublicRoutes(app) {
  // Public Tree Page
  //
  // The answer is kept by the edge for a very short while, so a visitor
  // gets the page without waiting for the server to wake up. The owner who
  // is looking at their own page asks for a fresh copy with ?owner=1.
  app.get('/api/public/trees/:slug', async (req, res) => {
    const slug = req.params.slug.replace(/^@/, '').toLowerCase();

    // A visitor gets the copy of the edge. The owner wants the truth.
    const wantsFresh = req.query.owner !== undefined;
    const cacheControl = wantsFresh
      ? 'private, no-cache'
      : 'public, max-age=0, s-maxage=15, stale-while-revalidate=300';
    res.setHeader('Cache-Control', cacheControl);

    const suspendedResponse = () =>
      res.status(403).json({
        error: 'Account Suspended',
        isBlocked: true,
        slug,
        message: 'This digital card is temporarily unavailable because the account has been locked. Please contact the administrator at indiataps.vercel.app or india.taps7@gmail.com.',
      });

    // 1. Check in-memory fast cache.
    //    The lock check comes first: a blocked account must not be served from
    //    the cache.
    const cached = publicTreeCache.get(slug);
    if (cached && Date.now() - cached.timestamp < PUBLIC_CACHE_TTL_MS) {
      const cachedAdminId = cached.payload?.tree?.adminId ?? cached.payload?.tree?.admin_id;
      if (await isTreeOwnerBlocked(cachedAdminId, slug)) {
        return suspendedResponse();
      }
      return res.json(cached.payload);
    }

    const dbTree = await db.getTreeBySlug(slug);
    if (dbTree) {
      const adminId = dbTree.admin_id ?? dbTree.adminId;
      // The state of the owner came with the tree: no second question to
      // the database.
      const known = isOwnerStateBlocked(dbTree.ownerState);
      const isBlocked = known === null ? await isTreeOwnerBlocked(adminId, slug) : known;
      if (isBlocked) {
        return suspendedResponse();
      }

      // Views are counted once per page load by the /api/track beacon.
      // Counting here as well would inflate the number.

      let rawCards = dbTree.cards || [];
      if (rawCards.length === 0) {
        rawCards = store.cards.filter((c) => c.treeId === dbTree.id);
      }

      const publicCards = rawCards
        .filter((c) => c.visible !== false)
        .map(toPublicCard)
        .sort((a, b) => (a.position || 0) - (b.position || 0));

      const payload = {
        tree: sanitizeTreeForPublic(dbTree),
        cards: publicCards,
      };

      publicTreeCache.set(slug, { payload, timestamp: Date.now() });
      return res.json(payload);
    }

    const tree = store.trees.find((t) => t.slug === slug && !t.deletedAt && t.status === 'live');
    if (!tree) return res.status(404).json({ error: 'Tree not found or unpublished' });

    const isBlocked = await isTreeOwnerBlocked(tree.adminId, slug);
    if (isBlocked) {
      return res.status(403).json({
        error: 'Account Suspended',
        isBlocked: true,
        slug,
        message: 'This digital card is temporarily unavailable because the account has been locked. Please contact the administrator at indiataps.vercel.app or india.taps7@gmail.com.',
      });
    }

    const publicCards = store.cards
      .filter((c) => c.treeId === tree.id && c.visible !== false)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    const payload = {
      tree: sanitizeTreeForPublic(tree),
      cards: publicCards,
    };

    publicTreeCache.set(slug, { payload, timestamp: Date.now() });
    res.json(payload);
  });

  // Public Click Tracker
  app.post('/api/public/cards/:id/click', trackRateLimiter, trackIpLimiter, async (req, res) => {
    const cardId = parseInt(req.params.id, 10);
    await db.incrementCardClicks(cardId);

    const localCard = store.cards.find((c) => c.id === cardId);
    if (localCard) {
      localCard.clicks = (localCard.clicks || 0) + 1;
    }

    // The tree id must come from the database: the in-memory card list is empty
    // in production, so the tree counter was never incremented.
    const treeId = localCard?.treeId ?? (await db.getCardTreeId(cardId));

    await db.recordAnalyticsEvent({
      treeId,
      cardId,
      eventType: 'card_click',
      referrer: req.headers['referer'] || req.headers['referrer'],
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.socket?.remoteAddress,
      visitorId: req.headers['x-visitor-id'] || null,
    });

    res.json({ success: true, id: cardId });
  });

  // Public: check the passcode of a protected card and hand back the link.
  // The passcode itself is never sent to the browser.
  app.post('/api/public/cards/:id/unlock', trackRateLimiter, async (req, res) => {
    const cardId = parseInt(req.params.id, 10);
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
    if (!code) {
      return res.status(400).json({ error: 'Passcode is required' });
    }

    const card = await db.getCardById(cardId);
    if (!card) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const expected = card.lockValue || card.lock_value;
    if (!expected) {
      return res.status(403).json({ error: 'This link has no passcode set' });
    }

    if (!safeEqual(code, expected)) {
      return res.status(403).json({ error: 'Incorrect access code' });
    }

    res.json({ success: true, url: card.url, title: card.title });
  });

  // Public View Tracker (handles navigator.sendBeacon from public cards)
  app.post('/api/track', trackRateLimiter, trackIpLimiter, async (req, res) => {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      }
      if (!body || typeof body !== 'object') body = {};

      const treeId = body.treeId ? parseInt(body.treeId, 10) : null;
      if (treeId) {
        // The database only accepts page_view / card_click / social_click.
        const eventType = body.eventType === 'card_click' ? 'card_click' : 'page_view';
        await db.recordAnalyticsEvent({
          treeId,
          eventType,
          referrer: req.headers['referer'] || req.headers['referrer'],
          userAgent: req.headers['user-agent'],
          ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress,
          visitorId: req.headers['x-visitor-id'] || body.visitorId || null,
        });
      }
      res.json({ success: true });
    } catch {
      // Tracking must never break the page for the visitor.
      res.json({ success: true });
    }
  });
}
