/**
 * Who owns what, and is that account allowed to work.
 */
import { db } from '../db/db.js';
import { supabase } from '../db/supabase.js';
import { store, RESERVED_SLUGS } from './store.js';
import { getTreeInfo } from './cache.js';

// Ownership & Slug Verification Helpers
// The database is the source of truth. The in-memory store only answers when
// the database has no such row, so its seed ids can never shadow a real tree.

/**
 * Owner and slug of a tree, or null when there is no such tree.
 */
export async function resolveTree(treeId) {
  const info = await getTreeInfo(treeId);
  if (info) return { ownerId: info.adminId, slug: info.slug };

  const memTree = store.trees.find((t) => t.id === treeId && !t.deletedAt);
  if (memTree) return { ownerId: memTree.adminId, slug: memTree.slug };
  return null;
}

export async function resolveTreeOwner(treeId) {
  const tree = await resolveTree(treeId);
  return tree ? tree.ownerId : null;
}

export async function resolveCardOwner(cardId) {
  const dbOwner = await db.getCardOwner(cardId);
  if (dbOwner !== null && dbOwner !== undefined) return dbOwner;
  const memCard = store.cards.find((c) => c.id === cardId);
  if (!memCard) return null;
  const memTree = store.trees.find((t) => t.id === memCard.treeId && !t.deletedAt);
  return memTree ? memTree.adminId : null;
}

export async function isSlugAvailableGlobally(slug, excludeTreeId = null) {
  const cleanSlug = slug.toLowerCase().trim();
  if (RESERVED_SLUGS.includes(cleanSlug)) return false;
  if (!/^[a-z0-9-]+$/.test(cleanSlug) || cleanSlug.length < 3 || cleanSlug.length > 30) return false;

  const takenInDb = await db.isSlugTaken(cleanSlug, excludeTreeId);
  if (takenInDb) return false;

  const takenInStore = store.trees.some(
    (t) => t.slug.toLowerCase() === cleanSlug && !t.deletedAt && (excludeTreeId ? t.id !== excludeTreeId : true)
  );
  return !takenInStore;
}

// Super Admin Permission Verifier
export async function isCallerSuperAdmin(userId) {
  if (!userId) return false;
  const user = (await db.getUserById(userId)) || store.users.find((u) => u.id === userId);
  if (!user) return false;
  return user.email?.toLowerCase() === 'sparshkoul6@gmail.com' || user.role === 'super_admin' || user.accountType === 'super_admin';
}

// High-performance User & Block State Cache
const userBlockedCache = new Map();
const USER_BLOCKED_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Is this account locked? The state comes with the tree, so the answer
 * costs nothing.
 * @param {object|null} state the state of the owner
 * @returns {boolean|null} null when there is no state to look at
 */
export function isOwnerStateBlocked(state) {
  if (!state) return null;
  const accountState = state.accountState ?? state.account_state;
  const tier = state.tier;
  const blocked = state.isBlocked ?? state.is_blocked;
  return accountState === 'locked' || tier === 'blocked' || blocked === true;
}

// Check if tree owner account is blocked/locked
export async function isTreeOwnerBlocked(adminId, slug = null) {
  const cacheKey = adminId ? `id:${adminId}` : `slug:${slug?.toLowerCase()}`;
  const cached = userBlockedCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < USER_BLOCKED_CACHE_TTL_MS) {
    return cached.isBlocked;
  }

  let isBlocked = false;
  if (adminId) {
    const memoryUser = store.users.find((u) => u.id === Number(adminId));
    if (memoryUser) {
      if (memoryUser.account_state === 'locked' || memoryUser.isBlocked || memoryUser.tier === 'blocked' || memoryUser.status === 'blocked') {
        isBlocked = true;
      }
    } else {
      try {
        const { data: user } = await supabase.from('users').select('id, tier, account_state').eq('id', Number(adminId)).single();
        if (user && (user.account_state === 'locked' || user.tier === 'blocked')) {
          isBlocked = true;
        }
      } catch {}
    }
  } else if (slug) {
    const memoryUser = store.users.find((u) => u.username && u.username.toLowerCase() === slug.toLowerCase());
    if (memoryUser) {
      if (memoryUser.account_state === 'locked' || memoryUser.isBlocked || memoryUser.tier === 'blocked' || memoryUser.status === 'blocked') {
        isBlocked = true;
      }
    } else {
      try {
        const { data: user } = await supabase.from('users').select('id, tier, account_state').ilike('username', slug.toLowerCase()).single();
        if (user && (user.account_state === 'locked' || user.tier === 'blocked')) {
          isBlocked = true;
        }
      } catch {}
    }
  }

  userBlockedCache.set(cacheKey, { isBlocked, timestamp: Date.now() });
  return isBlocked;
}
