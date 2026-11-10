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
      if (!data || data === 'null' || data === 'undefined' || data === '') return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  setUser(user) {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.setItem(USER_KEY, 'null');
      }
    } catch (e) {
      console.warn('localStorage error', e);
    }
  },

  getTrees(userId = null) {
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
      const normalized = (trees || []).map((t) => ({
        ...t,
        bannerUrl: t.bannerUrl || t.customTheme?.bannerUrl || null,
        heroUrl: t.heroUrl || t.customTheme?.heroUrl || null,
        logoUrl: t.logoUrl || t.customTheme?.logoUrl || null,
        headerLayout: t.headerLayout || t.customTheme?.headerLayout || 'classic',
      }));
      return userId ? normalized.filter((t) => t.adminId === userId) : normalized;
    } catch {
      return [];
    }
  },

  saveTree(tree) {
    try {
      const raw = localStorage.getItem(TREES_KEY);
      let trees = raw ? JSON.parse(raw) : [];
      const idx = trees.findIndex((t) => t.id === tree.id || t.slug === tree.slug);
      if (idx >= 0) {
        trees[idx] = { ...trees[idx], ...tree };
      } else {
        trees.push(tree);
      }
      localStorage.setItem(TREES_KEY, JSON.stringify(trees));
    } catch (e) {
      console.warn('localStorage saveTree error', e);
    }
  },

  saveTrees(trees) {
    try {
      localStorage.setItem(TREES_KEY, JSON.stringify(trees));
    } catch (e) {
      console.warn('localStorage error', e);
    }
  },

  deleteTree(treeId) {
    try {
      const raw = localStorage.getItem(TREES_KEY);
      let trees = raw ? JSON.parse(raw) : [];
      trees = trees.filter((t) => t.id !== treeId);
      localStorage.setItem(TREES_KEY, JSON.stringify(trees));

      const rawCards = localStorage.getItem(CARDS_KEY);
      if (rawCards) {
        const cards = JSON.parse(rawCards).filter((c) => c.treeId !== treeId);
        localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
      }
    } catch (e) {
      console.warn('localStorage deleteTree error', e);
    }
  },

  restoreTree(tree, cards = []) {
    try {
      const raw = localStorage.getItem(TREES_KEY);
      let trees = raw ? JSON.parse(raw) : [];
      if (!trees.some((t) => t.id === tree.id)) {
        trees.push(tree);
        localStorage.setItem(TREES_KEY, JSON.stringify(trees));
      }

      if (cards && cards.length > 0) {
        const rawCards = localStorage.getItem(CARDS_KEY);
        let existingCards = rawCards ? JSON.parse(rawCards) : [];
        const existingIds = new Set(existingCards.map((c) => c.id));
        const newCards = cards.filter((c) => !existingIds.has(c.id));
        localStorage.setItem(CARDS_KEY, JSON.stringify([...existingCards, ...newCards]));
      }
    } catch (e) {
      console.warn('localStorage restoreTree error', e);
    }
  },

  getCards(treeId) {
    try {
      const raw = localStorage.getItem(CARDS_KEY);
      if (!raw) {
        return [];
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
