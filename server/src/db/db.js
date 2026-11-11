import { supabase } from './supabase.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

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
      let { data: list, error } = await supabase
        .from('trees')
        .select('*, cards(*)')
        .eq('slug', cleanSlug)
        .is('deleted_at', null)
        .order('id', { ascending: false })
        .limit(1);

      if (error || !list || list.length === 0) {
        const fallback = await supabase
          .from('trees')
          .select('*, cards(*)')
          .eq('slug', cleanSlug)
          .order('id', { ascending: false })
          .limit(1);
        list = fallback.data;
      }

      const data = list?.[0];
      if (!data) return null;

      const rawCards = Array.isArray(data.cards) ? data.cards : await this.getCards(data.id);
      const cards = (rawCards || []).map((c) => ({
        id: Number(c.id),
        treeId: Number(c.tree_id ?? c.treeId ?? data.id),
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
        lockType: c.lock_type ?? c.lockType,
        lockValue: c.lock_value ?? c.lockValue,
        settings: c.settings || {},
        createdAt: c.created_at ?? c.createdAt,
        updatedAt: c.updated_at ?? c.updatedAt,
      }));

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

      const baseTheme = updates.customTheme || updates.custom_theme || {};
      payload.custom_theme = {
        ...existingTheme,
        ...baseTheme,
        ...(headerLayoutVal !== undefined ? { headerLayout: headerLayoutVal } : {}),
        ...(banner !== undefined ? { bannerUrl: banner } : {}),
        ...(hero !== undefined ? { heroUrl: hero } : {}),
        ...(titleStyleVal !== undefined ? { titleStyle: titleStyleVal } : {}),
        ...(logo !== undefined ? { logoUrl: logo } : {}),
        ...(bgImg !== undefined ? { backgroundImageUrl: bgImg } : {}),
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
      console.warn('[DB updateTree fallback]', err.message);
      return null;
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
      return null;
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
      if (cardErr || !card) return null;
      return await this.getTreeOwner(card.tree_id);
    } catch (err) {
      console.warn('[DB getCardOwner fallback]', err.message);
      return null;
    }
  },

  // --- Cards ---
  async getCards(treeId) {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('tree_id', treeId)
        .order('position', { ascending: true });
      if (error) throw error;
      return data.map((c) => ({
        id: Number(c.id),
        treeId: Number(c.tree_id),
        type: c.type,
        title: c.title,
        subtitle: c.subtitle,
        url: c.url,
        thumbnailUrl: c.thumbnail_url,
        clicks: c.clicks,
        position: c.position,
        visible: c.visible,
        layout: c.layout,
        animation: c.animation,
        lockType: c.lock_type,
        lockValue: c.lock_value,
        settings: c.settings || {},
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }));
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

      const { data, error } = await supabase
        .from('cards')
        .insert({
          tree_id: cardData.treeId || cardData.tree_id,
          type: cardData.type || 'link',
          title: cardData.title || '',
          subtitle: cardData.subtitle || '',
          url: finalUrl,
          thumbnail_url: finalThumb,
          position: cardData.position || 0,
          visible: cardData.visible ?? true,
          animation: cardData.animation || 'none',
          layout: cardData.layout || cardData.settings?.layout || 'classic',
          lock_type: cardData.lockType || cardData.lock_type || 'none',
          lock_value: cardData.lockValue || cardData.lock_value || null,
          settings: settings,
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
      console.warn('[DB createCard fallback]', err.message);
      return null;
    }
  },

  async updateCard(id, updates) {
    try {
      const payload = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.subtitle !== undefined) payload.subtitle = updates.subtitle;

      if (updates.url !== undefined) {
        if (typeof updates.url === 'string' && (updates.url.startsWith('data:application/pdf') || updates.url.startsWith('data:image'))) {
          const isPdf = updates.url.startsWith('data:application/pdf');
          const cdnPdf = await this.uploadAsset({
            base64Data: updates.url,
            filename: isPdf ? (updates.settings?.pdfName || 'menu.pdf') : 'card-asset.jpg',
            folder: isPdf ? 'menus' : 'cards',
          });
          payload.url = cdnPdf || updates.url;
        } else {
          payload.url = updates.url;
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

      if (updates.position !== undefined) payload.position = updates.position;
      if (updates.visible !== undefined) payload.visible = updates.visible;
      if (updates.animation !== undefined) payload.animation = updates.animation;
      if (updates.layout !== undefined) payload.layout = updates.layout;
      if (updates.lockType !== undefined || updates.lock_type !== undefined) {
        payload.lock_type = updates.lockType || updates.lock_type;
      }
      if (updates.lockValue !== undefined || updates.lock_value !== undefined) {
        payload.lock_value = updates.lockValue || updates.lock_value;
      }
      if (updates.settings !== undefined) {
        let existingSettings = {};
        try {
          const { data: cur } = await supabase
            .from('cards')
            .select('settings')
            .eq('id', id)
            .maybeSingle();
          if (cur?.settings && typeof cur.settings === 'object') {
            existingSettings = cur.settings;
          }
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
        payload.settings = settings;
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
      return {
        ...data,
        id: Number(data.id),
        treeId: Number(data.tree_id),
        thumbnailUrl: data.thumbnail_url,
      };
    } catch (err) {
      console.warn('[DB updateCard fallback]', err.message);
      return null;
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
            tree_id: treeId,
            type: c.type || 'link',
            title: c.title || '',
            subtitle: c.subtitle || '',
            url: finalUrl,
            thumbnail_url: finalThumb,
            position: i,
            visible: c.visible ?? true,
            animation: c.animation || 'none',
            layout: c.layout || c.settings?.layout || 'classic',
            lock_type: c.lockType || c.lock_type || 'none',
            lock_value: c.lockValue || c.lock_value || null,
            settings: settings,
          };
        })
      );

      // 2. Clear old cards for this tree
      await supabase.from('cards').delete().eq('tree_id', treeId);

      // 3. Bulk insert all prepared cards in a single database roundtrip
      if (preparedCards.length > 0) {
        const { data, error } = await supabase.from('cards').insert(preparedCards).select();
        if (error) throw error;
        return (data || []).map((c) => ({
          id: Number(c.id),
          treeId: Number(c.tree_id),
          type: c.type,
          title: c.title,
          subtitle: c.subtitle,
          url: c.url,
          thumbnailUrl: c.thumbnail_url,
          clicks: c.clicks,
          position: c.position,
          visible: c.visible,
          layout: c.layout,
          animation: c.animation,
          lockType: c.lock_type,
          lockValue: c.lock_value,
          settings: c.settings || {},
        }));
      }

      return [];
    } catch (err) {
      console.warn('[DB syncTreeCards fallback]', err.message);
      return null;
    }
  },

  async incrementCardClicks(id) {
    try {
      const { data: card } = await supabase.from('cards').select('clicks').eq('id', id).single();
      if (card) {
        await supabase
          .from('cards')
          .update({ clicks: (card.clicks || 0) + 1 })
          .eq('id', id);
      }
      return true;
    } catch (err) {
      console.warn('[DB incrementCardClicks fallback]', err.message);
      return false;
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
      const cleanUsername = username.trim().toLowerCase();

      // 1. Create in Supabase Auth (auto-confirmed)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: { username: cleanUsername },
      });

      if (authError && !authError.message.includes('already registered')) {
        throw authError;
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
      return user || { id: 1, email: targetEmail, username: targetEmail.split('@')[0] };
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

  async recordAnalyticsEvent({ treeId, cardId, eventType, referrer, userAgent, ip }) {
    try {
      if (!treeId) return false;
      const deviceType = /mobile|iphone|android|ipad/i.test(userAgent || '') ? 'mobile' : 'desktop';
      const ipHash = ip ? Buffer.from(ip).toString('base64').substring(0, 16) : null;

      // 1. Log time-series event into analytics_events table
      supabase
        .from('analytics_events')
        .insert({
          tree_id: Number(treeId),
          card_id: cardId ? Number(cardId) : null,
          event_type: eventType || (cardId ? 'card_click' : 'page_view'),
          referrer: referrer ? String(referrer).substring(0, 500) : null,
          user_agent: userAgent ? String(userAgent).substring(0, 500) : null,
          device_type: deviceType,
          ip_hash: ipHash,
        })
        .then(() => {})
        .catch(() => {});

      // 2. Increment aggregate counter on tree
      if (eventType === 'page_view') {
        const { data: tree } = await supabase.from('trees').select('views_count').eq('id', treeId).single();
        if (tree) {
          supabase
            .from('trees')
            .update({ views_count: Number(tree.views_count || 0) + 1 })
            .eq('id', treeId)
            .then(() => {})
            .catch(() => {});
        }
      } else if (eventType === 'card_click') {
        const { data: tree } = await supabase.from('trees').select('clicks_count').eq('id', treeId).single();
        if (tree) {
          supabase
            .from('trees')
            .update({ clicks_count: Number(tree.clicks_count || 0) + 1 })
            .eq('id', treeId)
            .then(() => {})
            .catch(() => {});
        }
      }
      return true;
    } catch (err) {
      console.warn('[DB recordAnalyticsEvent error]', err.message);
      return false;
    }
  },
};
