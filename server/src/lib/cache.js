/**
 * The caches of the server.
 *
 * The public tree cache keeps the public pages fast. It is emptied as soon as
 * an owner saves, so a change is live on the next request.
 */
import { db } from '../db/db.js';
import { supabase } from '../db/supabase.js';
import { store } from './store.js';
import { toPublicCard, sanitizeTreeForPublic } from './public-payload.js';

// The owner and the slug of a tree are cached for a short time: every admin
// request needs them, and a database round trip takes about half a second.
export const treeInfoCache = new Map();
export const TREE_INFO_CACHE_TTL_MS = 30 * 1000;

export async function getTreeInfo(treeId) {
  const cached = treeInfoCache.get(treeId);
  if (cached && Date.now() - cached.timestamp < TREE_INFO_CACHE_TTL_MS) {
    return cached.info;
  }
  const info = await db.getTreeInfo(treeId);
  if (info) {
    treeInfoCache.set(treeId, { info, timestamp: Date.now() });
  }
  return info;
}

// High-performance In-Memory Cache for Public Tree Pages
export const publicTreeCache = new Map();
export const PUBLIC_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes fast cache

export function invalidatePublicTreeCache(slug) {
  if (slug) {
    const clean = slug.replace(/^@/, '').toLowerCase();
    publicTreeCache.delete(clean);
  } else {
    publicTreeCache.clear();
  }
}

/**
 * Drop the cached public page of a tree after one of its cards changed,
 * so a deleted or edited card disappears right away.
 */
export async function invalidatePublicTreeCacheForTree(treeId) {
  try {
    const tree = await db.getTreeById(treeId);
    if (tree?.slug) {
      invalidatePublicTreeCache(tree.slug);
      return;
    }
  } catch {
    // fall through to the safe fallback
  }
  invalidatePublicTreeCache();
}

/**
 * Shape a card for the public page.
 * The passcode (lock value) is never included: the visitor gets the link back
 * only after the server has checked the code.
 */

export async function warmUpPublicTreeCache() {
  try {
    const { data: trees } = await supabase
      .from('trees')
      .select('*, cards(*)')
      .is('deleted_at', null)
      .eq('status', 'live');

    if (trees && trees.length > 0) {
      for (const t of trees) {
        if (!t.slug) continue;
        const rawCards = Array.isArray(t.cards) ? t.cards : [];
        const publicCards = rawCards
          .filter((c) => c.visible !== false)
          .map(toPublicCard)
          .sort((a, b) => (a.position || 0) - (b.position || 0));

        const avatarUrl = t.avatar_url || t.custom_theme?.avatarUrl || null;
        const logoUrl = t.logo_url || t.custom_theme?.logoUrl || null;
        const bannerUrl = t.banner_url || t.custom_theme?.bannerUrl || null;
        const heroUrl = t.hero_url || t.custom_theme?.heroUrl || null;
        const titleStyle = t.title_style || t.custom_theme?.titleStyle || 'text';
        const titleFont = t.title_font || t.custom_theme?.titleFont || 'Inter';
        const titleColor = t.title_color || t.custom_theme?.titleColor || '#111111';
        const headerLayout = t.header_layout || t.custom_theme?.headerLayout || 'classic';

        const payload = {
          tree: sanitizeTreeForPublic({
            ...t,
            adminId: Number(t.admin_id),
            themeId: t.theme_id,
            avatarUrl,
            avatar_url: avatarUrl,
            logoUrl,
            logo_url: logoUrl,
            bannerUrl,
            banner_url: bannerUrl,
            heroUrl,
            hero_url: heroUrl,
            titleStyle,
            title_style: titleStyle,
            titleFont,
            title_font: titleFont,
            titleColor,
            title_color: titleColor,
            headerLayout,
            header_layout: headerLayout,
            altFontEnabled: t.alt_font_enabled ?? t.custom_theme?.altFontEnabled ?? false,
            footerEnabled: t.footer_enabled ?? t.custom_theme?.footerEnabled ?? true,
            footerText: t.footer_text || t.custom_theme?.footerText || 'IndiaTaps',
            socialLinks: t.social_links || t.custom_theme?.socialLinks || [],
            seo: t.seo || t.custom_theme?.seo || { title: '', description: '', faviconUrl: '' },
            customTheme: t.custom_theme,
          }),
          cards: publicCards,
        };

        publicTreeCache.set(t.slug.toLowerCase(), { payload, timestamp: Date.now() });
      }
    }
  } catch (err) {
    console.warn('[Cache Warmup error]', err.message);
  }
}
