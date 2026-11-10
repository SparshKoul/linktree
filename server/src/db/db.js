import { supabase } from './supabase.js';

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
      return data.map((t) => ({
        id: Number(t.id),
        adminId: Number(t.admin_id),
        name: t.name,
        slug: t.slug,
        status: t.status,
        title: t.title,
        bio: t.bio,
        avatarUrl: t.avatar_url,
        themeId: t.theme_id,
        customTheme: t.custom_theme,
        headerLayout: t.header_layout || t.custom_theme?.headerLayout || 'classic',
        bannerUrl: t.banner_url || t.custom_theme?.bannerUrl || null,
        heroUrl: t.hero_url || t.custom_theme?.heroUrl || null,
        logoUrl: t.logo_url || t.custom_theme?.logoUrl || null,
        titleStyle: t.title_style || t.custom_theme?.titleStyle || 'text',
        altFontEnabled: t.alt_font_enabled ?? t.custom_theme?.altFontEnabled ?? false,
        titleFont: t.title_font || t.custom_theme?.titleFont || 'Inter',
        titleColor: t.title_color || t.custom_theme?.titleColor || '#111111',
        footerEnabled: t.footer_enabled ?? t.custom_theme?.footerEnabled ?? true,
        footerText: t.footer_text || t.custom_theme?.footerText || 'IndiaTaps',
        cardCount: t.cards?.[0]?.count || 0,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));
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
      return {
        id: Number(data.id),
        adminId: Number(data.admin_id),
        name: data.name,
        slug: data.slug,
        status: data.status,
        title: data.title,
        bio: data.bio,
        avatarUrl: data.avatar_url,
        themeId: data.theme_id,
        customTheme: data.custom_theme,
        headerLayout: data.header_layout || data.custom_theme?.headerLayout || 'classic',
        bannerUrl: data.banner_url || data.custom_theme?.bannerUrl || null,
        heroUrl: data.hero_url || data.custom_theme?.heroUrl || null,
        logoUrl: data.logo_url || data.custom_theme?.logoUrl || null,
        titleStyle: data.title_style || data.custom_theme?.titleStyle || 'text',
        altFontEnabled: data.alt_font_enabled ?? data.custom_theme?.altFontEnabled ?? false,
        titleFont: data.title_font || data.custom_theme?.titleFont || 'Inter',
        titleColor: data.title_color || data.custom_theme?.titleColor || '#111111',
        footerEnabled: data.footer_enabled ?? data.custom_theme?.footerEnabled ?? true,
        footerText: data.footer_text || data.custom_theme?.footerText || 'IndiaTaps',
        socialLinks: data.social_links || data.custom_theme?.socialLinks || [],
        seo: data.seo || data.custom_theme?.seo || { title: '', description: '', faviconUrl: '' },
        viewsCount: Number(data.views_count || 0),
        clicksCount: Number(data.clicks_count || 0),
        cards: cards || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
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
        .select('*')
        .eq('slug', cleanSlug)
        .is('deleted_at', null)
        .order('id', { ascending: false })
        .limit(1);

      if (error || !list || list.length === 0) {
        const fallback = await supabase
          .from('trees')
          .select('*')
          .eq('slug', cleanSlug)
          .order('id', { ascending: false })
          .limit(1);
        list = fallback.data;
      }

      const data = list?.[0];
      if (!data) return null;

      const cards = await this.getCards(data.id);
      return {
        id: Number(data.id),
        adminId: Number(data.admin_id),
        name: data.name,
        slug: data.slug,
        status: data.status,
        title: data.title,
        bio: data.bio,
        avatarUrl: data.avatar_url,
        themeId: data.theme_id,
        customTheme: data.custom_theme,
        headerLayout: data.header_layout || data.custom_theme?.headerLayout || 'classic',
        bannerUrl: data.banner_url || data.custom_theme?.bannerUrl || null,
        heroUrl: data.hero_url || data.custom_theme?.heroUrl || null,
        logoUrl: data.logo_url || data.custom_theme?.logoUrl || null,
        titleStyle: data.title_style || data.custom_theme?.titleStyle || 'text',
        altFontEnabled: data.alt_font_enabled ?? data.custom_theme?.altFontEnabled ?? false,
        titleFont: data.title_font || data.custom_theme?.titleFont || 'Inter',
        titleColor: data.title_color || data.custom_theme?.titleColor || '#111111',
        footerEnabled: data.footer_enabled ?? data.custom_theme?.footerEnabled ?? true,
        footerText: data.footer_text || data.custom_theme?.footerText || 'IndiaTaps',
        socialLinks: data.social_links || data.custom_theme?.socialLinks || [],
        seo: data.seo || data.custom_theme?.seo || { title: '', description: '', faviconUrl: '' },
        viewsCount: Number(data.views_count || 0),
        clicksCount: Number(data.clicks_count || 0),
        cards: cards || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
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
      return {
        id: Number(data.id),
        adminId: Number(data.admin_id),
        name: data.name,
        slug: data.slug,
        status: data.status,
        title: data.title,
        bio: data.bio,
        avatarUrl: data.avatar_url,
        themeId: data.theme_id,
        customTheme: data.custom_theme,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
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

      const avatar = updates.avatarUrl ?? updates.avatar_url;
      if (avatar !== undefined) {
        if (typeof avatar === 'string' && avatar.startsWith('data:image')) {
          const cdnUrl = await this.uploadAsset({
            base64Data: avatar,
            filename: 'avatar.jpg',
            folder: 'avatars',
          });
          payload.avatar_url = cdnUrl || avatar;
        } else {
          payload.avatar_url = avatar;
        }
      }

      let banner = updates.bannerUrl ?? updates.customTheme?.bannerUrl;
      if (typeof banner === 'string' && banner.startsWith('data:image')) {
        const cdnBanner = await this.uploadAsset({
          base64Data: banner,
          filename: 'banner.png',
          folder: 'banners',
        });
        if (cdnBanner) banner = cdnBanner;
      }

      let hero = updates.heroUrl ?? updates.customTheme?.heroUrl;
      if (typeof hero === 'string' && hero.startsWith('data:image')) {
        const cdnHero = await this.uploadAsset({
          base64Data: hero,
          filename: 'hero.png',
          folder: 'heroes',
        });
        if (cdnHero) hero = cdnHero;
      }

      let logo = updates.logoUrl ?? updates.customTheme?.logoUrl;
      if (typeof logo === 'string' && logo.startsWith('data:image')) {
        const cdnLogo = await this.uploadAsset({
          base64Data: logo,
          filename: 'logo.png',
          folder: 'logos',
        });
        if (cdnLogo) logo = cdnLogo;
      }

      if (updates.themeId !== undefined || updates.theme_id !== undefined) {
        payload.theme_id = updates.themeId || updates.theme_id;
      }
      if (
        updates.customTheme !== undefined ||
        updates.custom_theme !== undefined ||
        updates.headerLayout !== undefined ||
        updates.bannerUrl !== undefined ||
        updates.heroUrl !== undefined ||
        updates.titleStyle !== undefined ||
        updates.logoUrl !== undefined ||
        updates.altFontEnabled !== undefined ||
        updates.titleFont !== undefined ||
        updates.titleColor !== undefined ||
        updates.footerEnabled !== undefined ||
        updates.footerText !== undefined ||
        updates.socialLinks !== undefined ||
        updates.seo !== undefined
      ) {
        let existingTheme = {};
        try {
          const { data: curr } = await supabase.from('trees').select('custom_theme').eq('id', id).single();
          if (curr?.custom_theme) existingTheme = curr.custom_theme;
        } catch {}

        const baseTheme = updates.customTheme || updates.custom_theme || {};
        payload.custom_theme = {
          ...existingTheme,
          ...baseTheme,
          ...(updates.headerLayout !== undefined ? { headerLayout: updates.headerLayout } : {}),
          ...(banner !== undefined ? { bannerUrl: banner } : {}),
          ...(hero !== undefined ? { heroUrl: hero } : {}),
          ...(updates.titleStyle !== undefined ? { titleStyle: updates.titleStyle } : {}),
          ...(logo !== undefined ? { logoUrl: logo } : {}),
          ...(updates.altFontEnabled !== undefined ? { altFontEnabled: updates.altFontEnabled } : {}),
          ...(updates.titleFont !== undefined ? { titleFont: updates.titleFont } : {}),
          ...(updates.titleColor !== undefined ? { titleColor: updates.titleColor } : {}),
          ...(updates.footerEnabled !== undefined ? { footerEnabled: updates.footerEnabled } : {}),
          ...(updates.footerText !== undefined ? { footerText: updates.footerText } : {}),
          ...(updates.socialLinks !== undefined ? { socialLinks: updates.socialLinks } : {}),
          ...(updates.seo !== undefined ? { seo: updates.seo } : {}),
        };
      }
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
      return {
        ...data,
        id: Number(data.id),
        adminId: Number(data.admin_id),
        avatarUrl: data.avatar_url,
        themeId: data.theme_id,
        customTheme: data.custom_theme,
        headerLayout: data.header_layout || data.custom_theme?.headerLayout || 'classic',
        bannerUrl: data.banner_url || data.custom_theme?.bannerUrl || null,
        heroUrl: data.hero_url || data.custom_theme?.heroUrl || null,
        logoUrl: data.logo_url || data.custom_theme?.logoUrl || null,
        titleStyle: data.title_style || data.custom_theme?.titleStyle || 'text',
        altFontEnabled: data.alt_font_enabled ?? data.custom_theme?.altFontEnabled ?? false,
        titleFont: data.title_font || data.custom_theme?.titleFont || 'Inter',
        titleColor: data.title_color || data.custom_theme?.titleColor || '#111111',
        footerEnabled: data.footer_enabled ?? data.custom_theme?.footerEnabled ?? true,
        footerText: data.footer_text || data.custom_theme?.footerText || 'IndiaTaps',
      };
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
      await supabase.from('cards').delete().eq('tree_id', treeId);

      const syncedCards = [];
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        const cardPayload = {
          ...c,
          treeId,
          position: i,
          visible: c.visible ?? true,
        };
        const created = await this.createCard(cardPayload);
        if (created) {
          syncedCards.push(created);
        } else {
          syncedCards.push({ ...cardPayload, id: Date.now() + i });
        }
      }
      return syncedCards;
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
      return {
        ...user,
        role: isSuper ? 'super_admin' : (user.role || 'client'),
        accountType: isSuper ? 'super_admin' : (user.account_type || user.role || 'client'),
        isSuperAdmin: isSuper,
      };
    } catch (err) {
      console.warn('[DB getUserByEmailOrUsername fallback]', err.message);
      return null;
    }
  },

  async createUser({ email, username, password }) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: email.trim().toLowerCase(),
          username: username.trim().toLowerCase(),
          password,
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
        if (user && user.password === password) {
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
        user = await this.createUser({ email: cleanEmail, username: cleanUsername, password: 'oauth_user' });
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
