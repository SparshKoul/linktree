import crypto from 'crypto';
import { supabase } from './supabase.js';

/**
 * The column visitor_hash came with migration 003. A database that has not
 * run that migration yet must still work: the column is left out of the
 * question when it is not there. The answer is remembered, so the check is
 * paid only once.
 * null = not known yet, true = there, false = not there
 */
let visitorHashSupported = null;

/**
 * Whether an error is only about the column visitor_hash.
 * @param {object|null} error
 * @returns {boolean}
 */
function isMissingVisitorHash(error) {
  if (!error) return false;
  const message = String(error.message || '');
  if (!/visitor_hash/i.test(message)) return false;
  return /(does not exist|not exist|unknown column|schema cache|invalid column)/i.test(message);
}

/**
 * A name for a visitor of an event that was written before the visitor
 * column existed: the address and the browser together.
 * @param {string|null} ipHash
 * @param {string|null} userAgent
 * @returns {string|null}
 */
function visitorKeyFromOldEvent(ipHash, userAgent) {
  if (!ipHash && !userAgent) return null;
  return crypto
    .createHash('sha256')
    .update(`${ipHash || ''}|${userAgent || ''}`)
    .digest('hex')
    .substring(0, 16);
}
import { hashPassword, verifyPassword } from '../utils/password.js';
import { sanitizeCardUrl, sanitizeCardSettings } from '../utils/url.js';

/**
 * The fields of a card that belong to the owner, and the column each one is
 * stored in.
 *
 * Every place that writes a card uses this list. A field can therefore never
 * be saved on one path (an edit) and dropped on another (Save tree).
 */
const CARD_COLUMN_BY_FIELD = {
  type: 'type',
  title: 'title',
  subtitle: 'subtitle',
  url: 'url',
  thumbnailUrl: 'thumbnail_url',
  position: 'position',
  visible: 'visible',
  layout: 'layout',
  animation: 'animation',
  lockType: 'lock_type',
  lockValue: 'lock_value',
  pinned: 'pinned',
  groupName: 'group_name',
  scheduledStart: 'scheduled_start',
  scheduledEnd: 'scheduled_end',
};

// The same field can arrive with either spelling.
const CARD_FIELD_BY_KEY = {
  ...Object.fromEntries(Object.keys(CARD_COLUMN_BY_FIELD).map((field) => [field, field])),
  thumbnail_url: 'thumbnailUrl',
  lock_type: 'lockType',
  lock_value: 'lockValue',
  group_name: 'groupName',
  scheduled_start: 'scheduledStart',
  scheduled_end: 'scheduledEnd',
};

/**
 * The database columns for the fields of a card that are being set.
 * @param {object} updates
 * @returns {object}
 */
function cardColumnsFrom(updates) {
  const columns = {};
  for (const [key, value] of Object.entries(updates || {})) {
    const field = CARD_FIELD_BY_KEY[key];
    if (!field || value === undefined) continue;
    columns[CARD_COLUMN_BY_FIELD[field]] = value;
  }
  return columns;
}

/**
 * A card as the rest of the app reads it. Every path that returns a card
 * uses this, so a field can never be saved but not read back.
 * @param {object} c
 * @returns {object}
 */
function formatCardRecord(c) {
  if (!c) return null;
  return {
    ...c,
    id: Number(c.id),
    treeId: Number(c.tree_id ?? c.treeId),
    type: c.type,
    title: c.title,
    subtitle: c.subtitle,
    url: c.url,
    thumbnailUrl: c.thumbnail_url ?? c.thumbnailUrl,
    clicks: Number(c.clicks || 0),
    position: c.position,
    visible: c.visible,
    layout: c.layout,
    animation: c.animation,
    lockType: c.lock_type ?? c.lockType ?? 'none',
    lockValue: c.lock_value ?? c.lockValue ?? null,
    pinned: c.pinned ?? false,
    groupName: c.group_name ?? c.groupName ?? null,
    scheduledStart: c.scheduled_start ?? c.scheduledStart ?? null,
    scheduledEnd: c.scheduled_end ?? c.scheduledEnd ?? null,
    settings: c.settings || {},
    createdAt: c.created_at ?? c.createdAt,
    updatedAt: c.updated_at ?? c.updatedAt,
  };
}

export function formatTreeRecord(data, cards = null, cardCount = 0) {
  if (!data) return null;
  const custom = data.custom_theme || {};

  const avatarUrl = custom.avatarUrl || data.avatar_url || data.avatarUrl || null;
  const headerLayout = custom.headerLayout || data.header_layout || data.headerLayout || 'classic';
  const bannerUrl = custom.bannerUrl || data.banner_url || data.bannerUrl || null;
  const heroUrl = custom.heroUrl || data.hero_url || data.heroUrl || null;
  const logoUrl = custom.logoUrl || data.logo_url || data.logoUrl || null;
  const titleStyle = custom.titleStyle || data.title_style || data.titleStyle || 'text';
  const altFontEnabled = custom.altFontEnabled !== undefined ? custom.altFontEnabled : (data.alt_font_enabled ?? (data.altFontEnabled ?? false));
  const titleFont = custom.titleFont || data.title_font || data.titleFont || 'Inter';
  const titleColor = custom.titleColor || data.title_color || data.titleColor || '#111111';
  const footerEnabled = custom.footerEnabled !== undefined ? custom.footerEnabled : (data.footer_enabled ?? (data.footerEnabled ?? true));
  const footerText = custom.footerText || data.footer_text || data.footerText || 'IndiaTaps';
  const socialLinks = custom.socialLinks || data.social_links || data.socialLinks || [];
  const seo = custom.seo || data.seo || { title: '', description: '', faviconUrl: '' };

  const syncedCustomTheme = {
    ...custom,
    avatarUrl,
    headerLayout,
    bannerUrl,
    heroUrl,
    logoUrl,
    titleStyle,
    altFontEnabled,
    titleFont,
    titleColor,
    footerEnabled,
    footerText,
    socialLinks,
    seo,
  };

  const formatted = {
    ...data,
    id: Number(data.id),
    adminId: Number(data.admin_id),
    name: data.name,
    slug: data.slug,
    status: data.status,
    title: data.title,
    bio: data.bio || '',
    avatarUrl,
    avatar_url: avatarUrl,
    themeId: data.theme_id || data.themeId,
    customTheme: syncedCustomTheme,
    headerLayout,
    header_layout: headerLayout,
    bannerUrl,
    banner_url: bannerUrl,
    heroUrl,
    hero_url: heroUrl,
    logoUrl,
    logo_url: logoUrl,
    titleStyle,
    title_style: titleStyle,
    altFontEnabled,
    alt_font_enabled: altFontEnabled,
    titleFont,
    title_font: titleFont,
    titleColor,
    title_color: titleColor,
    footerEnabled,
    footer_enabled: footerEnabled,
    footerText,
    footer_text: footerText,
    socialLinks,
    social_links: socialLinks,
    seo,
    viewsCount: Number(data.views_count || 0),
    clicksCount: Number(data.clicks_count || 0),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  if (cards !== null) {
    formatted.cards = cards;
  }
  if (cardCount !== undefined && cardCount !== null) {
    formatted.cardCount = cardCount;
  }

  return formatted;
}

export { cardColumnsFrom, formatCardRecord, CARD_COLUMN_BY_FIELD };

export const db = {
  // --- Trees ---
  async getTrees(adminId) {
    try {
      let query = supabase.from('trees').select('*, cards:cards(count)').is('deleted_at', null);
      if (adminId) {
        query = query.eq('admin_id', adminId);
      }
      const { data, error } = await query.order('id', { ascending: true });
      if (error) throw error;
      return data.map((t) => formatTreeRecord(t, null, t.cards?.[0]?.count || 0));
    } catch (err) {
      console.warn('[DB getTrees fallback]', err.message);
      return null;
    }
  },

  async getTreeById(id) {
    try {
      const { data, error } = await supabase
        .from('trees')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      if (!data) return null;

      const cards = await this.getCards(id);
      return formatTreeRecord(data, cards);
    } catch (err) {
      console.warn('[DB getTreeById fallback]', err.message);
      return null;
    }
  },

  async getTreeBySlug(slug) {
    try {
      const cleanSlug = slug.toLowerCase().trim();
      // Only live trees are public. Draft and archived trees must never be
      // served to visitors.
      let { data: list, error } = await supabase
        .from('trees')
        .select('*, cards(*)')
        .eq('slug', cleanSlug)
        .eq('status', 'live')
        .is('deleted_at', null)
        .order('id', { ascending: false })
        .limit(1);

      if (error || !list || list.length === 0) {
        const fallback = await supabase
          .from('trees')
          .select('*, cards(*)')
          .eq('slug', cleanSlug)
          .eq('status', 'live')
          .is('deleted_at', null)
          .order('id', { ascending: false })
          .limit(1);
        list = fallback.data;
      }

      const data = list?.[0];
      if (!data) return null;

      const rawCards = Array.isArray(data.cards) ? data.cards : await this.getCards(data.id);
      const cards = (rawCards || []).map((c) => formatCardRecord({ ...c, tree_id: c.tree_id ?? data.id }));

      return formatTreeRecord(data, cards);
    } catch (err) {
      console.warn('[DB getTreeBySlug fallback]', err.message);
      return null;
    }
  },

  async createTree(treeData) {
    try {
      const { data, error } = await supabase
        .from('trees')
        .insert({
          admin_id: treeData.adminId,
          name: treeData.name,
          slug: treeData.slug,
          status: treeData.status || 'live',
          title: treeData.title,
          bio: treeData.bio || '',
          theme_id: treeData.themeId || 'classic-light',
          custom_theme: treeData.customTheme || {},
        })
        .select()
        .single();
      if (error) throw error;
      return formatTreeRecord(data);
    } catch (err) {
      console.warn('[DB createTree fallback]', err.message);
      return null;
    }
  },

  async updateTree(id, updates) {
    try {
      const payload = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.bio !== undefined) payload.bio = updates.bio;

      // 1. Parallelize any pending base64 uploads (avatar, banner, hero, logo, background)
      const uploadPromises = [];

      let finalAvatar = updates.avatarUrl ?? updates.avatar_url;
      if (typeof finalAvatar === 'string' && finalAvatar.startsWith('data:image')) {
        uploadPromises.push(
          this.uploadAsset({
            base64Data: finalAvatar,
            filename: 'avatar.jpg',
            folder: 'avatars',
            treeId: id,
          }).then((cdn) => {
            if (cdn) finalAvatar = cdn;
          })
        );
      }

      // The picture of the theme. It is not in a column of its own, so it
      // would stay inside the tree and make every page of it slow.
      let themeAvatar = updates.customTheme?.avatarUrl;
      if (typeof themeAvatar === 'string' && themeAvatar.startsWith('data:image')) {
        uploadPromises.push(
          this.uploadAsset({
            base64Data: themeAvatar,
            filename: 'avatar.jpg',
            folder: 'avatars',
            treeId: id,
          }).then((cdn) => {
            if (cdn) themeAvatar = cdn;
          })
        );
      }

      let banner = updates.bannerUrl ?? updates.customTheme?.bannerUrl;
      if (typeof banner === 'string' && banner.startsWith('data:image')) {
        uploadPromises.push(
          this.uploadAsset({
            base64Data: banner,
            filename: 'banner.png',
            folder: 'banners',
            treeId: id,
          }).then((cdn) => {
            if (cdn) banner = cdn;
          })
        );
      }

      let hero = updates.heroUrl ?? updates.customTheme?.heroUrl;
      if (typeof hero === 'string' && hero.startsWith('data:image')) {
        uploadPromises.push(
          this.uploadAsset({
            base64Data: hero,
            filename: 'hero.png',
            folder: 'heroes',
            treeId: id,
          }).then((cdn) => {
            if (cdn) hero = cdn;
          })
        );
      }

      let logo = updates.logoUrl ?? updates.customTheme?.logoUrl;
      if (typeof logo === 'string' && logo.startsWith('data:image')) {
        uploadPromises.push(
          this.uploadAsset({
            base64Data: logo,
            filename: 'logo.png',
            folder: 'logos',
            treeId: id,
          }).then((cdn) => {
            if (cdn) logo = cdn;
          })
        );
      }

      let bgImg = updates.customTheme?.backgroundImageUrl;
      if (typeof bgImg === 'string' && bgImg.startsWith('data:image')) {
        uploadPromises.push(
          this.uploadAsset({
            base64Data: bgImg,
            filename: 'wallpaper.jpg',
            folder: 'wallpapers',
            treeId: id,
          }).then((cdn) => {
            if (cdn) bgImg = cdn;
          })
        );
      }

      // The wallpaper of a video style is a picture too. It must not stay
      // inside the tree: a picture of a few megabytes makes every page of
      // the tree slow to open.
      let wallpaperVideo = updates.customTheme?.wallpaperVideoUrl;
      if (typeof wallpaperVideo === 'string' && wallpaperVideo.startsWith('data:image')) {
        uploadPromises.push(
          this.uploadAsset({
            base64Data: wallpaperVideo,
            filename: 'wallpaper.png',
            folder: 'wallpapers',
            treeId: id,
          }).then((cdn) => {
            if (cdn) wallpaperVideo = cdn;
          })
        );
      }

      // The background may hold the picture inside a url("data:..."). It is
      // taken out and put on the storage, so that the tree does not carry
      // megabytes of picture.
      const baseTheme = updates.customTheme || updates.custom_theme || {};
      let backgroundValue = baseTheme.backgroundValue;
      const dataInside =
        typeof backgroundValue === 'string'
          ? backgroundValue.match(/url\(["']?(data:image\/[^)"']+)["']?\)/)
          : null;
      if (dataInside) {
        const picture = dataInside[1];
        uploadPromises.push(
          this.uploadAsset({
            base64Data: picture,
            filename: 'wallpaper.jpg',
            folder: 'wallpapers',
            treeId: id,
          }).then((cdn) => {
            if (cdn) {
              backgroundValue = backgroundValue.replace(dataInside[0], `url("${cdn}")`);
            }
          })
        );
      }

      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      if (finalAvatar !== undefined) payload.avatar_url = finalAvatar;

      if (updates.themeId !== undefined || updates.theme_id !== undefined) {
        payload.theme_id = updates.themeId || updates.theme_id;
      }

      // Sync top-level table columns and custom_theme in parallel
      const headerLayoutVal = updates.headerLayout ?? updates.header_layout ?? updates.customTheme?.headerLayout ?? updates.custom_theme?.headerLayout;
      if (headerLayoutVal !== undefined) payload.header_layout = headerLayoutVal;

      if (banner !== undefined) payload.banner_url = banner;
      if (hero !== undefined) payload.hero_url = hero;
      if (logo !== undefined) payload.logo_url = logo;

      const titleStyleVal = updates.titleStyle ?? updates.title_style ?? updates.customTheme?.titleStyle ?? updates.custom_theme?.titleStyle;
      if (titleStyleVal !== undefined) payload.title_style = titleStyleVal;

      const titleFontVal = updates.titleFont ?? updates.title_font ?? updates.customTheme?.titleFont ?? updates.custom_theme?.titleFont;
      if (titleFontVal !== undefined) payload.title_font = titleFontVal;

      const titleColorVal = updates.titleColor ?? updates.title_color ?? updates.customTheme?.titleColor ?? updates.custom_theme?.titleColor;
      if (titleColorVal !== undefined) payload.title_color = titleColorVal;

      const altFontVal = updates.altFontEnabled ?? updates.alt_font_enabled ?? updates.customTheme?.altFontEnabled ?? updates.custom_theme?.altFontEnabled;
      if (altFontVal !== undefined) payload.alt_font_enabled = altFontVal;

      const footerEnabledVal = updates.footerEnabled ?? updates.footer_enabled ?? updates.customTheme?.footerEnabled ?? updates.custom_theme?.footerEnabled;
      if (footerEnabledVal !== undefined) payload.footer_enabled = footerEnabledVal;

      const footerTextVal = updates.footerText ?? updates.footer_text ?? updates.customTheme?.footerText ?? updates.custom_theme?.footerText;
      if (footerTextVal !== undefined) payload.footer_text = footerTextVal;

      const socialLinksVal = updates.socialLinks ?? updates.social_links ?? updates.customTheme?.socialLinks ?? updates.custom_theme?.socialLinks;
      if (socialLinksVal !== undefined) payload.social_links = socialLinksVal;

      const seoVal = updates.seo ?? updates.customTheme?.seo ?? updates.custom_theme?.seo;
      if (seoVal !== undefined) payload.seo = seoVal;

      // Ensure custom_theme has all properties synced
      let existingTheme = {};
      try {
        const { data: curr } = await supabase.from('trees').select('custom_theme').eq('id', id).single();
        if (curr?.custom_theme) existingTheme = curr.custom_theme;
      } catch {}

      payload.custom_theme = {
        ...existingTheme,
        ...baseTheme,
        ...(backgroundValue !== undefined ? { backgroundValue } : {}),
        ...(headerLayoutVal !== undefined ? { headerLayout: headerLayoutVal } : {}),
        ...(banner !== undefined ? { bannerUrl: banner } : {}),
        ...(hero !== undefined ? { heroUrl: hero } : {}),
        ...(titleStyleVal !== undefined ? { titleStyle: titleStyleVal } : {}),
        ...(logo !== undefined ? { logoUrl: logo } : {}),
        ...(bgImg !== undefined ? { backgroundImageUrl: bgImg } : {}),
        ...(wallpaperVideo !== undefined ? { wallpaperVideoUrl: wallpaperVideo } : {}),
        ...(themeAvatar !== undefined ? { avatarUrl: themeAvatar } : {}),
        ...(altFontVal !== undefined ? { altFontEnabled: altFontVal } : {}),
        ...(titleFontVal !== undefined ? { titleFont: titleFontVal } : {}),
        ...(titleColorVal !== undefined ? { titleColor: titleColorVal } : {}),
        ...(footerEnabledVal !== undefined ? { footerEnabled: footerEnabledVal } : {}),
        ...(footerTextVal !== undefined ? { footerText: footerTextVal } : {}),
        ...(socialLinksVal !== undefined ? { socialLinks: socialLinksVal } : {}),
        ...(seoVal !== undefined ? { seo: seoVal } : {}),
      };

      if (updates.status !== undefined) payload.status = updates.status;
      payload.deleted_at = null;
      payload.updated_at = new Date().toISOString();

      let { data, error } = await supabase
        .from('trees')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      // If Postgres reports column error (if migration hasn't been executed yet), fallback to core columns
      if (error && error.message?.toLowerCase().includes('column')) {
        const safePayload = {
          ...(payload.name ? { name: payload.name } : {}),
          ...(payload.title ? { title: payload.title } : {}),
          ...(payload.bio !== undefined ? { bio: payload.bio } : {}),
          ...(payload.avatar_url ? { avatar_url: payload.avatar_url } : {}),
          ...(payload.theme_id ? { theme_id: payload.theme_id } : {}),
          ...(payload.custom_theme ? { custom_theme: payload.custom_theme } : {}),
          ...(payload.status ? { status: payload.status } : {}),
          updated_at: new Date().toISOString(),
        };
        const fallbackRes = await supabase.from('trees').update(safePayload).eq('id', id).select().single();
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (error) throw error;
      return formatTreeRecord(data);
    } catch (err) {
      console.warn('[DB updateTree failed]', err.message);
      throw err;
    }
  },

  async deleteTree(id) {
    try {
      const { error } = await supabase
        .from('trees')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[DB deleteTree fallback]', err.message);
      return false;
    }
  },

  async restoreTree(id) {
    try {
      const { data, error } = await supabase
        .from('trees')
        .update({ deleted_at: null })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data ? formatTreeRecord(data) : null;
    } catch (err) {
      console.warn('[DB restoreTree failed]', err.message);
      throw err;
    }
  },

  async isSlugTaken(slug, excludeTreeId = null) {
    try {
      const cleanSlug = slug.toLowerCase().trim();
      let query = supabase
        .from('trees')
        .select('id')
        .eq('slug', cleanSlug)
        .is('deleted_at', null);
      if (excludeTreeId) {
        query = query.neq('id', excludeTreeId);
      }
      const { data, error } = await query.limit(1);
      if (error) throw error;
      return Array.isArray(data) && data.length > 0;
    } catch (err) {
      console.warn('[DB isSlugTaken fallback]', err.message);
      return false;
    }
  },

  async getTreeInfo(treeId, { includeDeleted = false } = {}) {
    try {
      const numId = Number(treeId);
      if (!numId || isNaN(numId)) return null;
      let query = supabase
        .from('trees')
        .select('admin_id, slug, deleted_at')
        .eq('id', numId);
      if (!includeDeleted) query = query.is('deleted_at', null);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { adminId: Number(data.admin_id), slug: data.slug, deletedAt: data.deleted_at };
    } catch (err) {
      console.warn('[DB getTreeInfo fallback]', err.message);
      // undefined = the database could not answer, null = no such tree
      return undefined;
    }
  },

  /**
   * Is this slug used by another tree, deleted or not? A deleted tree keeps
   * its slug, so restoring it can fail when the slug was taken meanwhile.
   */
  async isSlugUsedByOtherTree(slug, treeId = null) {
    try {
      const cleanSlug = String(slug).toLowerCase().trim();
      let query = supabase.from('trees').select('id').eq('slug', cleanSlug);
      if (treeId) query = query.neq('id', treeId);
      const { data, error } = await query.limit(1);
      if (error) throw error;
      return Array.isArray(data) && data.length > 0;
    } catch (err) {
      console.warn('[DB isSlugUsedByOtherTree fallback]', err.message);
      return false;
    }
  },

  async getTreeOwner(treeId) {
    try {
      const numId = Number(treeId);
      if (!numId || isNaN(numId)) return null;
      const { data, error } = await supabase
        .from('trees')
        .select('admin_id')
        .eq('id', numId)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw error;
      return data ? Number(data.admin_id) : null;
    } catch (err) {
      console.warn('[DB getTreeOwner fallback]', err.message);
      // undefined = the database could not answer, null = no such tree
      return undefined;
    }
  },

  async getCardOwner(cardId) {
    try {
      const numId = Number(cardId);
      if (!numId || isNaN(numId)) return null;
      const { data: card, error: cardErr } = await supabase
        .from('cards')
        .select('tree_id')
        .eq('id', numId)
        .maybeSingle();
      if (cardErr) throw cardErr;
      if (!card) return null;
      return await this.getTreeOwner(card.tree_id);
    } catch (err) {
      console.warn('[DB getCardOwner fallback]', err.message);
      return undefined;
    }
  },

  // --- Cards ---
  async getCardById(id) {
    try {
      const numId = Number(id);
      if (!numId || isNaN(numId)) return null;
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('id', numId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return formatCardRecord(data);
    } catch (err) {
      console.warn('[DB getCardById fallback]', err.message);
      return null;
    }
  },

  async getCards(treeId) {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('tree_id', treeId)
        .order('position', { ascending: true });
      if (error) throw error;
      return data.map(formatCardRecord);
    } catch (err) {
      console.warn('[DB getCards fallback]', err.message);
      return null;
    }
  },

  async createCard(cardData) {
    try {
      let finalThumb = cardData.thumbnailUrl || cardData.thumbnail_url || null;
      if (typeof finalThumb === 'string' && finalThumb.startsWith('data:image')) {
        const cdnThumb = await this.uploadAsset({
          base64Data: finalThumb,
          filename: 'thumbnail.jpg',
          folder: 'thumbnails',
        });
        if (cdnThumb) finalThumb = cdnThumb;
      }

      let finalUrl = cardData.url || '';
      if (typeof finalUrl === 'string' && (finalUrl.startsWith('data:application/pdf') || finalUrl.startsWith('data:image'))) {
        const isPdf = finalUrl.startsWith('data:application/pdf');
        const cdnPdf = await this.uploadAsset({
          base64Data: finalUrl,
          filename: isPdf ? (cardData.settings?.pdfName || 'menu.pdf') : 'card-asset.jpg',
          folder: isPdf ? 'menus' : 'cards',
        });
        if (cdnPdf) finalUrl = cdnPdf;
      }

      const settings = { ...(cardData.settings || {}) };
      if (typeof settings.image === 'string' && settings.image.startsWith('data:image')) {
        const cdnImg = await this.uploadAsset({
          base64Data: settings.image,
          filename: 'card-image.jpg',
          folder: 'cards',
        });
        if (cdnImg) settings.image = cdnImg;
      }
      if (typeof settings.thumbnailUrl === 'string' && settings.thumbnailUrl.startsWith('data:image')) {
        const cdnThumb = await this.uploadAsset({
          base64Data: settings.thumbnailUrl,
          filename: 'thumbnail.jpg',
          folder: 'thumbnails',
        });
        if (cdnThumb) settings.thumbnailUrl = cdnThumb;
      }
      if (typeof settings.pdfUrl === 'string' && settings.pdfUrl.startsWith('data:application/pdf')) {
        const cdnPdf = await this.uploadAsset({
          base64Data: settings.pdfUrl,
          filename: settings.pdfName || 'menu.pdf',
          folder: 'menus',
        });
        if (cdnPdf) settings.pdfUrl = cdnPdf;
      }

      const columns = cardColumnsFrom({
        ...cardData,
        url: sanitizeCardUrl(finalUrl),
        thumbnailUrl: finalThumb,
        type: cardData.type || 'link',
        title: cardData.title || '',
        subtitle: cardData.subtitle || '',
        position: cardData.position || 0,
        visible: cardData.visible ?? true,
        animation: cardData.animation || 'none',
        layout: cardData.layout || cardData.settings?.layout || 'classic',
        lockType: cardData.lockType || cardData.lock_type || 'none',
        lockValue: cardData.lockValue || cardData.lock_value || null,
      });

      const { data, error } = await supabase
        .from('cards')
        .insert({
          tree_id: cardData.treeId || cardData.tree_id,
          ...columns,
          settings: sanitizeCardSettings(settings, cardData.type),
        })
        .select()
        .single();
      if (error) throw error;
      return {
        ...data,
        id: Number(data.id),
        treeId: Number(data.tree_id),
        thumbnailUrl: data.thumbnail_url,
        lockType: data.lock_type,
        lockValue: data.lock_value,
      };
    } catch (err) {
      console.warn('[DB createCard failed]', err.message);
      throw err;
    }
  },

  async updateCard(id, updates) {
    try {
      // Every field of the card that is being set, in one place.
      const payload = cardColumnsFrom(updates);
      delete payload.settings;

      if (updates.url !== undefined) {
        if (typeof updates.url === 'string' && (updates.url.startsWith('data:application/pdf') || updates.url.startsWith('data:image'))) {
          const isPdf = updates.url.startsWith('data:application/pdf');
          const cdnPdf = await this.uploadAsset({
            base64Data: updates.url,
            filename: isPdf ? (updates.settings?.pdfName || 'menu.pdf') : 'card-asset.jpg',
            folder: isPdf ? 'menus' : 'cards',
          });
          payload.url = sanitizeCardUrl(cdnPdf || updates.url);
        } else {
          // An unsafe address (for example "javascript:") is dropped.
          payload.url = sanitizeCardUrl(updates.url);
        }
      }

      const thumb = updates.thumbnailUrl ?? updates.thumbnail_url;
      if (thumb !== undefined) {
        if (typeof thumb === 'string' && thumb.startsWith('data:image')) {
          const cdnThumb = await this.uploadAsset({
            base64Data: thumb,
            filename: 'thumbnail.jpg',
            folder: 'thumbnails',
          });
          payload.thumbnail_url = cdnThumb || thumb;
        } else {
          payload.thumbnail_url = thumb;
        }
      }

      if (updates.settings !== undefined) {
        let existingSettings = {};
        let existingType = updates.type;
        try {
          const { data: cur } = await supabase
            .from('cards')
            .select('settings, type')
            .eq('id', id)
            .maybeSingle();
          if (cur?.settings && typeof cur.settings === 'object') {
            existingSettings = cur.settings;
          }
          existingType = cur?.type;
        } catch {}

        const settings = { ...existingSettings, ...updates.settings };
        if (typeof settings.image === 'string' && settings.image.startsWith('data:image')) {
          const cdnImg = await this.uploadAsset({
            base64Data: settings.image,
            filename: 'card-image.jpg',
            folder: 'cards',
          });
          if (cdnImg) settings.image = cdnImg;
        }
        if (typeof settings.thumbnailUrl === 'string' && settings.thumbnailUrl.startsWith('data:image')) {
          const cdnThumb = await this.uploadAsset({
            base64Data: settings.thumbnailUrl,
            filename: 'thumbnail.jpg',
            folder: 'thumbnails',
          });
          if (cdnThumb) settings.thumbnailUrl = cdnThumb;
        }
        if (typeof settings.pdfUrl === 'string' && settings.pdfUrl.startsWith('data:application/pdf')) {
          const cdnPdf = await this.uploadAsset({
            base64Data: settings.pdfUrl,
            filename: settings.pdfName || 'menu.pdf',
            folder: 'menus',
          });
          if (cdnPdf) settings.pdfUrl = cdnPdf;
        }
        // Unsafe addresses inside the settings are dropped as well, and the
        // address is only kept for a map card.
        const cleanedSettings = sanitizeCardSettings(settings, existingType);
        payload.settings = cleanedSettings;
        // The layout of the card is shown from the settings, so the column has
        // to follow it.
        if (cleanedSettings.layout !== undefined) payload.layout = cleanedSettings.layout;
      }
      if (updates.clicks !== undefined) payload.clicks = updates.clicks;
      payload.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('cards')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return formatCardRecord(data);
    } catch (err) {
      console.warn('[DB updateCard failed]', err.message);
      throw err;
    }
  },

  async deleteCard(id) {
    try {
      const { error } = await supabase.from('cards').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[DB deleteCard fallback]', err.message);
      return false;
    }
  },

  async syncTreeCards(treeId, cards) {
    try {
      if (!Array.isArray(cards)) return [];

      // 1. Parallelize asset uploads across all cards
      const preparedCards = await Promise.all(
        cards.map(async (c, i) => {
          let finalThumb = c.thumbnailUrl ?? c.thumbnail_url ?? null;
          if (typeof finalThumb === 'string' && finalThumb.startsWith('data:image')) {
            const cdnThumb = await this.uploadAsset({
              base64Data: finalThumb,
              filename: 'thumbnail.jpg',
              folder: 'thumbnails',
              treeId,
            });
            if (cdnThumb) finalThumb = cdnThumb;
          }

          let finalUrl = c.url || '';
          if (typeof finalUrl === 'string' && (finalUrl.startsWith('data:application/pdf') || finalUrl.startsWith('data:image'))) {
            const isPdf = finalUrl.startsWith('data:application/pdf');
            const cdnPdf = await this.uploadAsset({
              base64Data: finalUrl,
              filename: isPdf ? (c.settings?.pdfName || 'menu.pdf') : 'card-asset.jpg',
              folder: isPdf ? 'menus' : 'cards',
              treeId,
            });
            if (cdnPdf) finalUrl = cdnPdf;
          }

          const settings = { ...(c.settings || {}) };
          if (typeof settings.image === 'string' && settings.image.startsWith('data:image')) {
            const cdnImg = await this.uploadAsset({
              base64Data: settings.image,
              filename: 'card-image.jpg',
              folder: 'cards',
              treeId,
            });
            if (cdnImg) settings.image = cdnImg;
          }
          if (typeof settings.thumbnailUrl === 'string' && settings.thumbnailUrl.startsWith('data:image')) {
            const cdnThumb = await this.uploadAsset({
              base64Data: settings.thumbnailUrl,
              filename: 'thumbnail.jpg',
              folder: 'thumbnails',
              treeId,
            });
            if (cdnThumb) settings.thumbnailUrl = cdnThumb;
          }
          if (typeof settings.pdfUrl === 'string' && settings.pdfUrl.startsWith('data:application/pdf')) {
            const cdnPdf = await this.uploadAsset({
              base64Data: settings.pdfUrl,
              filename: settings.pdfName || 'menu.pdf',
              folder: 'menus',
              treeId,
            });
            if (cdnPdf) settings.pdfUrl = cdnPdf;
          }

          // Handle gallery images if present
          if (Array.isArray(settings.images)) {
            settings.images = await Promise.all(
              settings.images.map(async (imgItem) => {
                const imgUrl = typeof imgItem === 'string' ? imgItem : imgItem?.url;
                if (typeof imgUrl === 'string' && imgUrl.startsWith('data:image')) {
                  const cdnImg = await this.uploadAsset({
                    base64Data: imgUrl,
                    filename: 'gallery-img.jpg',
                    folder: 'gallery',
                    treeId,
                  });
                  if (cdnImg) {
                    return typeof imgItem === 'string' ? cdnImg : { ...imgItem, url: cdnImg };
                  }
                }
                return imgItem;
              })
            );
          }

          return {
            clientId: c.id ?? c.cardId ?? null,
            tree_id: treeId,
            ...cardColumnsFrom({
              type: c.type || 'link',
              title: c.title || '',
              subtitle: c.subtitle || '',
              url: sanitizeCardUrl(finalUrl),
              thumbnailUrl: finalThumb,
              position: i,
              visible: c.visible ?? true,
              animation: c.animation || 'none',
              layout: c.settings?.layout || c.layout || 'classic',
              lockType: c.lockType || c.lock_type || 'none',
              lockValue: c.lockValue || c.lock_value || null,
              pinned: c.pinned,
              groupName: c.groupName ?? c.group_name,
              scheduledStart: c.scheduledStart ?? c.scheduled_start,
              scheduledEnd: c.scheduledEnd ?? c.scheduled_end,
            }),
            settings: sanitizeCardSettings(settings, c.type || 'link'),
          };
        })
      );

      // 2. Update the cards that already exist and insert the new ones.
      //    Nothing is deleted first, so a rejected card can never wipe the
      //    cards that are already live. Clicks are left untouched.
      //
      //    Each card is written in parallel: try to update it, and insert it
      //    when there is no row with that id yet. That keeps the save to one
      //    round trip instead of one per card.
      const savedCards = await Promise.all(
        preparedCards.map(async (prepared) => {
          const row = {
            ...cardColumnsFrom(prepared),
            settings: sanitizeCardSettings(prepared.settings),
            updated_at: new Date().toISOString(),
          };

          if (prepared.clientId) {
            const { data, error } = await supabase
              .from('cards')
              .update(row)
              .eq('id', Number(prepared.clientId))
              .select();
            if (error) throw error;
            // The row is gone: the card is new, so insert it.
            if (!data || data.length === 0) {
              const inserted = await supabase
                .from('cards')
                .insert({ ...row, tree_id: prepared.tree_id })
                .select()
                .single();
              if (inserted.error) throw inserted.error;
              return inserted.data;
            }
            return data[0];
          }

          const { data, error } = await supabase
            .from('cards')
            .insert({ ...row, tree_id: prepared.tree_id })
            .select()
            .single();
          if (error) throw error;
          return data;
        })
      );

      // 3. Remove the cards that are no longer in the list.
      const keptIds = savedCards.map((c) => Number(c.id));
      if (keptIds.length > 0) {
        const { error } = await supabase
          .from('cards')
          .delete()
          .eq('tree_id', treeId)
          .not('id', 'in', `(${keptIds.join(',')})`);
        if (error) throw error;
      }

      return savedCards.map(formatCardRecord);
    } catch (err) {
      console.warn('[DB syncTreeCards failed]', err.message);
      throw err;
    }
  },

  /**
   * Compare-and-swap counter increment, used when the database functions are
   * not installed yet. Two requests that read the same value cannot both
   * write it: the second one no longer matches the old value, so it retries.
   */
  async incrementCounter(table, id, column, maxRetries = 25) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { data, error } = await supabase
        .from(table)
        .select(column)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return false;

      const current = Number(data[column] || 0);
      const { data: updated, error: updateError } = await supabase
        .from(table)
        .update({ [column]: current + 1 })
        .eq('id', id)
        .eq(column, current)
        .select(column);
      if (updateError) throw updateError;
      if (updated && updated.length > 0) return true;

      // Someone else changed it first. Back off a little and try again.
      await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 8)));
    }
    return false;
  },

  /**
   * Call a database counter function if it exists, otherwise fall back to the
   * compare-and-swap loop. The function is the exact one: the increment
   * happens inside the database, so parallel clicks can never be lost.
   */
  async incrementWithFunction(functionName, argument, fallback) {
    try {
      const { data, error } = await supabase.rpc(functionName, argument);
      if (!error && data !== null && data !== undefined) return true;
      if (error) {
        const message = String(error.message || '');
        const missing =
          error.code === 'PGRST202' ||
          message.includes('does not exist') ||
          message.includes('not exist');
        if (!missing) console.warn(`[DB ${functionName}]`, message);
      }
    } catch (err) {
      console.warn(`[DB ${functionName}]`, err.message);
    }
    return fallback();
  },

  async incrementCardClicks(id) {
    try {
      return await this.incrementWithFunction(
        'increment_card_clicks',
        { p_card_id: Number(id) },
        () => this.incrementCounter('cards', id, 'clicks')
      );
    } catch (err) {
      console.warn('[DB incrementCardClicks fallback]', err.message);
      return false;
    }
  },

  async incrementTreeViews(id) {
    try {
      return await this.incrementWithFunction(
        'increment_tree_views',
        { p_tree_id: Number(id) },
        () => this.incrementCounter('trees', id, 'views_count')
      );
    } catch (err) {
      console.warn('[DB incrementTreeViews fallback]', err.message);
      return false;
    }
  },

  async incrementTreeClicks(id) {
    try {
      return await this.incrementWithFunction(
        'increment_tree_clicks',
        { p_tree_id: Number(id) },
        () => this.incrementCounter('trees', id, 'clicks_count')
      );
    } catch (err) {
      console.warn('[DB incrementTreeClicks fallback]', err.message);
      return false;
    }
  },

  async getCardTreeId(id) {
    try {
      const numId = Number(id);
      if (!numId || isNaN(numId)) return null;
      const { data, error } = await supabase
        .from('cards')
        .select('tree_id')
        .eq('id', numId)
        .maybeSingle();
      if (error) throw error;
      return data ? Number(data.tree_id) : null;
    } catch (err) {
      console.warn('[DB getCardTreeId fallback]', err.message);
      return null;
    }
  },

  // --- Users ---
  async getUserById(id) {
    try {
      const numId = Number(id);
      if (!numId || isNaN(numId)) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', numId)
        .single();
      if (error) throw error;
      if (!data) return null;
      const isSuper = data.email?.toLowerCase() === 'sparshkoul6@gmail.com' || data.role === 'super_admin';
      return {
        ...data,
        role: isSuper ? 'super_admin' : (data.role || 'client'),
        accountType: isSuper ? 'super_admin' : (data.account_type || data.role || 'client'),
        isSuperAdmin: isSuper,
      };
    } catch (err) {
      return null;
    }
  },

  async getUserByEmailOrUsername(identifier) {
    try {
      const clean = identifier.toLowerCase().trim();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`email.ilike.${clean},username.ilike.${clean}`)
        .limit(1);
      if (error) throw error;
      const user = data?.[0];
      if (!user) return null;
      const isSuper = user.email?.toLowerCase() === 'sparshkoul6@gmail.com' || user.role === 'super_admin';
      const accountState = user.account_state || (user.tier === 'blocked' ? 'locked' : 'active');
      return {
        ...user,
        role: isSuper ? 'super_admin' : (user.role || 'client'),
        accountType: isSuper ? 'super_admin' : (user.account_type || user.role || 'client'),
        accountState,
        account_state: accountState,
        isBlocked: accountState === 'locked' || user.tier === 'blocked' || user.role === 'blocked',
        isSuperAdmin: isSuper,
      };
    } catch (err) {
      console.warn('[DB getUserByEmailOrUsername fallback]', err.message);
      return null;
    }
  },

  async getUserByUsername(username) {
    try {
      const clean = username.toLowerCase().trim();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('username', clean)
        .limit(1);
      if (error) throw error;
      return data?.[0] || null;
    } catch (err) {
      console.warn('[DB getUserByUsername fallback]', err.message);
      return null;
    }
  },

  async createUser({ email, username, password }) {
    try {
      const hashedPassword = /^\$2[aby]\$\d+\$/.test(password)
        ? password
        : await hashPassword(password);

      const { data, error } = await supabase
        .from('users')
        .insert({
          email: email.trim().toLowerCase(),
          username: username.trim().toLowerCase(),
          password: hashedPassword,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[DB createUser fallback]', err.message);
      return null;
    }
  },

  // --- Supabase Auth Integration ---
  async signUpUser({ email, username, password }) {
    try {
      const cleanEmail = email.trim().toLowerCase();
      let cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || `user_${Date.now()}`;

      // Check if username already exists for a DIFFERENT user in public.users, disambiguate if so
      let candidateUsername = cleanUsername;
      let counter = 1;
      while (true) {
        const existing = await this.getUserByUsername(candidateUsername);
        if (!existing || existing.email === cleanEmail) {
          cleanUsername = candidateUsername;
          break;
        }
        candidateUsername = `${cleanUsername}${counter++}`;
      }

      // 1. Create in Supabase Auth (auto-confirmed)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: { username: cleanUsername },
      });

      if (authError) {
        const errMsg = (authError.message || '').toLowerCase();
        const isAlreadyExists =
          errMsg.includes('already') ||
          errMsg.includes('exists') ||
          authError.code === 'email_exists' ||
          authError.status === 422;

        if (isAlreadyExists) {
          // If user exists in Auth, sync their password
          try {
            const { data: listData } = await supabase.auth.admin.listUsers();
            const existingAuth = listData?.users?.find(
              (u) => u.email?.toLowerCase() === cleanEmail
            );
            if (existingAuth) {
              await supabase.auth.admin.updateUserById(existingAuth.id, {
                password,
                user_metadata: { username: cleanUsername },
              });
            }
          } catch (listErr) {
            console.warn('[DB signUpUser sync password warning]', listErr.message);
          }
        } else {
          throw authError;
        }
      }

      // 2. Insert into public.users
      let user = await this.getUserByEmailOrUsername(cleanEmail);
      if (!user) {
        user = await this.createUser({ email: cleanEmail, username: cleanUsername, password });
      }

      // 3. Create default primary tree if needed
      if (user) {
        const trees = await this.getTrees(user.id);
        if (!trees || trees.length === 0) {
          await this.createTree({
            adminId: user.id,
            name: cleanUsername,
            slug: cleanUsername,
            title: cleanUsername,
          });
        }
      }

      return user;
    } catch (err) {
      console.warn('[DB signUpUser error]', err.message);
      throw err;
    }
  },

  async signInUser({ identifier, password }) {
    try {
      const clean = identifier.trim().toLowerCase();
      let targetEmail = clean;
      let user = null;
      if (!clean.includes('@')) {
        user = await this.getUserByEmailOrUsername(clean);
        if (user) targetEmail = user.email;
      } else {
        user = await this.getUserByEmailOrUsername(clean);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (error) {
        // Fallback to local table check if exists
        if (user && (await verifyPassword(password, user.password))) {
          // If legacy plain-text password, upgrade to bcrypt hash in table
          if (!/^\$2[aby]\$\d+\$/.test(user.password)) {
            hashPassword(password).then((upgraded) => {
              supabase.from('users').update({ password: upgraded }).eq('id', user.id).catch(() => {});
            }).catch(() => {});
          }
          return user;
        }
        throw error;
      }

      if (!user) {
        user = await this.getUserByEmailOrUsername(targetEmail);
      }
      if (!user) {
        // The password was correct for a Supabase auth account that has no
        // profile in public.users. There is no account to sign in to, and
        // inventing an id would hand out somebody else's account.
        throw new Error('No account is set up for this email address');
      }
      return user;
    } catch (err) {
      console.warn('[DB signInUser error]', err.message);
      throw err;
    }
  },

  async syncOAuthUser({ email, username }) {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanUsername = (username || cleanEmail.split('@')[0]).replace(/[^a-z0-9-]/g, '');

      let user = await this.getUserByEmailOrUsername(cleanEmail);
      if (!user) {
        user = await this.createUser({ email: cleanEmail, username: cleanUsername, password: crypto.randomUUID() });
      }
      if (user) {
        const trees = await this.getTrees(user.id);
        if (!trees || trees.length === 0) {
          await this.createTree({
            adminId: user.id,
            name: cleanUsername,
            slug: cleanUsername,
            title: cleanUsername,
          });
        }
      }
      return user;
    } catch (err) {
      console.warn('[DB syncOAuthUser error]', err.message);
      return null;
    }
  },

  // --- Storage ---
  async uploadAsset({ base64Data, filename, folder = 'uploads', adminId, treeId }) {
    try {
      if (!base64Data) return null;
      let mimeType = 'application/octet-stream';
      let base64Content = base64Data;
      if (base64Data.startsWith('data:')) {
        const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Content = match[2];
        }
      }

      const buffer = Buffer.from(base64Content, 'base64');
      const rawExt = filename ? filename.split('.').pop().toLowerCase() : (mimeType.split('/')[1] || 'bin');
      const ext = rawExt === 'pnj' ? 'png' : rawExt;
      const cleanFolder = (folder || 'uploads').replace(/^\/+|\/+$/g, '');
      const subDir = treeId ? `tree_${treeId}` : 'common';
      const cleanName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = `${cleanFolder}/${subDir}/${cleanName}`;

      const { data, error } = await supabase.storage
        .from('linktree-assets')
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('linktree-assets')
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl || null;

      // Log asset record into assets table if table exists
      if (publicUrl) {
        supabase
          .from('assets')
          .insert({
            admin_id: adminId || null,
            tree_id: treeId || null,
            bucket: 'linktree-assets',
            file_path: filePath,
            public_url: publicUrl,
            folder: cleanFolder,
            mime_type: mimeType,
            size_bytes: buffer.length,
          })
          .then(() => {})
          .catch(() => {});
      }

      return publicUrl;
    } catch (err) {
      console.warn('[DB uploadAsset error]', err.message);
      return null;
    }
  },

  async deleteAsset({ filePath, publicUrl }) {
    try {
      let targetPath = filePath;
      if (!targetPath && publicUrl) {
        const marker = '/linktree-assets/';
        const idx = publicUrl.indexOf(marker);
        if (idx !== -1) {
          targetPath = publicUrl.substring(idx + marker.length);
        }
      }
      if (!targetPath) return false;

      const { error } = await supabase.storage
        .from('linktree-assets')
        .remove([targetPath]);

      if (error) throw error;

      supabase
        .from('assets')
        .delete()
        .eq('file_path', targetPath)
        .then(() => {})
        .catch(() => {});

      return true;
    } catch (err) {
      console.warn('[DB deleteAsset error]', err.message);
      return false;
    }
  },

  async getAssetByPath({ filePath, publicUrl }) {
    try {
      let targetPath = filePath;
      if (!targetPath && publicUrl) {
        const marker = '/linktree-assets/';
        const idx = publicUrl.indexOf(marker);
        if (idx !== -1) {
          targetPath = publicUrl.substring(idx + marker.length);
        }
      }
      if (!targetPath) return null;

      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('file_path', targetPath)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    } catch (err) {
      console.warn('[DB getAssetByPath fallback]', err.message);
      return null;
    }
  },

  /**
   * The numbers of a tree for the dashboard.
   * Everything is worked out from the events of the last few weeks, so the
   * screen always matches what the table holds.
   * @param {number} treeId
   * @param {number} [days] how many days to look at
   */
  async getTreeAnalytics(treeId, days = 30) {
    try {
      const numId = Number(treeId);
      if (!numId || isNaN(numId)) return null;

      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // The visitor column is only asked for when the database has it.
      const readEvents = async (withVisitor) => {
        const columns = withVisitor
          ? 'event_type, card_id, referrer, device_type, visitor_hash, ip_hash, user_agent, created_at'
          : 'event_type, card_id, referrer, device_type, ip_hash, user_agent, created_at';
        return supabase
          .from('analytics_events')
          .select(columns)
          .eq('tree_id', numId)
          .gte('created_at', since)
          .limit(20000);
      };

      let { data, error } = await readEvents(visitorHashSupported !== false);
      if (error && visitorHashSupported !== false && isMissingVisitorHash(error)) {
        visitorHashSupported = false;
        ({ data, error } = await readEvents(false));
      } else if (!error) {
        visitorHashSupported = true;
      }
      if (error) throw error;

      const events = data || [];

      // The tree and its cards are asked for at the same time as the events:
      // one round trip instead of three in a row.
      const [treeRow, cardRows] = await Promise.all([
        supabase
          .from('trees')
          .select('views_count, clicks_count')
          .eq('id', numId)
          .maybeSingle(),
        supabase.from('cards').select('id, title, type').eq('tree_id', numId),
      ]);
      const tree = treeRow.data || {};
      const cards = cardRows.data || [];

      const daily = {};
      const dayKey = (value) => String(value).slice(0, 10);
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        daily[dayKey(date.toISOString())] = { views: 0, clicks: 0 };
      }

      const referrers = {};
      const devices = { mobile: 0, desktop: 0 };
      const perCard = {};
      const visitors = new Set();
      let views = 0;
      let clicks = 0;

      for (const event of events) {
        const key = dayKey(event.created_at);
        if (!daily[key]) daily[key] = { views: 0, clicks: 0 };

        if (event.event_type === 'card_click') {
          clicks += 1;
          daily[key].clicks += 1;
          const cardId = event.card_id ? Number(event.card_id) : null;
          if (cardId) perCard[cardId] = (perCard[cardId] || 0) + 1;
        } else {
          views += 1;
          daily[key].views += 1;
        }

        if (event.visitor_hash) {
          visitors.add(event.visitor_hash);
        } else {
          // An event from before the visitor column was there: the address
          // and the browser together still say who it was.
          const older = visitorKeyFromOldEvent(event.ip_hash, event.user_agent);
          if (older) visitors.add(older);
        }

        const device = event.device_type === 'mobile' ? 'mobile' : 'desktop';
        devices[device] += 1;

        let source = 'Direct';
        if (event.referrer) {
          try {
            const host = new URL(event.referrer).hostname.replace(/^www\./, '');
            source = host || 'Direct';
          } catch {
            source = 'Direct';
          }
        }
        referrers[source] = (referrers[source] || 0) + 1;
      }

      const topCards = Object.entries(perCard)
        .map(([cardId, count]) => {
          const card = cards.find((c) => c.id === Number(cardId));
          return {
            id: Number(cardId),
            title: card?.title || 'A card that was removed',
            type: card?.type || 'link',
            clicks: count,
          };
        })
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 8);

      const topReferrers = Object.entries(referrers)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      const today = dayKey(new Date().toISOString());
      const yesterday = dayKey(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      return {
        days,
        totals: {
          views,
          clicks,
          visitors: visitors.size,
          viewsToday: daily[today]?.views || 0,
          clicksToday: daily[today]?.clicks || 0,
          viewsYesterday: daily[yesterday]?.views || 0,
          clicksYesterday: daily[yesterday]?.clicks || 0,
          allTimeViews: Number(tree?.views_count || 0),
          allTimeClicks: Number(tree?.clicks_count || 0),
        },
        daily: Object.entries(daily).map(([date, counts]) => ({ date, ...counts })),
        devices,
        topCards,
        topReferrers,
      };
    } catch (err) {
      console.warn('[DB getTreeAnalytics fallback]', err.message);
      return null;
    }
  },

  async getAssets({ treeId, adminId, folder }) {
    try {
      let query = supabase.from('assets').select('*');
      if (treeId) query = query.eq('tree_id', treeId);
      if (adminId) query = query.eq('admin_id', adminId);
      if (folder) query = query.eq('folder', folder);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('[DB getAssets fallback]', err.message);
      return [];
    }
  },

  async recordAnalyticsEvent({ treeId, cardId, eventType, referrer, userAgent, ip, visitorId }) {
    try {
      if (!treeId) return false;
      const deviceType = /mobile|iphone|android|ipad/i.test(userAgent || '') ? 'mobile' : 'desktop';
      const ipHash = ip ? Buffer.from(ip).toString('base64').substring(0, 16) : null;
      // A hash of the visitor number, so that people can be counted apart
      // from views without keeping anything that identifies them.
      const visitorHash = visitorId
        ? crypto.createHash('sha256').update(String(visitorId)).digest('hex').substring(0, 16)
        : null;

      // 1. Log time-series event into analytics_events table
      const row = {
        tree_id: Number(treeId),
        card_id: cardId ? Number(cardId) : null,
        event_type: eventType || (cardId ? 'card_click' : 'page_view'),
        referrer: referrer ? String(referrer).substring(0, 500) : null,
        user_agent: userAgent ? String(userAgent).substring(0, 500) : null,
        device_type: deviceType,
        ip_hash: ipHash,
      };
      if (visitorHash && visitorHashSupported !== false) {
        row.visitor_hash = visitorHash;
      }

      let { error } = await supabase.from('analytics_events').insert(row);
      if (error && row.visitor_hash && isMissingVisitorHash(error)) {
        // The database has not run migration 003 yet. The event is written
        // without the visitor column rather than not written at all.
        visitorHashSupported = false;
        delete row.visitor_hash;
        ({ error } = await supabase.from('analytics_events').insert(row));
      } else if (!error && row.visitor_hash) {
        visitorHashSupported = true;
      }
      if (error) {
        console.warn('[DB recordAnalyticsEvent insert]', error.message);
      }

      // 2. Increment aggregate counter on tree (atomic, no lost updates)
      if (eventType === 'page_view') {
        await this.incrementTreeViews(treeId);
      } else if (eventType === 'card_click') {
        await this.incrementTreeClicks(treeId);
      }
      return true;
    } catch (err) {
      console.warn('[DB recordAnalyticsEvent error]', err.message);
      return false;
    }
  },
};
