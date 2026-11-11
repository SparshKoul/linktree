/**
 * Uploads, the media library and the health check.
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
export function registerAssetRoutes(app) {
  // Upload Asset (Image / PDF) to Supabase Storage CDN
  app.post('/api/admin/upload', async (req, res) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { file, filename, folder, treeId } = req.body;
    if (!file) {
      return res.status(400).json({ error: 'File data is required' });
    }

    if (treeId) {
      const ownerId = await resolveTreeOwner(parseInt(treeId, 10));
      if (ownerId !== null && ownerId !== req.userId) {
        return res.status(403).json({ error: 'Forbidden: You do not own this tree' });
      }
    }

    const publicUrl = await db.uploadAsset({
      base64Data: file,
      filename,
      folder: folder || 'assets',
      adminId: req.userId,
      treeId: treeId ? parseInt(treeId, 10) : undefined,
    });

    if (publicUrl) {
      return res.json({ url: publicUrl, success: true });
    }

    // Graceful fallback to echo data URL if storage error
    res.json({ url: file, success: false, fallback: true });
  });

  // List Assets (Media Library)
  app.get('/api/admin/assets', async (req, res) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const treeId = req.query.treeId ? parseInt(req.query.treeId, 10) : undefined;
    if (treeId) {
      const ownerId = await resolveTreeOwner(treeId);
      if (ownerId !== null && ownerId !== req.userId) {
        return res.status(403).json({ error: 'Forbidden: You do not own this tree' });
      }
    }

    const folder = req.query.folder ? String(req.query.folder) : undefined;
    const assets = await db.getAssets({ treeId, adminId: req.userId, folder });
    res.json(assets);
  });

  // Delete Asset from Storage
  app.delete('/api/admin/assets', async (req, res) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { filePath, publicUrl } = req.body;
    if (!filePath && !publicUrl) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Only the owner of the file may delete it.
    const asset = await db.getAssetByPath({ filePath, publicUrl });
    if (asset) {
      const ownerId = asset.admin_id ?? asset.adminId;
      const treeId = asset.tree_id ?? asset.treeId;
      if (ownerId !== null && ownerId !== undefined && Number(ownerId) !== Number(req.userId)) {
        return res.status(403).json({ error: 'Forbidden: You do not own this file' });
      }
      if (!ownerId && treeId) {
        const treeOwner = await resolveTreeOwner(Number(treeId));
        if (treeOwner !== null && treeOwner !== Number(req.userId)) {
          return res.status(403).json({ error: 'Forbidden: You do not own this file' });
        }
      }
    }

    const success = await db.deleteAsset({ filePath, publicUrl });
    res.json({ success });
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
  app.get('/api', (req, res) => res.json({ message: 'IndiaTaps API running', status: 'ok' }));
}
