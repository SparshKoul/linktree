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
      const { data, error } = await supabase
        .from('trees')
        .select('*')
        .eq('slug', slug.toLowerCase())
        .is('deleted_at', null)
        .single();
      if (error) throw error;
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
        updates.titleColor !== undefined
      ) {
        const baseTheme = updates.customTheme || updates.custom_theme || {};
        payload.custom_theme = {
          ...baseTheme,
          ...(updates.headerLayout !== undefined ? { headerLayout: updates.headerLayout } : {}),
          ...(updates.bannerUrl !== undefined ? { bannerUrl: updates.bannerUrl } : {}),
          ...(updates.heroUrl !== undefined ? { heroUrl: updates.heroUrl } : {}),
          ...(updates.titleStyle !== undefined ? { titleStyle: updates.titleStyle } : {}),
          ...(updates.logoUrl !== undefined ? { logoUrl: updates.logoUrl } : {}),
          ...(updates.altFontEnabled !== undefined ? { altFontEnabled: updates.altFontEnabled } : {}),
          ...(updates.titleFont !== undefined ? { titleFont: updates.titleFont } : {}),
          ...(updates.titleColor !== undefined ? { titleColor: updates.titleColor } : {}),
        };
      }
      if (updates.status !== undefined) payload.status = updates.status;
      payload.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('trees')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return {
        ...data,
        id: Number(data.id),
        adminId: Number(data.admin_id),
        avatarUrl: data.avatar_url,
        themeId: data.theme_id,
        customTheme: data.custom_theme,
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
      if (typeof finalUrl === 'string' && finalUrl.startsWith('data:application/pdf')) {
        const cdnPdf = await this.uploadAsset({
          base64Data: finalUrl,
          filename: cardData.settings?.pdfName || 'menu.pdf',
          folder: 'menus',
        });
        if (cdnPdf) finalUrl = cdnPdf;
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
          settings: cardData.settings || {},
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
        if (typeof updates.url === 'string' && updates.url.startsWith('data:application/pdf')) {
          const cdnPdf = await this.uploadAsset({
            base64Data: updates.url,
            filename: updates.settings?.pdfName || 'menu.pdf',
            folder: 'menus',
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
      if (updates.settings !== undefined) payload.settings = updates.settings;
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
  async getUserByEmailOrUsername(identifier) {
    try {
      const clean = identifier.toLowerCase().trim();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`email.ilike.${clean},username.ilike.${clean}`)
        .limit(1);
      if (error) throw error;
      return data?.[0] || null;
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
  async uploadAsset({ base64Data, filename, folder = 'uploads' }) {
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
      const ext = filename ? filename.split('.').pop() : (mimeType.split('/')[1] || 'bin');
      const cleanName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = `${folder}/${cleanName}`;

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

      return urlData?.publicUrl || null;
    } catch (err) {
      console.warn('[DB uploadAsset error]', err.message);
      return null;
    }
  },
};
