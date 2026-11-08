// LocalStorage persistence service for Linktree state

const USER_KEY = 'linktree_user';
const TREES_KEY = 'linktree_trees';
const CARDS_KEY = 'linktree_cards';
const ACTIVE_TREE_KEY = 'linktree_active_tree_id';
const SETTINGS_KEY = 'linktree_settings';

export const storage = {
  getUser() {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : { id: 1, username: 'riyast', email: 'sparshkoul6@gmail.com' };
    } catch {
      return { id: 1, username: 'riyast', email: 'sparshkoul6@gmail.com' };
    }
  },

  setUser(user) {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      console.warn('localStorage error', e);
    }
  },

  getTrees(userId = 1) {
    try {
      const raw = localStorage.getItem(TREES_KEY);
      let trees = raw ? JSON.parse(raw) : null;
      if (!trees || !Array.isArray(trees) || trees.length === 0) {
        // Initial clean tree, no predefined cards
        trees = [
          {
            id: 1,
            adminId: userId || 1,
            name: 'Riyast',
            slug: 'riyast',
            status: 'live',
            title: 'riyast',
            bio: '',
            avatarUrl: null,
            themeId: 'classic-light',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        localStorage.setItem(TREES_KEY, JSON.stringify(trees));
      }
      return userId ? trees.filter((t) => t.adminId === userId) : trees;
    } catch {
      return [];
    }
  },

  saveTrees(trees) {
    try {
      localStorage.setItem(TREES_KEY, JSON.stringify(trees));
    } catch (e) {
      console.warn('localStorage error', e);
    }
  },

  getCards(treeId) {
    try {
      const raw = localStorage.getItem(CARDS_KEY);
      if (!raw) {
        // Initial cards matching user's screen state
        const initialCards = [
          {
            id: 1,
            treeId: 1,
            type: 'maps',
            title: 'Star Carz Ludhiana',
            subtitle: 'Starcarz, Pakhowal Rd, Hotel Aagaaz, Ludhiana',
            url: 'https://maps.app.goo.gl/41pK4HQY5RHNe7qQA',
            clicks: 0,
            position: 0,
            visible: true,
            animation: 'none',
            settings: {
              address: 'Starcarz, Pakhowal Rd, Hotel Aagaaz, Ludhiana',
              layout: 'classic',
            },
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            treeId: 1,
            type: 'link',
            title: 'instagram.com',
            subtitle: 'instagram.com',
            url: 'https://instagram.com',
            clicks: 0,
            position: 1,
            visible: true,
            animation: 'none',
            settings: {
              layout: 'classic',
            },
            createdAt: new Date().toISOString(),
          },
          {
            id: 3,
            treeId: 1,
            type: 'link',
            title: 'GitHub · Change is constant. GitHub keeps you ahead. · GitHub...',
            subtitle: 'github.com',
            url: 'https://github.com',
            clicks: 0,
            position: 2,
            visible: true,
            animation: 'none',
            settings: {
              subtitle: 'github.com',
              layout: 'classic',
            },
            createdAt: new Date().toISOString(),
          },
        ];
        localStorage.setItem(CARDS_KEY, JSON.stringify(initialCards));
        return treeId !== undefined && treeId !== null
          ? initialCards.filter((c) => Number(c.treeId) === Number(treeId))
          : initialCards;
      }

      const cards = JSON.parse(raw);
      if (treeId !== undefined && treeId !== null) {
        const numId = Number(treeId);
        return cards.filter((c) => Number(c.treeId) === numId);
      }
      return cards;
    } catch {
      return [];
    }
  },

  saveCards(cards) {
    try {
      localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
    } catch (e) {
      console.warn('localStorage error', e);
    }
  },

  addCard(cardData) {
    const all = storage.getCards();
    const newCard = {
      id: cardData.id || Date.now(),
      treeId: Number(cardData.treeId),
      type: cardData.type || 'link',
      title: cardData.title || 'New Link',
      subtitle: cardData.subtitle || cardData.settings?.address || cardData.settings?.subtitle || '',
      url: cardData.url || '',
      thumbnailUrl: cardData.thumbnailUrl || null,
      clicks: cardData.clicks || 0,
      position: all.length,
      visible: cardData.visible !== undefined ? cardData.visible : true,
      animation: cardData.animation || 'none',
      settings: cardData.settings || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    all.push(newCard);
    storage.saveCards(all);
    return newCard;
  },

  updateCard(cardId, updates) {
    const all = storage.getCards();
    const idToFind = Number(cardId);
    const idx = all.findIndex((c) => Number(c.id) === idToFind);
    if (idx !== -1) {
      all[idx] = {
        ...all[idx],
        ...updates,
        settings: { ...(all[idx].settings || {}), ...(updates.settings || {}) },
        updatedAt: new Date().toISOString(),
      };
      storage.saveCards(all);
      return all[idx];
    }
    return null;
  },

  deleteCard(cardId) {
    const all = storage.getCards();
    const idToFind = Number(cardId);
    const filtered = all.filter((c) => Number(c.id) !== idToFind);
    storage.saveCards(filtered);
    return true;
  },

  getActiveTreeId() {
    try {
      return localStorage.getItem(ACTIVE_TREE_KEY) || '1';
    } catch {
      return '1';
    }
  },

  setActiveTreeId(id) {
    try {
      localStorage.setItem(ACTIVE_TREE_KEY, String(id));
    } catch (e) {
      console.warn('localStorage error', e);
    }
  },

  getSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : { footerEnabled: true, bioBannerVisible: true };
    } catch {
      return { footerEnabled: true, bioBannerVisible: true };
    }
  },

  saveSettings(settings) {
    try {
      const current = storage.getSettings();
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
    } catch (e) {
      console.warn('localStorage error', e);
    }
  },
};
