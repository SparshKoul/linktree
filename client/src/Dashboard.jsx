import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Share2,
  ExternalLink,
  Layers,
  Palette,
  Settings,
  MoreVertical,
  Check,
  Undo2,
  Sparkles,
  Link2,
  Menu,
  Users,
  Wrench,
  Search,
  ChevronRight,
  ChevronDown,
  ListFilter,
  Trash2,
  X,
  Copy,
  ShieldCheck,
  HelpCircle,
  MessageSquare,
  LogOut,
  Smartphone,
  CheckCircle2,
  Calendar,
  CreditCard,
  Send,
  BarChart3,
  Tv,
  Coins,
  QrCode,
  LayoutGrid,
  Pencil,
  EyeOff,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Camera,
  User,
  ShoppingBag,
  MoreHorizontal,
  Instagram,
  Mail,
  MessageCircle,
  Video,
  Key,
  ChevronLeft,
  Paintbrush,
  Upload,
  CloudUpload,
  Save,
  Loader2,
} from 'lucide-react';
import { TreeSwitcher } from './components/TreeSwitcher.jsx';
import { CreateTreeModal } from './components/CreateTreeModal.jsx';
import { AddCardModal } from './components/AddCardModal.jsx';
import { CardEditorModal } from './components/CardEditorModal.jsx';
import { CardDetailEditor } from './components/CardDetailEditor.jsx';
import { CardsDashboard } from './components/CardsDashboard.jsx';
import { FaviconIcon } from './components/FaviconIcon.jsx';
import { CardRenderer } from './cards/CardRenderer.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { HeaderEditor } from './components/HeaderEditor.jsx';
import { DesignEditor } from './components/DesignEditor.jsx';
import { getPatternSvg, getContrastingPatternColor } from './constants/patternSvg.js';
import { loadFont } from './constants/fonts.js';
import { PRESET_THEMES } from './constants/themes.js';
import { storage } from './services/storage.js';
import { navigate } from './router.js';
import { LandingPage } from './components/LandingPage.jsx';
import { SuperAdminDashboard } from './components/SuperAdminDashboard.jsx';
import { getCanonicalTreeUrl, copyToClipboard } from './constants/urls.js';
import { uploadPicture } from './lib/uploadPicture.js';

export function Dashboard() {
  const initialUser = storage.getUser();
  const initialSettings = storage.getSettings();

  const [currentUser, setCurrentUser] = useState(initialUser);
  const isSuper = Boolean(
    currentUser && (
      currentUser.isSuperAdmin ||
      currentUser.role === 'super_admin' ||
      currentUser.accountType === 'super_admin' ||
      currentUser.email?.toLowerCase() === 'sparshkoul6@gmail.com'
    )
  );
  const [trees, setTrees] = useState([]);
  const [currentTree, setCurrentTree] = useState(null);
  const [activeTab, setActiveTab] = useState('links'); // 'links' | 'shop'
  const [currentView, setCurrentView] = useState('workspace'); // 'workspace' | 'dashboard'
  const [activeRail, setActiveRail] = useState('content'); // 'content' | 'header' | 'design' | 'settings'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarMenuMode, setSidebarMenuMode] = useState('main'); // 'main' (Image 0) | 'account' (Image 1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [editingCard, setEditingCard] = useState(null);
  const [activeCardDetail, setActiveCardDetail] = useState(null);
  const [topToast, setTopToast] = useState(null);
  const [footerEnabled, setFooterEnabled] = useState(initialSettings.footerEnabled);
  const [previewPhoneView, setPreviewPhoneView] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [copiedSupportEmail, setCopiedSupportEmail] = useState(false);
  const [lastDeletedCards, setLastDeletedCards] = useState(null);
  const [undoToast, setUndoToast] = useState(false);
  const [cardPendingDelete, setCardPendingDelete] = useState(null);
  const [undoSecondsLeft, setUndoSecondsLeft] = useState(15);
  const undoIntervalRef = useRef(null);
  const [filterHiddenOnly, setFilterHiddenOnly] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isMobileMoreMenuOpen, setIsMobileMoreMenuOpen] = useState(false);
  const [treePendingDelete, setTreePendingDelete] = useState(null);
  const [lastDeletedTreeData, setLastDeletedTreeData] = useState(null);
  const [treeUndoToast, setTreeUndoToast] = useState(false);
  const [treeUndoSecondsLeft, setTreeUndoSecondsLeft] = useState(15);
  const treeUndoIntervalRef = useRef(null);
  const [cardMenuId, setCardMenuId] = useState(null);
  // Menus near the bottom of the screen open upward so they are not cut off.
  const [cardMenuOpenUp, setCardMenuOpenUp] = useState(false);
  const [draggedCardIndex, setDraggedCardIndex] = useState(null);
  const avatarInputRef = useRef(null);
  const [isBioBannerVisible, setIsBioBannerVisible] = useState(initialSettings.bioBannerVisible);
  const [isSavingTree, setIsSavingTree] = useState(false);
  const [treeSavedRecently, setTreeSavedRecently] = useState(false);
  // What the owner is told about their changes: nothing, saving, saved or failed.
  const [changeStatus, setChangeStatus] = useState('idle');
  const changeStatusTimerRef = useRef(null);

  const markChangeStatus = (status) => {
    setChangeStatus(status);
    clearTimeout(changeStatusTimerRef.current);
    if (status === 'saved' || status === 'failed') {
      changeStatusTimerRef.current = setTimeout(() => setChangeStatus('idle'), 3000);
    }
  };
  const updateTreeTimerRef = useRef(null);
  const updateTreeAbortRef = useRef(null);
  const pendingUpdatesRef = useRef({});
  // The changes of a card that still have to go to the server, and the
  // number of the last request per card.
  const pendingCardUpdatesRef = useRef({});
  const cardUpdateTimersRef = useRef({});
  const cardUpdateSequenceRef = useRef({});

  // The dashboard lives on its own path. The shell decides which page is
  // open, this page only has to know whether it is the one being shown.
  const isDashboard = true;

  // If a username is claimed from the landing page, open the Create Tree modal
  useEffect(() => {
    if (typeof window !== 'undefined' && isDashboard) {
      const params = new URLSearchParams(window.location.search);
      const claim = params.get('claim');
      if (claim) {
        setIsCreateModalOpen(true);
      }
    }
  }, [isDashboard]);

  // Route to Super Admin dashboard if /admin path
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.location.pathname.startsWith('/admin') &&
      isSuper
    ) {
      setCurrentView('super_admin');
    }
  }, [isSuper]);

  // Load current user and trees on mount or user change using localStorage first
  const fetchUserData = (userId) => {
    const user = storage.getUser();
    const effectiveUserId = userId || user?.id;
    if (!effectiveUserId) {
      setCurrentUser(null);
      setTrees([]);
      setCurrentTree(null);
      return;
    }
    setCurrentUser(user);

    const localTrees = storage.getTrees(effectiveUserId);
    setTrees(localTrees);

    const activeTreeId = Number(storage.getActiveTreeId());
    const matched = localTrees.find((t) => t.id === activeTreeId) || localTrees[0];
    if (matched) {
      const cards = storage.getCards(matched.id);
      setCurrentTree({ ...matched, cards });
    }

    // Sync user, trees, and cards with Supabase backend.
    // The session cookie is the only credential; there is no user id header.
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (res) => {
        if (res.status === 401) {
          // Session expired or was never established: drop the stale local user.
          storage.setUser(null);
          setCurrentUser(null);
          setTrees([]);
          setCurrentTree(null);
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((serverUser) => {
        if (serverUser) {
          setCurrentUser(serverUser);
          storage.setUser(serverUser);
        }
      })
      .catch(() => {});

    fetch('/api/admin/trees', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((serverTrees) => {
        if (serverTrees && serverTrees.length > 0) {
          setTrees(serverTrees);
          storage.saveTrees(serverTrees);
          const activeTreeId = Number(storage.getActiveTreeId());
          const target = serverTrees.find((t) => t.id === activeTreeId) || serverTrees[0];
          if (target) {
            fetch(`/api/admin/trees/${target.id}`, { credentials: 'include' })
              .then((r) => (r.ok ? r.json() : null))
              .then((fullTree) => {
                if (fullTree) {
                  setCurrentTree(fullTree);
                  if (fullTree.cards) {
                    const allLocal = storage.getCards();
                    const otherCards = allLocal.filter((c) => Number(c.treeId) !== Number(target.id));
                    storage.saveCards([...otherCards, ...fullTree.cards]);
                  }
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    // The dashboard is only loaded when it is shown, so the data is loaded
    // when it is shown as well.
    fetchUserData();

    // Check for Supabase Google OAuth callback hash
    if (window.location.hash && window.location.hash.includes('access_token')) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        if (accessToken) {
          const payloadBase64 = accessToken.split('.')[1];
          const payload = JSON.parse(atob(payloadBase64));
          const email = payload.email || payload.user_metadata?.email;
          const name = payload.user_metadata?.full_name || payload.user_metadata?.name || email?.split('@')[0];
          if (email) {
            fetch('/api/auth/oauth-callback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, username: name }),
            })
              .then((r) => r.json())
              .then((data) => {
                if (data.user) {
                  setCurrentUser(data.user);
                  storage.setUser(data.user);
                  setTopToast({
                    title: 'Signed in with Google',
                    subtitle: `Welcome, @${data.user.username}`,
                  });
                  setTimeout(() => setTopToast(null), 3000);
                  window.history.replaceState(null, '', window.location.pathname);
                  fetchUserData(data.user.id);
                }
              })
              .catch(() => {});
          }
        }
      } catch (e) {
        console.warn('OAuth token parse error', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!cardMenuId) return undefined;
    // Escape closes the open card menu.
    const onKey = (e) => {
      if (e.key === 'Escape') setCardMenuId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cardMenuId]);

  const loadTreeDetails = (id) => {
    const numId = Number(id);
    storage.setActiveTreeId(numId);
    const allTrees = storage.getTrees(currentUser?.id);
    const targetTree = allTrees.find((t) => t.id === numId) || trees.find((t) => t.id === numId);
    const cards = storage.getCards(numId);
    if (targetTree) {
      setCurrentTree({ ...targetTree, cards });
    }

    // Always fetch latest from Supabase so multi-device updates reflect immediately
    fetch(`/api/admin/trees/${numId}`, {
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((fullTree) => {
        if (fullTree) {
          setCurrentTree(fullTree);
          if (fullTree.cards) {
            const allLocal = storage.getCards();
            const otherCards = allLocal.filter((c) => Number(c.treeId) !== Number(numId));
            storage.saveCards([...otherCards, ...fullTree.cards]);
          }
        }
      })
      .catch(() => {});
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    storage.setUser(user);
    setIsAuthModalOpen(false);
    setTopToast({
      title: 'Welcome back',
      subtitle: `${user.email} signed in`,
    });
    setTimeout(() => setTopToast(null), 3000);
    fetchUserData(user.id);
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    storage.setUser(null);
    setCurrentUser(null);
    setTrees([]);
    setCurrentTree(null);
    setIsAuthModalOpen(false);
    setTopToast({
      title: 'Logged out',
      subtitle: 'Signed out of IndiaTaps',
    });
    setTimeout(() => setTopToast(null), 3000);
    navigate('/');
  };

  const handleUpdateTree = (updates) => {
    if (!currentTree) return;
    const updated = { ...currentTree, ...updates };
    setCurrentTree(updated);

    const allTrees = storage.getTrees();
    const updatedAll = allTrees.map((t) => (t.id === currentTree.id ? updated : t));
    storage.saveTrees(updatedAll);
    setTrees(updatedAll.filter((t) => !currentUser?.id || t.adminId === currentUser?.id));

    // Debounce background sync to database to avoid flooding Supabase with row-lock timeouts
    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

    if (updateTreeTimerRef.current) {
      clearTimeout(updateTreeTimerRef.current);
    }

    updateTreeTimerRef.current = setTimeout(async () => {
      const payload = { ...pendingUpdatesRef.current };
      pendingUpdatesRef.current = {};
      if (Object.keys(payload).length === 0) return;

      if (updateTreeAbortRef.current) {
        updateTreeAbortRef.current.abort();
      }
      const controller = new AbortController();
      updateTreeAbortRef.current = controller;

      setChangeStatus('saving');
      try {
        const res = await fetch(`/api/admin/trees/${currentTree.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          signal: controller.signal,
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updatedDb = await res.json();
          if (updatedDb) {
            const freshAll = storage.getTrees().map((t) => (t.id === currentTree.id ? { ...t, ...updatedDb } : t));
            storage.saveTrees(freshAll);
            setCurrentTree((prev) => (prev && prev.id === currentTree.id ? { ...prev, ...updatedDb } : prev));
          }
        }
        markChangeStatus('saved');
      } catch (err) {
        // Aborted or temporary network hiccup - smoothly ignored as state is safely in localStorage
      }
    }, 400);
  };

  const handleSaveTree = async () => {
    if (!currentTree || isSavingTree) return;

    // Immediately flush/cancel pending debounced calls so they don't race with full sync
    if (updateTreeTimerRef.current) {
      clearTimeout(updateTreeTimerRef.current);
      updateTreeTimerRef.current = null;
    }
    if (updateTreeAbortRef.current) {
      updateTreeAbortRef.current.abort();
      updateTreeAbortRef.current = null;
    }
    pendingUpdatesRef.current = {};

    setIsSavingTree(true);
    setChangeStatus('saving');

    // Guaranteed 15-second safety timeout so the button can NEVER hang in "Saving..."
    const abortCtrl = new AbortController();
    const timeoutId = setTimeout(() => abortCtrl.abort(), 15000);

    try {
      // 1. Send the changes of the cards that are still waiting, so the tree
      //    below holds the newest state of every card.
      await flushPendingCardUpdates();

      // 2. Immediately ensure local storage holds active state
      storage.saveTree(currentTree);
      const activeCards = (currentTree.cards && currentTree.cards.length > 0)
        ? currentTree.cards
        : storage.getCards(currentTree.id) || [];
      if (activeCards.length > 0) {
        const allLocal = storage.getCards();
        const otherCards = allLocal.filter((c) => Number(c.treeId) !== Number(currentTree.id));
        storage.saveCards([...otherCards, ...activeCards]);
      }

      // 2. Upload and sync the entire tree & cards state to database
      const res = await fetch(`/api/admin/trees/${currentTree.id}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: abortCtrl.signal,
        body: JSON.stringify({
          treeUpdates: {
            name: currentTree.name,
            title: currentTree.title,
            bio: currentTree.bio,
            avatarUrl: currentTree.avatarUrl,
            bannerUrl: currentTree.bannerUrl || currentTree.customTheme?.bannerUrl || null,
            heroUrl: currentTree.heroUrl || currentTree.customTheme?.heroUrl || null,
            logoUrl: currentTree.logoUrl || currentTree.customTheme?.logoUrl || null,
            themeId: currentTree.themeId,
            headerLayout: currentTree.headerLayout || currentTree.customTheme?.headerLayout || 'classic',
            titleStyle: currentTree.titleStyle || currentTree.customTheme?.titleStyle || 'text',
            titleFont: currentTree.titleFont || currentTree.customTheme?.titleFont || 'Inter',
            titleColor: currentTree.titleColor || currentTree.customTheme?.titleColor || '#111111',
            altFontEnabled: currentTree.altFontEnabled !== undefined ? currentTree.altFontEnabled : (currentTree.customTheme?.altFontEnabled ?? false),
            footerEnabled: currentTree.footerEnabled !== undefined ? currentTree.footerEnabled : (currentTree.customTheme?.footerEnabled ?? true),
            footerText: currentTree.footerText || currentTree.customTheme?.footerText || 'IndiaTaps',
            socialLinks: currentTree.socialLinks || currentTree.customTheme?.socialLinks || [],
            seo: currentTree.seo || currentTree.customTheme?.seo || { title: '', description: '', faviconUrl: '' },
            customTheme: {
              ...(currentTree.customTheme || {}),
              backgroundType: activeTheme.backgroundType,
              backgroundValue: activeTheme.backgroundValue,
              backgroundColor: activeTheme.backgroundColor,
              backgroundImageUrl: activeTheme.backgroundImageUrl,
              wallpaperStyle: activeTheme.wallpaperStyle,
              wallpaperVideoUrl: activeTheme.wallpaperVideoUrl,
              patternType: activeTheme.patternType,
              tint: activeTheme.tint,
              noise: activeTheme.noise,
              effect: activeTheme.effect,
              blurAmount: activeTheme.blurAmount ?? 20,
              buttonStyle: activeTheme.buttonStyle,
              buttonColor: activeTheme.buttonColor,
              buttonTextColor: activeTheme.buttonTextColor,
              buttonRadius: activeTheme.buttonRadius,
              fontFamily: activeTheme.fontFamily,
              textColor: activeTheme.textColor,
              headerLayout: currentTree.headerLayout || currentTree.customTheme?.headerLayout || 'classic',
              titleStyle: currentTree.titleStyle || currentTree.customTheme?.titleStyle || 'text',
              titleFont: currentTree.titleFont || currentTree.customTheme?.titleFont || 'Inter',
              titleColor: currentTree.titleColor || currentTree.customTheme?.titleColor || '#111111',
              altFontEnabled: currentTree.altFontEnabled !== undefined ? currentTree.altFontEnabled : (currentTree.customTheme?.altFontEnabled ?? false),
              bannerUrl: currentTree.bannerUrl || currentTree.customTheme?.bannerUrl || null,
              heroUrl: currentTree.heroUrl || currentTree.customTheme?.heroUrl || null,
              logoUrl: currentTree.logoUrl || currentTree.customTheme?.logoUrl || null,
              avatarUrl: currentTree.avatarUrl || currentTree.customTheme?.avatarUrl || null,
              footerEnabled: currentTree.footerEnabled !== undefined ? currentTree.footerEnabled : (currentTree.customTheme?.footerEnabled ?? true),
              footerText: currentTree.footerText || currentTree.customTheme?.footerText || 'IndiaTaps',
            },
          },
          cards: activeCards,
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        // The server refused the save. The cards that are already live were
        // left untouched, so say what happened instead of claiming success.
        const errorData = await res.json().catch(() => ({}));
        setTopToast({
          title: 'Save failed',
          subtitle: errorData.error || 'The database refused this change. Nothing was changed.',
        });
        setTimeout(() => setTopToast(null), 6000);
        return;
      }

      const data = await res.json();
      if (data.tree) {
        const mergedTree = {
          ...currentTree,
          ...data.tree,
          cards: data.cards || activeCards,
        };
        setCurrentTree(mergedTree);
        storage.saveTree(mergedTree);
        if (data.cards && data.cards.length > 0) {
          const allLocal = storage.getCards();
          const otherCards = allLocal.filter((c) => Number(c.treeId) !== Number(currentTree.id));
          storage.saveCards([...otherCards, ...data.cards]);
        }
      }

      setTreeSavedRecently(true);
      markChangeStatus('saved');
      setTopToast({
        title: 'Tree Saved to Database!',
        subtitle: `All cards and state are live across devices on indiataps.com/${currentSlug}`,
      });
      setTimeout(() => {
        setTreeSavedRecently(false);
        setTopToast(null);
      }, 3500);
    } catch (err) {
      clearTimeout(timeoutId);
      setTopToast({
        title: 'Tree Saved Locally',
        subtitle: 'Saved to local storage; will sync when server is reachable',
      });
      setTimeout(() => setTopToast(null), 3000);
    } finally {
      setIsSavingTree(false);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentTree) return;
    e.target.value = '';

    // The picture goes to the storage first, made smaller. Only the address
    // of it goes into the tree: a picture of a few megabytes would be sent
    // to the database and to every visitor.
    uploadPicture(file, { folder: 'avatars', maxWidth: 800, maxHeight: 800 })
      .then((url) => {
        if (url) handleUpdateTree({ avatarUrl: url });
      })
      .catch(() => {});
  };

  // Copy a card into the same tree: same content, fresh card, zero clicks.
  const handleDuplicateCard = async (card) => {
    if (!currentTree || !card) return;

    const copyData = {
      id: Date.now(),
      treeId: currentTree.id,
      type: card.type,
      title: card.title ? `${card.title} (copy)` : 'Copy',
      subtitle: card.subtitle || '',
      url: card.url || '',
      thumbnailUrl: card.thumbnailUrl || null,
      clicks: 0,
      visible: card.visible !== false,
      animation: card.animation || 'none',
      settings: { ...(card.settings || {}) },
    };

    const savedCard = storage.addCard(copyData);
    const updatedCards = [...(currentTree.cards || []), savedCard];
    setCurrentTree({ ...currentTree, cards: updatedCards });

    fetch(`/api/admin/trees/${currentTree.id}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(copyData),
    })
      .then(async (res) => {
        if (res.ok) return res.json();
        const error = await res.json().catch(() => ({}));
        setTopToast({
          title: 'Card not saved',
          subtitle: error.error || 'The database refused this card. It is saved in this browser only.',
        });
        setTimeout(() => setTopToast(null), 6000);
        return null;
      })
      .then((dbCard) => {
        if (dbCard && dbCard.id) {
          const remapped = updatedCards.map((c) =>
            c.id === savedCard.id ? { ...c, ...dbCard, id: dbCard.id } : c
          );
          setCurrentTree((prev) => (prev ? { ...prev, cards: remapped } : prev));
          storage.updateCard(savedCard.id, { ...dbCard, id: dbCard.id });
        }
      })
      .catch(() => {});

    setTopToast({
      title: 'Card duplicated',
      subtitle: copyData.title,
    });
    setTimeout(() => setTopToast(null), 4000);
  };

  const handleAddCard = async (type, title, defaultSettings = {}) => {
    if (!currentTree) return;

    const newCardData = {
      id: Date.now(),
      treeId: currentTree.id,
      type,
      title,
      subtitle: defaultSettings.subtitle || defaultSettings.address || '',
      url: defaultSettings.url || '',
      thumbnailUrl: defaultSettings.thumbnailUrl || null,
      clicks: 0,
      visible: true,
      animation: 'none',
      settings: defaultSettings,
    };

    // Save directly to localStorage
    const savedCard = storage.addCard(newCardData);
    const updatedCards =
      type === 'maps'
        ? [savedCard, ...(currentTree.cards || [])]
        : [...(currentTree.cards || []), savedCard];

    setCurrentTree({
      ...currentTree,
      cards: updatedCards,
    });

    // Background sync to Supabase
    fetch(`/api/admin/trees/${currentTree.id}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(newCardData),
    })
      .then(async (res) => {
        if (res.ok) return res.json();
        // The database refused this card. Say so: the card is only in this
        // browser until the problem is fixed.
        const error = await res.json().catch(() => ({}));
        setTopToast({
          title: 'Card not saved',
          subtitle: error.error || 'The database refused this card. It is saved in this browser only.',
        });
        setTimeout(() => setTopToast(null), 6000);
        return null;
      })
      .then((dbCard) => {
        if (dbCard && dbCard.id) {
          const remapped = updatedCards.map((c) =>
            c.id === savedCard.id ? { ...c, ...dbCard, id: dbCard.id } : c
          );
          setCurrentTree((prev) => (prev ? { ...prev, cards: remapped } : prev));
          storage.updateCard(savedCard.id, { ...dbCard, id: dbCard.id });
        }
      })
      .catch(() => {});

    if (type === 'maps' || defaultSettings.isSettingUp) {
      setActiveCardDetail(savedCard);
    } else {
      setTopToast({
        title: 'Link added',
        subtitle: 'Share a tracked link',
      });
      setTimeout(() => setTopToast(null), 4000);

      if (!defaultSettings.url || defaultSettings.url === '' || defaultSettings.url === 'https://') {
        setActiveCardDetail(savedCard);
      }
    }
  };

  const handleAddSocialQuick = (platform) => {
    if (platform === 'instagram') {
      handleAddCard('instagram', 'Instagram', { url: 'https://instagram.com/' });
    } else if (platform === 'whatsapp') {
      handleAddCard('phone', 'WhatsApp', { url: 'https://wa.me/' });
    } else if (platform === 'mail') {
      handleAddCard('email', 'Email', { url: 'mailto:' });
    } else {
      setIsAddCardOpen(true);
    }
  };

  /**
   * Send a change of one card to the server.
   * The sequence number makes sure that a slow answer never overwrites a
   * newer one.
   */
  const sendCardUpdate = async (cardId, updates) => {
    const key = String(cardId);
    const sequence = (cardUpdateSequenceRef.current[key] || 0) + 1;
    cardUpdateSequenceRef.current[key] = sequence;

    setChangeStatus('saving');
    try {
      const res = await fetch(`/api/admin/cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        markChangeStatus('failed');
        setTopToast({
          title: 'Change not saved',
          subtitle: error.error || 'The database refused this change. It is saved in this browser only.',
        });
        setTimeout(() => setTopToast(null), 6000);
        return;
      }

      const updatedDb = await res.json().catch(() => null);
      if (!updatedDb) return;
      markChangeStatus('saved');
      // A newer change was already sent for this card: this answer is old.
      if (cardUpdateSequenceRef.current[key] !== sequence) return;

      storage.updateCard(cardId, updatedDb);
      setCurrentTree((prev) =>
        prev
          ? {
              ...prev,
              cards: (prev.cards || []).map((c) =>
                String(c.id) === String(cardId)
                  ? {
                      ...c,
                      ...updatedDb,
                      settings: {
                        ...(c.settings || {}),
                        ...(updatedDb.settings || {}),
                      },
                    }
                  : c
              ),
            }
          : prev
      );
      if (activeCardDetail && String(activeCardDetail.id) === String(cardId)) {
        setActiveCardDetail((prev) =>
          prev
            ? {
                ...prev,
                ...updatedDb,
                settings: {
                  ...(prev.settings || {}),
                  ...(updatedDb.settings || {}),
                },
              }
            : null
        );
      }
    } catch {
      // The server could not be reached. The change stays in this browser and
      // goes out with the next save.
    }
  };

  /**
   * The editor writes on every keystroke. The change shows in the preview at
   * once, but only the last change of a burst is sent, so the server never
   * receives two writes that can arrive in the wrong order.
   */
  // The fonts of the tree are fetched only when they are really used.
  useEffect(() => {
    loadFont(currentTree?.fontFamily || currentTree?.customTheme?.fontFamily);
    loadFont(currentTree?.titleFont || currentTree?.customTheme?.titleFont);
  }, [currentTree?.fontFamily, currentTree?.customTheme?.fontFamily, currentTree?.titleFont, currentTree?.customTheme?.titleFont]);

  const handleUpdateCard = async (cardId, updates) => {
    if (!currentTree || !currentTree.cards) return;

    // Save directly to localStorage
    storage.updateCard(cardId, updates);

    const updatedCards = currentTree.cards.map((c) =>
      String(c.id) === String(cardId)
        ? { ...c, ...updates, settings: { ...(c.settings || {}), ...(updates.settings || {}) } }
        : c
    );
    setCurrentTree({ ...currentTree, cards: updatedCards });

    if (activeCardDetail && String(activeCardDetail.id) === String(cardId)) {
      setActiveCardDetail((prev) =>
        prev ? { ...prev, ...updates, settings: { ...(prev.settings || {}), ...(updates.settings || {}) } } : null
      );
    }

    const key = String(cardId);
    pendingCardUpdatesRef.current[key] = {
      ...(pendingCardUpdatesRef.current[key] || {}),
      ...updates,
    };
    clearTimeout(cardUpdateTimersRef.current[key]);
    cardUpdateTimersRef.current[key] = setTimeout(() => {
      const pending = pendingCardUpdatesRef.current[key];
      delete pendingCardUpdatesRef.current[key];
      if (pending) sendCardUpdate(cardId, pending);
    }, 350);
  };

  /**
   * Send the changes that are still waiting before the whole tree is saved.
   */
  const flushPendingCardUpdates = async () => {
    const pending = pendingCardUpdatesRef.current;
    pendingCardUpdatesRef.current = {};
    const sends = Object.entries(pending).map(([cardId, updates]) => {
      clearTimeout(cardUpdateTimersRef.current[cardId]);
      return sendCardUpdate(cardId, updates);
    });
    await Promise.all(sends);
  };

  const promptDeleteCard = (cardId) => {
    const target = currentTree?.cards?.find((c) => String(c.id) === String(cardId)) || activeCardDetail;
    if (target) {
      setCardPendingDelete({
        title: target.title,
        isBulk: false,
        count: 1,
        cards: [target],
      });
    }
  };

  const executeDeleteCards = async (cardsToDelete) => {
    if (!currentTree || !cardsToDelete || cardsToDelete.length === 0) return;

    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);

    setLastDeletedCards(cardsToDelete);
    setUndoToast(true);
    setUndoSecondsLeft(15);

    const idsToDelete = new Set(cardsToDelete.map((c) => c.id));

    // Remove from localStorage
    cardsToDelete.forEach((c) => storage.deleteCard(c.id));

    const updatedCards = currentTree.cards.filter((c) => !idsToDelete.has(c.id));
    setCurrentTree({ ...currentTree, cards: updatedCards });

    if (activeCardDetail && idsToDelete.has(activeCardDetail.id)) {
      setActiveCardDetail(null);
    }

    // Live 15 seconds countdown
    let count = 15;
    undoIntervalRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(undoIntervalRef.current);
        setUndoToast(false);
      } else {
        setUndoSecondsLeft(count);
      }
    }, 1000);

    // Optional background sync
    cardsToDelete.forEach((c) => {
      fetch(`/api/admin/cards/${c.id}`, { method: 'DELETE', credentials: 'include' }).catch(() => {});
    });
  };

  const confirmDeleteCard = async (cardId) => {
    const toDelete = currentTree?.cards?.find((c) => String(c.id) === String(cardId)) || activeCardDetail;
    if (toDelete) {
      executeDeleteCards([toDelete]);
    }
  };

  const handleDeleteCard = (cardId) => {
    promptDeleteCard(cardId);
  };

  const handleUndoDelete = async () => {
    if (!currentTree || !lastDeletedCards || lastDeletedCards.length === 0) return;
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    setUndoToast(false);

    // Restore to localStorage
    const restoredCards = lastDeletedCards.map((c) => storage.addCard(c));
    setCurrentTree({
      ...currentTree,
      cards: [...(currentTree.cards || []), ...restoredCards],
    });
    setLastDeletedCards(null);

    // Optional background sync
    lastDeletedCards.forEach((c) => {
      fetch(`/api/admin/trees/${currentTree.id}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(c),
      }).catch(() => {});
    });
  };

  const promptDeleteTree = (tree) => {
    if (!tree) return;
    setTreePendingDelete(tree);
  };

  const confirmDeleteTree = async (treeToDelete) => {
    if (!treeToDelete) return;

    if (treeUndoIntervalRef.current) clearInterval(treeUndoIntervalRef.current);

    const associatedCards = storage.getCards(treeToDelete.id);
    setLastDeletedTreeData({
      tree: treeToDelete,
      cards: associatedCards,
    });
    setTreeUndoToast(true);
    setTreeUndoSecondsLeft(15);

    storage.deleteTree(treeToDelete.id);

    const updatedTrees = trees.filter((t) => t.id !== treeToDelete.id);
    setTrees(updatedTrees);

    if (currentTree?.id === treeToDelete.id) {
      if (updatedTrees.length > 0) {
        loadTreeDetails(updatedTrees[0].id);
      } else {
        const defaultTree = {
          id: Date.now(),
          adminId: currentUser?.id || 1,
          name: 'My IndiaTaps',
          slug: 'riyast',
          status: 'live',
          title: 'riyast',
          bio: '',
          themeId: 'classic-light',
          cards: [],
        };
        storage.saveTrees([defaultTree]);
        setTrees([defaultTree]);
        setCurrentTree(defaultTree);
      }
    }

    let count = 15;
    treeUndoIntervalRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(treeUndoIntervalRef.current);
        setTreeUndoToast(false);
      } else {
        setTreeUndoSecondsLeft(count);
      }
    }, 1000);

    fetch(`/api/admin/trees/${treeToDelete.id}`, { method: 'DELETE', credentials: 'include' }).catch(() => {});
  };

  const handleUndoDeleteTree = async () => {
    if (!lastDeletedTreeData) return;
    if (treeUndoIntervalRef.current) clearInterval(treeUndoIntervalRef.current);
    setTreeUndoToast(false);

    const { tree, cards } = lastDeletedTreeData;

    // Put it back on the server first. Restoring only in this browser would
    // lose the card again on the next reload.
    try {
      const res = await fetch(`/api/admin/trees/${tree.id}/restore`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTopToast({
          title: 'Could not restore',
          subtitle: data.error || 'The card was not restored. Try creating it again.',
        });
        setTimeout(() => setTopToast(null), 6000);
        setLastDeletedTreeData(null);
        return;
      }
    } catch {
      setTopToast({
        title: 'Could not restore',
        subtitle: 'The server could not be reached. The card is still deleted.',
      });
      setTimeout(() => setTopToast(null), 6000);
      setLastDeletedTreeData(null);
      return;
    }

    storage.restoreTree(tree, cards);

    const restoredTrees = storage.getTrees(currentUser?.id || 1);
    setTrees(restoredTrees);
    loadTreeDetails(tree.id);
    setLastDeletedTreeData(null);

    setTopToast({
      title: 'IndiaTaps restored',
      subtitle: `@${tree.slug} is back`,
    });
    setTimeout(() => setTopToast(null), 3000);
  };

  const handleMoveCard = (fromIndex, delta) => {
    if (!currentTree?.cards) return;
    const toIndex = fromIndex + delta;
    if (toIndex < 0 || toIndex >= currentTree.cards.length) return;

    const newCards = [...currentTree.cards];
    const [moved] = newCards.splice(fromIndex, 1);
    newCards.splice(toIndex, 0, moved);

    const reindexed = newCards.map((c, i) => ({ ...c, position: i }));
    setCurrentTree({ ...currentTree, cards: reindexed });
    reindexed.forEach((c) => {
      storage.updateCard(c.id, { position: c.position });
      fetch(`/api/admin/cards/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ position: c.position }),
      }).catch(() => {});
    });

    setTopToast({
      title: 'Order updated',
      subtitle: `Moved "${moved.title}"`,
    });
    setTimeout(() => setTopToast(null), 2000);
  };

  const handleDragStart = (e, index) => {
    setDraggedCardIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedCardIndex === null || draggedCardIndex === targetIndex || !currentTree?.cards) return;

    const newCards = [...currentTree.cards];
    const [moved] = newCards.splice(draggedCardIndex, 1);
    newCards.splice(targetIndex, 0, moved);

    const reindexed = newCards.map((c, i) => ({ ...c, position: i }));
    setCurrentTree({ ...currentTree, cards: reindexed });
    reindexed.forEach((c) => {
      storage.updateCard(c.id, { position: c.position });
      fetch(`/api/admin/cards/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ position: c.position }),
      }).catch(() => {});
    });
    setDraggedCardIndex(null);

    setTopToast({
      title: 'Order updated',
      subtitle: `Moved "${moved.title}"`,
    });
    setTimeout(() => setTopToast(null), 2000);
  };

  const handleCopyLiveUrl = async () => {
    if (!currentTree?.slug) return;
    const url = getCanonicalTreeUrl(currentTree.slug);
    await copyToClipboard(url);
    setCopiedUrl(true);
    setTopToast({
      title: 'Link copied to clipboard',
      subtitle: url,
    });
    setTimeout(() => {
      setCopiedUrl(false);
      setTopToast(null);
    }, 2500);
  };

  const basePreset =
    PRESET_THEMES.find((p) => p.id === currentTree?.themeId)?.theme ||
    PRESET_THEMES[0].theme;
  const activeTheme = {
    ...basePreset,
    ...(currentTree?.customTheme || {}),
  };

  const isFooterEnabled =
    currentTree?.footerEnabled !== undefined
      ? currentTree.footerEnabled
      : currentTree?.customTheme?.footerEnabled !== undefined
      ? currentTree.customTheme.footerEnabled
      : footerEnabled;

  const currentSlug = currentTree?.slug || currentUser?.username || 'riyast';
  const currentHeaderLayout = currentTree?.headerLayout || currentTree?.customTheme?.headerLayout || 'classic';

  const renderPhoneHeader = () => {
    const layout = currentHeaderLayout;
    const isLogo = (currentTree?.titleStyle || currentTree?.customTheme?.titleStyle) === 'logo';
    const logoUrl = currentTree?.logoUrl || currentTree?.customTheme?.logoUrl;
    const titleText = currentTree?.title || `@${currentSlug}`;
    const bioText = currentTree?.bio || '';
    const altFontEnabled = currentTree?.altFontEnabled ?? currentTree?.customTheme?.altFontEnabled ?? false;
    const titleFont = altFontEnabled
      ? (currentTree?.titleFont || currentTree?.customTheme?.titleFont || 'Manrope')
      : (currentTree?.fontFamily || currentTree?.customTheme?.fontFamily || 'inherit');
    const titleColor = currentTree?.titleColor || currentTree?.customTheme?.titleColor || currentTree?.textColor || currentTree?.customTheme?.textColor || '#111111';

    const renderTitleBlock = (isHero = false) => (
      <div className="flex flex-col items-center text-center space-y-1 mt-1">
        {isLogo && logoUrl ? (
          <img src={logoUrl} alt="Logo" className="max-h-12 max-w-[220px] object-contain mt-2.5 mb-1.5" />
        ) : (
          <h2
            className={`font-black text-[28px] sm:text-[32px] tracking-tight leading-tight ${isHero ? 'text-white drop-shadow-xs' : ''}`}
            style={{
              color: isHero ? '#ffffff' : titleColor,
              fontFamily: titleFont !== 'inherit' ? `'${titleFont}', sans-serif` : 'inherit',
            }}
          >
            {titleText}
          </h2>
        )}
        {bioText && (
          <p
            className={`text-sm sm:text-[15px] font-medium leading-relaxed max-w-[280px] mt-1 mb-2 ${isHero ? 'text-white/90 drop-shadow-2xs' : 'text-gray-300'}`}
            style={{ color: isHero ? '#ffffffcc' : (currentTree?.textColor || currentTree?.customTheme?.textColor || '#9CA3AF') }}
          >
            {bioText}
          </p>
        )}
      </div>
    );

    const defaultAvatarSvg = (
      <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    );

    if (layout === 'hero') {
      const heroImage =
        currentTree?.heroUrl ||
        currentTree?.customTheme?.heroUrl ||
        currentTree?.avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
      return (
        <div className="w-full flex flex-col items-center text-center mb-3">
          <div className="w-full h-52 sm:h-56 rounded-2xl overflow-hidden relative shadow-xs bg-rose-600">
            <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
            {/* Soft gradient fade into card background matching Hero thumbnail */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#EEF1F6] via-[#EEF1F6]/50 to-transparent" />
          </div>
          {renderTitleBlock()}
        </div>
      );
    }

    if (layout === 'banner') {
      const bannerImage = currentTree?.bannerUrl || currentTree?.customTheme?.bannerUrl;
      return (
        <div className="w-full flex flex-col items-center text-center mb-3">
          {/* Top wide banner cover with equal left, right, and top padding */}
          <div className="w-full h-32 sm:h-34 rounded-2xl overflow-hidden relative shadow-xs bg-gradient-to-r from-[#FF007A] via-[#C026D3] to-[#7928CA] shrink-0">
            {bannerImage ? (
              <img src={bannerImage} alt="Banner" className="w-full h-full object-cover object-center" />
            ) : (
              <div className="w-full h-full opacity-90 bg-gradient-to-r from-[#FF007A] via-[#A855F7] to-[#7928CA]" />
            )}
          </div>
          {/* Circular avatar overlapping bottom of banner with crisp white border */}
          <div className="-mt-10 mb-2 relative ring-4 ring-white rounded-full shadow-md w-20 h-20 aspect-square shrink-0 overflow-hidden bg-white flex items-center justify-center z-10">
            {currentTree?.avatarUrl ? (
              <img src={currentTree.avatarUrl} alt="Avatar" className="w-full h-full object-cover object-center" />
            ) : defaultAvatarSvg}
          </div>
          {renderTitleBlock()}
        </div>
      );
    }

    if (layout === 'cutout') {
      const cutoutImg = currentTree?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
      return (
        <div className="w-full flex flex-col items-center text-center mb-3">
          {/* Cutout silhouette with soft fade at chest matching Cutout thumbnail */}
          <div className="w-28 h-32 relative flex items-end justify-center mb-1 overflow-hidden [mask-image:linear-gradient(to_bottom,black_75%,transparent_100%)]">
            <img src={cutoutImg} alt="Cutout" className="w-full h-full object-cover filter drop-shadow-md" />
          </div>
          {renderTitleBlock()}
        </div>
      );
    }

    if (layout === 'shape') {
      const shapeImg = currentTree?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
      return (
        <div className="w-full flex flex-col items-center text-center mb-3">
          {/* Exact 4-lobed cloud/flower organic shape matching Shape thumbnail */}
          <div
            className="w-28 h-20 relative flex items-center justify-center mb-2 shadow-xs"
            style={{ clipPath: 'url(#linktree-organic-shape)' }}
          >
            <div className="absolute inset-0 bg-rose-600" />
            <img src={shapeImg} alt="Shape" className="w-full h-full object-cover relative z-10" />
          </div>
          {renderTitleBlock()}
        </div>
      );
    }

    // Default: 'classic'
    return (
      <div className="flex flex-col items-center text-center mt-10 sm:mt-12 mb-3 shrink-0">
        <div className="w-32 h-32 sm:w-36 sm:h-36 aspect-square rounded-full bg-[#B5B9BE] flex items-center justify-center overflow-hidden mb-4 shadow-lg ring-1 ring-white/15 shrink-0">
          {currentTree?.avatarUrl ? (
            <img src={currentTree.avatarUrl} alt="Avatar" className="w-full h-full object-cover object-center" />
          ) : defaultAvatarSvg}
        </div>
        {renderTitleBlock()}
      </div>
    );
  };

  // Protected Route: dashboard requires an authenticated account
  if (!currentUser) {
    return (
      <>
        <LandingPage
          onNavigate={navigate}
          currentUser={null}
          onLogout={handleLogout}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode || 'login');
            setIsAuthModalOpen(true);
          }}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={null}
          onAuthSuccess={handleAuthSuccess}
          onLogout={handleLogout}
          initialMode={authModalMode}
          treesCount={trees.length}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFB] text-[#111111] flex flex-col font-sans select-none antialiased">
      {/* Global Organic Shape SVG clipPath for Shape layout */}
      <svg className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <defs>
          <clipPath id="linktree-organic-shape" clipPathUnits="objectBoundingBox">
            <path d="M 0.5,0.02 C 0.72,0.02, 0.94,0.12, 0.98,0.32 C 1.01,0.42, 0.95,0.48, 0.91,0.5 C 0.95,0.52, 1.01,0.58, 0.98,0.68 C 0.94,0.88, 0.72,0.98, 0.5,0.98 C 0.28,0.98, 0.06,0.88, 0.02,0.68 C -0.01,0.58, 0.05,0.52, 0.09,0.5 C 0.05,0.48, -0.01,0.42, 0.02,0.32 C 0.06,0.12, 0.28,0.02, 0.5,0.02 Z" />
          </clipPath>
        </defs>
      </svg>
      {/* 1. Topmost Dark Header Band matching Reference */}
      <div className="hidden lg:flex h-10 bg-[#232833] px-5 items-center justify-between shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white font-extrabold text-xs hover:text-[#26D07C] transition-colors cursor-pointer"
          title="Back to IndiaTaps Main Site"
        >
          <span className="text-[#26D07C] font-black text-xl leading-none select-none tracking-tight">✱</span>
          <span>IndiaTaps</span>
        </button>
        <div className="flex items-center gap-3 text-xs font-semibold text-gray-400">
          <button
            onClick={() => navigate('/')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            ← Main Site
          </button>
          <span className="text-gray-600">|</span>
          <span className="text-[#26D07C]">Admin Dashboard</span>
        </div>
      </div>

      {/* 2. Secondary Navigation Bar matching Reference */}
      <header className="hidden lg:flex h-12 bg-[#FAFBFB] px-4 sm:px-6 items-center justify-between z-30 shrink-0">
        {/* Left: Hamburger menu button */}
        <div className="flex items-center gap-3 w-16">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-xl hover:bg-gray-200/60 text-gray-800 transition-colors cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Center: Tree Switcher Dropdown Pill */}
        <div className="flex items-center justify-center">
          <TreeSwitcher
            trees={trees}
            currentTree={currentTree}
            onSelectTree={(tree) => loadTreeDetails(tree.id)}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onDeleteTree={(tree) => promptDeleteTree(tree)}
            initialOpen={false}
          />
        </div>

        {/* Right: User account pill & Copy link pill button */}
        <div className="flex items-center gap-2.5 justify-end">
          {/* User Account / Login Status Pill */}
          {currentUser ? (
            <button
              onClick={() => {
                setAuthModalMode('dashboard');
                setIsAuthModalOpen(true);
              }}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border border-gray-200/90 hover:border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold text-[#111111] shadow-2xs transition-all cursor-pointer group"
              title={`Logged in as ${currentUser.email}`}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black relative">
                {(currentUser.email || 'A')[0].toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00E575] border border-white ring-1 ring-[#00E575]/20 animate-pulse" />
              </div>
              <div className="flex flex-col items-start text-left leading-none">
                <span className="text-[11px] font-extrabold text-gray-900 group-hover:text-purple-600 transition-colors">
                  {currentUser.email ? (currentUser.email.length > 20 ? currentUser.email.substring(0, 18) + '...' : currentUser.email) : 'Account'}
                </span>
                <span className="text-[9px] text-gray-400 font-mono">
                  {currentUser.role === 'super_admin' ? 'Super Admin' : `${trees.length} card${trees.length === 1 ? '' : 's'}`}
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={() => {
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign in</span>
            </button>
          )}

          <button
            onClick={() => setPreviewPhoneView(!previewPhoneView)}
            className="lg:hidden p-2 rounded-full border border-gray-200 hover:bg-gray-50 cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-[#7033FF]" />
          </button>

          {activeCardDetail ? (
            <button
              onClick={handleCopyLiveUrl}
              className="flex items-center gap-2 px-3.5 py-1 rounded-full border border-gray-200/90 hover:border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold text-[#111111] shadow-2xs transition-all cursor-pointer"
              title="Copy live card link"
            >
              {copiedUrl ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-700" />
              )}
              <span>{copiedUrl ? 'Copied' : 'Copy link'}</span>
            </button>
          ) : (
            <button
              onClick={handleCopyLiveUrl}
              className="flex items-center gap-2 px-3.5 py-1 rounded-full border border-gray-200/90 hover:border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold text-[#111111] shadow-2xs transition-all cursor-pointer"
              title="Copy live card link"
            >
              {copiedUrl ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-700" />
              )}
              <span>{copiedUrl ? 'Copied' : 'Copy link'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Floating Toast Notification */}
      {topToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-3 sm:top-22 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-[min(92vw,520px)] z-[60] bg-white border border-gray-200 rounded-2xl sm:rounded-full pl-3.5 pr-3 sm:pr-2 py-2.5 sm:py-1.5 shadow-xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-top-3"
        >
          <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <div className="flex flex-col text-left min-w-0 flex-1">
            <span className="font-extrabold text-[#111111] text-[11px] leading-tight truncate">
              {topToast.title}
            </span>
            <span className="text-[10px] text-gray-400 leading-tight line-clamp-2 break-words">
              {topToast.subtitle}
            </span>
          </div>
          <button
            onClick={handleCopyLiveUrl}
            className="ml-1 px-3 sm:px-3.5 py-1.5 sm:py-1 rounded-full bg-black hover:bg-gray-800 text-white font-bold text-[11px] transition-colors shrink-0 shadow-xs cursor-pointer"
            title="Copy the link to this page"
          >
            <span className="hidden sm:inline">Share link</span>
            <Share2 className="w-3.5 h-3.5 sm:hidden" />
          </button>
        </div>
      )}

      {/* What is going on with the changes. It stays visible in every part of
          the dashboard, also while a card is being edited. */}
      {changeStatus !== 'idle' && (
        <div
          className="fixed bottom-20 right-3 sm:bottom-auto sm:top-22 sm:right-6 z-[55] flex items-center gap-1.5 text-[10px] font-semibold text-gray-600 bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-full pl-2.5 pr-3 py-1.5 shadow-lg"
          role="status"
          aria-live="polite"
        >
          {changeStatus === 'saving' ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving your changes...</span>
            </>
          ) : changeStatus === 'failed' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-red-600">Not saved, try again</span>
            </>
          ) : (
            <>
              <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
              <span>All changes saved</span>
            </>
          )}
        </div>
      )}

      {/* 2. Main Body Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop for Sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Left Side: Either Expanded Sidebar (Image 0 & 1) OR Compact Icon Dock (Image 2) */}
        {isSidebarOpen ? (
          /* EXPANDED SIDEBAR matching Image 0 & Image 1 */
          <aside className="fixed inset-y-0 left-0 z-50 w-72 lg:static lg:z-20 lg:w-64 bg-white border-r border-gray-200 flex flex-col justify-between p-4 shrink-0 overflow-y-auto shadow-2xl lg:shadow-2xs">
            <div className="space-y-4">
              {/* Top row: User pill */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-[#D1D5DB] flex items-center justify-center overflow-hidden shrink-0">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                  </div>
                  <span className="font-bold text-xs truncate max-w-[120px] text-black">
                    {currentSlug}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="lg:hidden text-gray-400 hover:text-black p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-sm font-bold"
                    title="Close sidebar"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Main Navigation (Workspace & Cards Dashboard & Main Site) */}
              <div className="space-y-1 text-xs font-semibold text-gray-700">
                <button
                  onClick={() => {
                    setCurrentView('workspace');
                    setActiveRail('content');
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                    currentView === 'workspace'
                      ? 'bg-[#F3F3F1] text-black font-extrabold shadow-2xs'
                      : 'text-gray-600 hover:text-black hover:bg-gray-50'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Workspace</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentView('dashboard');
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                    currentView === 'dashboard'
                      ? 'bg-[#F3F3F1] text-black font-extrabold shadow-2xs'
                      : 'text-gray-600 hover:text-black hover:bg-gray-50'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-purple-600" />
                  <span>Dashboard</span>
                </button>

                {isSuper && (
                  <button
                    onClick={() => {
                      setCurrentView('super_admin');
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      currentView === 'super_admin'
                        ? 'bg-purple-100 text-purple-950 font-black shadow-2xs border border-purple-200'
                        : 'text-purple-700 hover:text-purple-950 hover:bg-purple-50 font-bold'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span>Super Admin</span>
                    <span className="ml-auto text-[9px] font-black uppercase bg-purple-700 text-white px-1.5 py-0.5 rounded">Console</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer text-gray-600 hover:text-black hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-600" />
                  <span>Main Website</span>
                </button>
              </div>

              {/* Account & Digital Card Management (Directly visible without dropdown toggle) */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                {/* Account Card */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F6F6F7] border border-gray-100">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-full bg-[#D1D5DB] flex items-center justify-center overflow-hidden shrink-0">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                      </svg>
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs text-[#111111] leading-tight truncate">{currentSlug}</div>
                      <div className="text-[10px] text-gray-400 font-mono leading-tight truncate">indiataps.com/{currentSlug}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full bg-white shrink-0">
                    Free
                  </span>
                </div>

                {/* Card switcher — every IndiaTaps under this account */}
                {trees.length > 0 && (
                  <div className="rounded-2xl bg-[#F6F6F7] border border-gray-100 p-1.5">
                    <div className="flex items-center gap-1.5 px-2 pt-1 pb-1.5 text-[10px] font-black uppercase tracking-wide text-gray-400">
                      <Layers className="w-3 h-3" />
                      <span>Your IndiaTaps ({trees.length})</span>
                    </div>
                    <div className="space-y-0.5 max-h-52 overflow-y-auto">
                      {trees.map((tree) => {
                        const isActive = currentTree && tree.id === currentTree.id;
                        return (
                          <button
                            key={tree.id}
                            onClick={() => {
                              loadTreeDetails(tree.id);
                              if (currentView !== 'workspace' && currentView !== 'dashboard') {
                                setCurrentView('workspace');
                              }
                              if (window.innerWidth < 1024) setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-white shadow-2xs font-bold text-black'
                                : 'text-gray-600 hover:bg-white/70 hover:text-black'
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                isActive
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-white text-gray-400 border border-gray-200'
                              }`}
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs truncate">@{tree.slug}</span>
                            {typeof tree.cardCount === 'number' && (
                              <span
                                className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                  isActive
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-white border border-gray-200 text-gray-400'
                                }`}
                              >
                                {tree.cardCount} {tree.cardCount === 1 ? 'card' : 'cards'}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Account Actions */}
                <div className="space-y-0.5 text-xs font-semibold text-gray-700">
                  <button
                    onClick={() => {
                      setCurrentView('dashboard');
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <span className="text-sm">⇄</span>
                    <span>Switch IndiaTaps</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsCreateModalOpen(true);
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-gray-500" />
                    <span>Create new IndiaTaps</span>
                  </button>
                  <button
                    onClick={() => {
                      setAuthModalMode('switch');
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>Account</span>
                  </button>
                  <button
                    onClick={() => setIsHelpModalOpen(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <span>📖</span>
                    <span>Help topics</span>
                  </button>
                  {currentUser ? (
                    <button
                      onClick={() => {
                        setIsSidebarOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-red-600 hover:bg-red-50 transition-colors cursor-pointer font-bold"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Log out</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsSidebarOpen(false);
                        setAuthModalMode('login');
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-black hover:bg-gray-50 transition-colors cursor-pointer font-bold"
                    >
                      <User className="w-4 h-4 text-gray-700" />
                      <span>Sign in</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Settings Button beneath menu items */}
            <div className="pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  setAuthModalMode(currentUser ? 'switch' : 'login');
                  setIsAuthModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:text-black hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-500" />
                <span>Settings</span>
                {currentUser ? (
                  <span className="ml-auto text-[10px] text-green-600 font-bold truncate max-w-[120px]">{currentUser.email}</span>
                ) : (
                  <span className="ml-auto text-[10px] text-purple-600 font-bold">Sign in</span>
                )}
              </button>
            </div>
          </aside>
        ) : (
          /* COMPACT DOCK matching Reference with navigation links in vertical center */
          <aside className="hidden lg:flex w-[72px] bg-[#FAFBFB] flex-col items-center py-6 shrink-0 z-20 self-stretch">
            {/* Top spacer to center nav icons */}
            <div className="flex-1" />

            {/* Nav links centered in the left side */}
            <div className="flex flex-col items-center gap-6 py-2">
              {/* Content Button (selected state) */}
              <button
                onClick={() => {
                  setCurrentView('workspace');
                  setActiveRail('content');
                  setActiveTab('links');
                }}
                className="flex flex-col items-center gap-1.5 cursor-pointer group"
                title="Content"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                    currentView === 'workspace' && activeRail === 'content'
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-transparent text-gray-500 hover:bg-gray-200/60 hover:text-black'
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="7" y="3" width="13" height="13" rx="2" />
                    <path d="M4 8v11a2 2 0 0 0 2 2h11" />
                  </svg>
                </div>
                <span className={`text-[10px] font-semibold ${currentView === 'workspace' && activeRail === 'content' ? 'text-black font-bold' : 'text-gray-500'}`}>
                  Content
                </span>
              </button>

              {/* Header Button */}
              <button
                onClick={() => {
                  setCurrentView('workspace');
                  setActiveRail('header');
                }}
                className="flex flex-col items-center gap-1.5 cursor-pointer group"
                title="Header"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                    currentView === 'workspace' && activeRail === 'header'
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-transparent text-gray-500 hover:bg-gray-200/60 hover:text-black'
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="3" />
                    <circle cx="9" cy="10" r="2" />
                    <line x1="15" y1="9" x2="17" y2="9" />
                    <line x1="15" y1="13" x2="17" y2="13" />
                    <path d="M6 16c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5" />
                  </svg>
                </div>
                <span className={`text-[10px] font-semibold ${currentView === 'workspace' && activeRail === 'header' ? 'text-black font-bold' : 'text-gray-500'}`}>
                  Header
                </span>
              </button>

              {/* Design Button */}
              <button
                onClick={() => {
                  setCurrentView('workspace');
                  setActiveRail('design');
                  setActiveTab('design');
                }}
                className="flex flex-col items-center gap-1.5 cursor-pointer group"
                title="Design"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                    currentView === 'workspace' && activeRail === 'design'
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-transparent text-gray-500 hover:bg-gray-200/60 hover:text-black'
                  }`}
                >
                  <Palette className="w-5 h-5 stroke-[2]" />
                </div>
                <span className={`text-[10px] font-semibold ${currentView === 'workspace' && activeRail === 'design' ? 'text-black font-bold' : 'text-gray-500'}`}>
                  Design
                </span>
              </button>

              {/* Enhance Button */}
              <button
                onClick={() => {
                  setCurrentView('workspace');
                  setActiveRail('enhance');
                }}
                className="flex flex-col items-center gap-1.5 cursor-pointer group"
                title="Enhance"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                    currentView === 'workspace' && activeRail === 'enhance'
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-transparent text-gray-500 hover:bg-gray-200/60 hover:text-black'
                  }`}
                >
                  <Sparkles className="w-5 h-5 stroke-[2]" />
                </div>
                <span className={`text-[10px] font-semibold ${currentView === 'workspace' && activeRail === 'enhance' ? 'text-black font-bold' : 'text-gray-500'}`}>
                  Enhance
                </span>
              </button>
            </div>

            {/* Bottom Settings Button with matching bottom spacer */}
            <div className="flex-1 flex flex-col justify-end items-center">
              <button
                onClick={() => {
                  setAuthModalMode(currentUser ? 'switch' : 'login');
                  setIsAuthModalOpen(true);
                }}
                className="w-11 h-11 rounded-full flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-200/60 transition-colors cursor-pointer"
                title="Settings & Accounts (Sign In)"
              >
                <Settings className="w-5 h-5 stroke-[2]" />
              </button>
            </div>
          </aside>
        )}

        {/* 3. Center Main View: Super Admin Console OR Account & Trees Dashboard OR Workspace Editor */}
        {currentView === 'super_admin' && isSuper ? (
          <SuperAdminDashboard
            currentUser={currentUser}
            onGoToWorkspace={() => setCurrentView('workspace')}
            onGoToDashboard={() => setCurrentView('dashboard')}
            onLogout={handleLogout}
          />
        ) : currentView === 'dashboard' ? (
          <CardsDashboard
            currentUser={currentUser}
            currentTree={currentTree}
            trees={trees}
            onSelectTree={(tree) => loadTreeDetails(tree.id)}
            onOpenCreateTree={() => setIsCreateModalOpen(true)}
            onGoToWorkspace={(tree) => {
              if (tree && tree.id !== currentTree?.id) {
                loadTreeDetails(tree.id);
              }
              setCurrentView('workspace');
            }}
            onOpenAddCard={() => setIsAddCardOpen(true)}
            onSelectRail={(rail) => setActiveRail(rail)}
            onSelectTab={(tab) => setActiveTab(tab)}
          />
        ) : (
          <main className="flex-1 p-0 lg:px-1.5 lg:sm:px-2.5 lg:pt-2 lg:pb-4 h-full lg:h-[calc(100vh-88px)] flex justify-center lg:justify-end items-start overflow-hidden">
          <div className={`w-full ${activeRail === 'design' || activeRail === 'header' ? 'max-w-none lg:max-w-[740px] lg:xl:max-w-[820px] h-full' : 'max-w-[740px] xl:max-w-[820px] h-full'} flex flex-col`}>
            {activeCardDetail ? (
              <div className="bg-white rounded-[28px] xl:rounded-[32px] px-2.5 sm:px-3 py-4 sm:py-5 border border-gray-200/80 shadow-2xs flex-1 overflow-y-auto card-scrollbar">
                <CardDetailEditor
                  card={activeCardDetail}
                  onBack={() => {
                    setActiveCardDetail(null);
                    setTopToast({
                      title: 'Link added',
                      subtitle: 'Share a tracked link',
                    });
                    setTimeout(() => setTopToast(null), 4000);
                  }}
                  onUpdateCard={handleUpdateCard}
                  onDeleteCard={(id) => {
                    handleDeleteCard(id);
                    setActiveCardDetail(null);
                  }}
                  activeTheme={activeTheme}
                />
              </div>
            ) : activeRail === 'header' ? (
              <>
                {/* Desktop: Untouched HeaderEditor */}
                <div className="hidden lg:block bg-white rounded-[28px] xl:rounded-[32px] px-6 sm:px-10 py-6 sm:py-8 border border-gray-200/80 shadow-2xs flex-1 overflow-y-auto card-scrollbar">
                  <HeaderEditor currentTree={currentTree} onUpdateTree={handleUpdateTree} />
                </div>
                {/* Mobile: Unified mobile customizer with Header drawer open */}
                <div className="lg:hidden w-full h-full pb-20">
                  <DesignEditor
                    currentTree={currentTree}
                    onUpdateTree={handleUpdateTree}
                    onSaveTree={handleSaveTree}
                    onBack={() => setActiveRail('content')}
                    initialSubview="header"
                  />
                </div>
              </>
            ) : activeRail === 'design' ? (
              <div className="w-full h-full lg:bg-white lg:rounded-[28px] lg:xl:rounded-[32px] lg:px-6 lg:sm:px-10 lg:py-6 lg:sm:py-8 lg:border lg:border-gray-200/80 lg:shadow-2xs flex-1 overflow-y-auto card-scrollbar pb-20 lg:pb-0">
                <DesignEditor
                  currentTree={currentTree}
                  onUpdateTree={handleUpdateTree}
                  onSaveTree={handleSaveTree}
                  onBack={() => setActiveRail('content')}
                />
              </div>
            ) : (
              <div className="bg-white rounded-none rounded-b-[28px] lg:rounded-[28px] lg:xl:rounded-[32px] px-4 sm:px-5 lg:px-2.5 lg:sm:px-3 py-3 lg:py-4 sm:py-5 border-0 lg:border border-gray-200/80 shadow-none lg:shadow-2xs flex-1 overflow-y-auto card-scrollbar space-y-3 lg:space-y-4 pb-5 mb-20 lg:mb-0 lg:pb-5">
                {/* Mobile Top Action Bar matching uploaded Image 0 */}
                <div className="lg:hidden flex items-center justify-between pb-1 -mx-1">
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-1 text-gray-800 hover:text-black hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                    title="Menu"
                  >
                    <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
                  </button>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsMobileMoreMenuOpen(!isMobileMoreMenuOpen)}
                        className="w-9 h-9 rounded-full bg-[#F3F4F6] hover:bg-gray-200 flex items-center justify-center text-gray-800 transition-colors cursor-pointer"
                        title="More options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {/* Dropdown with desktop content header features */}
                      {isMobileMoreMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsMobileMoreMenuOpen(false)}
                          />
                          <div className="absolute right-0 top-11 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5 z-50 text-xs font-semibold space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              type="button"
                              onClick={() => {
                                setIsMobileMoreMenuOpen(false);
                                handleSaveTree();
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-emerald-700 hover:bg-emerald-50 text-left transition-colors cursor-pointer font-bold"
                            >
                              <CloudUpload className="w-4 h-4 text-emerald-600" />
                              <span>Save tree to database</span>
                            </button>

                            {/* Switch between your IndiaTaps (mobile) */}
                            {trees.length > 1 && (
                              <>
                                <div className="my-1 border-t border-gray-100" />
                                <div className="px-3 pt-1 pb-1 text-[10px] font-black uppercase tracking-wide text-gray-400">
                                  Your IndiaTaps
                                </div>
                                {trees.map((tree) => {
                                  const isActive = currentTree && tree.id === currentTree.id;
                                  return (
                                    <button
                                      key={tree.id}
                                      type="button"
                                      onClick={() => {
                                        setIsMobileMoreMenuOpen(false);
                                        loadTreeDetails(tree.id);
                                        if (currentView !== 'workspace' && currentView !== 'dashboard') {
                                          setCurrentView('workspace');
                                        }
                                      }}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                                        isActive
                                          ? 'bg-[#F6F6F7] font-bold text-black'
                                          : 'text-gray-700 hover:text-black hover:bg-[#F6F6F7]'
                                      }`}
                                    >
                                      <Layers
                                        className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-600' : 'text-gray-400'}`}
                                      />
                                      <span className="truncate">@{tree.slug}</span>
                                      {typeof tree.cardCount === 'number' && (
                                        <span className="ml-auto text-[9px] font-bold text-gray-400 shrink-0">
                                          {tree.cardCount} {tree.cardCount === 1 ? 'card' : 'cards'}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </>
                            )}

                            <div className="my-1 border-t border-gray-100" />

                            <button
                              type="button"
                              onClick={() => {
                                setIsMobileMoreMenuOpen(false);
                                setIsReordering(!isReordering);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-gray-700 hover:text-black hover:bg-[#F6F6F7] text-left transition-colors cursor-pointer"
                            >
                              <ArrowUpDown className="w-4 h-4 text-purple-600" />
                              <span>{isReordering ? 'Done reordering' : 'Reorder links'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsMobileMoreMenuOpen(false);
                                setFilterHiddenOnly(!filterHiddenOnly);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-gray-700 hover:text-black hover:bg-[#F6F6F7] text-left transition-colors cursor-pointer"
                            >
                              <EyeOff className="w-4 h-4 text-gray-600" />
                              <span>{filterHiddenOnly ? 'Show all links' : 'View hidden only'}</span>
                            </button>

                            <div className="my-1 border-t border-gray-100" />

                            <button
                              type="button"
                              onClick={() => {
                                setIsMobileMoreMenuOpen(false);
                                const targetCards = filterHiddenOnly
                                  ? (currentTree?.cards || []).filter((c) => c.visible === false)
                                  : currentTree?.cards || [];

                                if (targetCards.length === 0) {
                                  setTopToast({
                                    title: 'Nothing to delete',
                                    subtitle: filterHiddenOnly ? 'No hidden links found' : 'Tree has no links',
                                  });
                                  setTimeout(() => setTopToast(null), 3000);
                                  return;
                                }

                                setCardPendingDelete({
                                  title: filterHiddenOnly ? 'all hidden links' : 'all links',
                                  isBulk: true,
                                  count: targetCards.length,
                                  cards: targetCards,
                                });
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 text-left transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>{filterHiddenOnly ? 'Delete hidden' : 'Delete all links'}</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveTree}
                      disabled={isSavingTree}
                      className={`h-9 w-9 sm:w-auto sm:px-3 rounded-full text-xs font-bold flex items-center justify-center sm:justify-start gap-1.5 transition-all cursor-pointer shadow-2xs ${
                        treeSavedRecently
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#111111] hover:bg-neutral-800 text-white'
                      } disabled:opacity-75`}
                      title="Save tree to database"
                    >
                      {isSavingTree ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : treeSavedRecently ? (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        <CloudUpload className="w-3.5 h-3.5" />
                      )}
                      {/* On a phone the icon alone is enough, the button is in
                          the bar below as well. */}
                      <span className="hidden sm:inline">
                        {isSavingTree ? 'Saving...' : treeSavedRecently ? 'Saved' : 'Save tree'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyLiveUrl}
                      className="h-9 px-3.5 rounded-full bg-[#EEEEEE] hover:bg-gray-200 text-xs font-bold text-gray-900 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Copy live card link"
                    >
                      {copiedUrl ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 stroke-[2.2] text-gray-800" />
                      )}
                      <span>{copiedUrl ? 'Copied' : 'Copy link'}</span>
                    </button>
                  </div>
                </div>

                {/* Mobile Profile Header Row matching uploaded Image 0 */}
                <div className="lg:hidden flex flex-col pt-1 pb-1">
                  {/* Optional Banner Cover if Banner / Hero layout is enabled */}
                  {currentHeaderLayout === 'banner' && (currentTree?.bannerUrl || currentTree?.customTheme?.bannerUrl) && (
                    <div className="w-full h-24 rounded-2xl overflow-hidden relative shadow-xs mb-2 border border-gray-200/60 shrink-0">
                      <img
                        src={currentTree?.bannerUrl || currentTree?.customTheme?.bannerUrl}
                        alt="Banner cover"
                        className="w-full h-full object-cover block"
                      />
                    </div>
                  )}

                  {currentHeaderLayout === 'hero' && (currentTree?.heroUrl || currentTree?.customTheme?.heroUrl) && (
                    <div className="w-full h-28 rounded-2xl overflow-hidden relative shadow-xs mb-2 border border-gray-200/60 shrink-0">
                      <img
                        src={currentTree?.heroUrl || currentTree?.customTheme?.heroUrl}
                        alt="Hero cover"
                        className="w-full h-full object-cover block"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-3.5">
                    {/* Squircle / Circular Avatar with strict dimensions */}
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="w-14 h-14 min-w-14 min-h-14 max-w-14 max-h-14 rounded-full bg-[#B5B9BE] flex items-center justify-center overflow-hidden shrink-0 shadow-inner cursor-pointer relative"
                      title="Change profile photo"
                    >
                      {currentTree?.avatarUrl ? (
                        <img
                          src={currentTree.avatarUrl}
                          alt="Avatar"
                          className="w-14 h-14 rounded-full object-cover block"
                        />
                      ) : (
                        <User className="w-7 h-7 text-white" />
                      )}
                    </button>

                    <div className="flex flex-col gap-1.5 overflow-hidden flex-1">
                      {/* @riyast */}
                      <span className="font-extrabold text-sm text-gray-900 truncate">@{currentSlug}</span>

                      {/* Social Action Circles Row with + Badge */}
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                        <button
                          type="button"
                          onClick={() => handleAddSocialQuick('instagram')}
                          className="w-8 h-8 rounded-full border border-gray-200/90 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-700 relative shrink-0 shadow-2xs cursor-pointer"
                          title="Add Instagram"
                        >
                          <Instagram className="w-4 h-4 stroke-[1.8]" />
                          <span className="w-3.5 h-3.5 rounded-full bg-white border border-gray-300 text-gray-700 text-[8px] font-black flex items-center justify-center absolute -top-1 -right-1 shadow-2xs leading-none">
                            +
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddSocialQuick('whatsapp')}
                          className="w-8 h-8 rounded-full border border-gray-200/90 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-700 relative shrink-0 shadow-2xs cursor-pointer"
                          title="Add WhatsApp"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08s.89 2.42 1.01 2.59c.13.17 1.75 2.67 4.24 3.75.59.26 1.05.41 1.41.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z"/>
                          </svg>
                          <span className="w-3.5 h-3.5 rounded-full bg-white border border-gray-300 text-gray-700 text-[8px] font-black flex items-center justify-center absolute -top-1 -right-1 shadow-2xs leading-none">
                            +
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddSocialQuick('mail')}
                          className="w-8 h-8 rounded-full border border-gray-200/90 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-700 relative shrink-0 shadow-2xs cursor-pointer"
                          title="Add Email"
                        >
                          <Mail className="w-4 h-4 stroke-[1.8]" />
                          <span className="w-3.5 h-3.5 rounded-full bg-white border border-gray-300 text-gray-700 text-[8px] font-black flex items-center justify-center absolute -top-1 -right-1 shadow-2xs leading-none">
                            +
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsAddCardOpen(true)}
                          className="w-8 h-8 rounded-full border border-gray-200/90 bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 shrink-0 shadow-2xs cursor-pointer"
                          title="Add More"
                        >
                          <Plus className="w-4 h-4 stroke-[2]" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Show Total Followers Pill removed */}
                </div>

                {/* Mobile tree switcher — chips under the account header */}
                {trees.length > 1 && (
                  <div className="lg:hidden pb-1 -mt-1">
                    <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {trees.map((tree) => {
                        const isActive = currentTree && tree.id === currentTree.id;
                        return (
                          <button
                            key={tree.id}
                            type="button"
                            onClick={() => {
                              loadTreeDetails(tree.id);
                              if (currentView !== 'workspace' && currentView !== 'dashboard') {
                                setCurrentView('workspace');
                              }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 border transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-[#111111] text-white border-[#111111]'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-black'
                            }`}
                          >
                            <Layers className={`w-3 h-3 shrink-0 ${isActive ? 'text-white/80' : 'text-gray-400'}`} />
                            <span>@{tree.slug}</span>
                            {typeof tree.cardCount === 'number' && (
                              <span className={isActive ? 'text-white/60 font-semibold' : 'text-gray-400 font-semibold'}>
                                {tree.cardCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Desktop Header Title & Top Right Icons matching Image 1 */}
                <div className="hidden lg:flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold tracking-tight text-[#111111]">
                      Content
                    </h1>
                    <button
                      type="button"
                      onClick={handleSaveTree}
                      disabled={isSavingTree}
                      className={`h-8 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                        treeSavedRecently
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-[#111111] hover:bg-neutral-800 text-white'
                      } disabled:opacity-75`}
                      title="Save tree state to database"
                    >
                      {isSavingTree ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : treeSavedRecently ? (
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      ) : (
                        <CloudUpload className="w-3 h-3" />
                      )}
                      <span>{isSavingTree ? 'Saving...' : treeSavedRecently ? 'Saved' : 'Save tree'}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    {/* Drag / Reorder mode toggle button */}
                    <button
                      onClick={() => setIsReordering(!isReordering)}
                      className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                        isReordering
                          ? 'bg-black text-white hover:bg-neutral-800'
                          : 'hover:bg-gray-100 text-gray-600 hover:text-black'
                      }`}
                      title={isReordering ? 'Done reordering (click to lock)' : 'Reorder / Drag links'}
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </button>

                    {/* View only hidden subsection option */}
                    <button
                      onClick={() => setFilterHiddenOnly(!filterHiddenOnly)}
                      className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                        filterHiddenOnly
                          ? 'bg-black text-white hover:bg-neutral-800'
                          : 'hover:bg-gray-100 text-gray-600 hover:text-black'
                      }`}
                      title={filterHiddenOnly ? 'Showing hidden links only (click to view all)' : 'View only hidden links'}
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>

                    {/* Delete option with confirmation modal + 15s undo timer */}
                    <button
                      onClick={() => {
                        const targetCards = filterHiddenOnly
                          ? (currentTree?.cards || []).filter((c) => c.visible === false)
                          : currentTree?.cards || [];

                        if (targetCards.length === 0) {
                          setTopToast({
                            title: 'Nothing to delete',
                            subtitle: filterHiddenOnly ? 'No hidden links found' : 'Tree has no links',
                          });
                          setTimeout(() => setTopToast(null), 3000);
                          return;
                        }

                        setCardPendingDelete({
                          title: filterHiddenOnly ? 'all hidden links' : 'all links',
                          isBulk: true,
                          count: targetCards.length,
                          cards: targetCards,
                        });
                      }}
                      className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-red-600 transition-colors cursor-pointer"
                      title={filterHiddenOnly ? 'Delete hidden links' : 'Delete all links'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Desktop Profile Block: Centered Avatar & Username matching Image 1 */}
                <div className="hidden lg:flex flex-col items-center justify-center text-center py-2 space-y-2">
                  <input
                    type="file"
                    ref={avatarInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative group w-16 h-16 rounded-full bg-[#D1D5DB] flex items-center justify-center overflow-hidden shrink-0 shadow-inner cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all"
                    title="Click to upload profile photo"
                  >
                    {currentTree?.avatarUrl ? (
                      <img
                        src={currentTree.avatarUrl}
                        alt="Profile avatar"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                      </svg>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                      <Camera className="w-4 h-4" />
                    </div>
                  </button>
                  <div className="font-bold text-sm text-[#111111]">@{currentSlug}</div>
                </div>

                {/* Add to your bios banner matching Reference (Desktop only) */}
                {isBioBannerVisible && (
                  <div className="hidden lg:flex relative bg-white border border-gray-200/90 rounded-2xl p-3 items-center justify-between shadow-2xs hover:border-gray-300 transition-colors">
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-xs text-[#111111]">Add to your bios</div>
                      <div className="text-[10px] text-gray-400 font-mono">indiataps.com/{currentSlug}</div>
                    </div>
                    <div className="flex items-center gap-2 pr-4">
                      {/* Social bio badge */}
                      <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center text-[7px] font-bold">
                        IG
                      </span>
                      {/* Phone graphic preview */}
                      <div className="w-3.5 h-5 rounded-xs border border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-0.5 px-0.5 py-0.5">
                        <div className="w-2 h-0.5 bg-gray-300 rounded-full" />
                        <div className="w-2 h-0.5 bg-gray-200 rounded-full" />
                      </div>
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </div>
                    {/* Dismiss button on top-right */}
                    <button
                      onClick={() => {
                        setIsBioBannerVisible(false);
                        storage.saveSettings({ bioBannerVisible: false });
                      }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-black hover:border-gray-400 flex items-center justify-center text-[9px] leading-none transition-colors shadow-2xs cursor-pointer"
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Tabs Row: Links / Shop matching Reference */}
                <div className="flex items-center gap-5 border-b border-gray-100 text-xs font-bold pt-1">
                  <button
                    onClick={() => setActiveTab('links')}
                    className={`pb-2 transition-colors relative cursor-pointer ${
                      activeTab === 'links' ? 'text-black font-extrabold' : 'text-gray-400 hover:text-black'
                    }`}
                  >
                    Links
                    {activeTab === 'links' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('shop')}
                    className={`pb-2 transition-colors relative cursor-pointer ${
                      activeTab === 'shop' ? 'text-black font-extrabold' : 'text-gray-400 hover:text-black'
                    }`}
                  >
                    Shop
                    {activeTab === 'shop' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />
                    )}
                  </button>
                </div>

                {/* Action Buttons Row: [ ⊞ Add collection ], [ + Add ], and [ 💾 Save tree ] */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button
                    onClick={() => handleAddCard('collapsible', '', { subtitle: '', isSettingUp: true })}
                    className="h-11 py-2.5 px-2 sm:px-3 rounded-full bg-[#EAEAE8] hover:bg-[#E2E2E0] text-xs font-bold text-[#111111] flex items-center justify-center gap-1.5 sm:gap-2 transition-colors cursor-pointer truncate"
                  >
                    {/* Collection grid icon */}
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                    <span className="truncate">Add collection</span>
                  </button>

                  <button
                    onClick={() => setIsAddCardOpen(true)}
                    className="h-11 py-2.5 px-2 sm:px-3 rounded-full bg-black hover:bg-neutral-800 text-xs font-bold text-white flex items-center justify-center gap-1.5 sm:gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                    <span>Add</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveTree}
                    disabled={isSavingTree}
                    className={`h-11 py-2.5 px-2 sm:px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-75 ${
                      treeSavedRecently
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white'
                    }`}
                    title="Save all cards and tree state to database"
                  >
                    {isSavingTree ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    ) : treeSavedRecently ? (
                      <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                    ) : (
                      <CloudUpload className="w-3.5 h-3.5 stroke-[2.2] shrink-0" />
                    )}
                    <span className="truncate">{isSavingTree ? 'Saving...' : treeSavedRecently ? 'Saved!' : 'Save tree'}</span>
                  </button>
                </div>


                {/* Cards List with Internal Scroll Matching Reference */}
                {activeTab === 'links' && (
                  <div className="space-y-3 pt-1.5">
                    {/* Reordering Active Banner */}
                    {isReordering && (
                      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#111111] text-white text-xs shadow-xs animate-in fade-in">
                        <div className="flex items-center gap-2 font-bold text-[11px]">
                          <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
                          <span>Drag cards to reorder</span>
                        </div>
                        <button
                          onClick={() => setIsReordering(false)}
                          className="text-[11px] font-bold px-3 py-1 rounded-full bg-white text-black hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    )}

                    {filterHiddenOnly && (
                      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#EAEAEA] border border-gray-300/80 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-[11px] text-gray-800">
                          <EyeOff className="w-3.5 h-3.5 text-gray-600" />
                          <span>
                            Viewing hidden links only (
                            {
                              (currentTree?.cards || []).filter(
                                (c) => c.visible === false
                              ).length
                            }
                            )
                          </span>
                        </div>
                        <button
                          onClick={() => setFilterHiddenOnly(false)}
                          className="text-[10px] font-bold text-gray-600 hover:text-black underline cursor-pointer"
                        >
                          Show all
                        </button>
                      </div>
                    )}

                    {/* Render current tree cards */}
                    {(() => {
                      const displayedCards = (currentTree?.cards || []).filter((c) =>
                        filterHiddenOnly ? c.visible === false : true
                      );

                      if (displayedCards.length === 0) {
                        return (
                          <div className="text-center py-12 text-gray-400 text-xs space-y-1.5">
                            {filterHiddenOnly ? (
                              <>
                                <EyeOff className="w-6 h-6 mx-auto text-gray-400" />
                                <div className="font-bold text-gray-600 text-xs">No hidden links</div>
                                <div className="text-[11px] text-gray-400">
                                  Use the 3-dots menu on any link and select "Hide"
                                </div>
                              </>
                            ) : (
                              'No links in this tree yet. Click "+ Add" to add your first link!'
                            )}
                          </div>
                        );
                      }

                      return displayedCards.map((card, index) => {
                        const isGallery = card.type === 'gallery' || card.settings?.platform === 'gallery' || Boolean(card.settings?.images);
                        const isSetupNeeded = Boolean(
                          (!card.url || card.url.trim() === '' || card.url === 'https://' || card.settings?.needsSetup) &&
                          card.type !== 'collapsible' &&
                          !isGallery
                        );
                        const isHidden = card.visible === false;
                        const isDragging = draggedCardIndex === index;
                        const displaySubtitle = card.type === 'collapsible'
                          ? (card.subtitle || '')
                          : isGallery
                            ? (card.subtitle || '')
                            : card.url
                              ? card.url.replace(/^https?:\/\//, '').split('/')[0]
                              : (card.subtitle || '');
                        // A card that has no name yet is named here, in the
                        // list of the owner only. Nothing is put on the
                        // public page.
                        const displayTitle = card.title ||
                          (card.type === 'collapsible' ? 'Collection' : 'Untitled card');

                        return (
                          <div
                            key={card.id}
                            // The row opens the card, so it has to be usable
                            // with the keyboard as well.
                            role={isReordering ? undefined : 'button'}
                            tabIndex={isReordering ? undefined : 0}
                            aria-label={
                              isReordering
                                ? undefined
                                : `Edit ${card.title || 'this card'}`
                            }
                            onKeyDown={(e) => {
                              if (isReordering) return;
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setActiveCardDetail(card);
                              }
                            }}
                            onFocus={(e) => {
                              if (isReordering) return;
                              // Only draw the ring for keyboard use; a tap or
                              // click must not light the whole row up.
                              if (e.currentTarget.matches(':focus-visible')) {
                                e.currentTarget.style.outline = '2px solid #7033FF';
                                e.currentTarget.style.outlineOffset = '2px';
                              }
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.outline = 'none';
                            }}
                            draggable={isReordering && !filterHiddenOnly}
                            onDragStart={(e) => {
                              if (!isReordering) return;
                              handleDragStart(e, index);
                            }}
                            onDragOver={(e) => {
                              if (!isReordering) return;
                              handleDragOver(e, index);
                            }}
                            onDrop={(e) => {
                              if (!isReordering) return;
                              handleDrop(e, index);
                            }}
                            onClick={() => {
                              if (!isReordering) setActiveCardDetail(card);
                            }}
                            className={`group rounded-[22px] sm:rounded-3xl py-3.5 px-3.5 sm:px-4 min-h-[66px] shadow-2xs transition-all flex items-center justify-between gap-3 ${
                              // The open card menu hangs below the row, and
                              // content-visibility clips whatever hangs out,
                              // so it must be off while its menu is open.
                              cardMenuId === card.id
                                ? ''
                                : '[content-visibility:auto] [contain-intrinsic-size:auto_66px]'
                            } ${
                              isReordering
                                ? 'cursor-grab active:cursor-grabbing border-purple-300 ring-2 ring-purple-100 hover:border-purple-400'
                                : 'cursor-pointer'
                            } ${
                              isDragging ? 'opacity-40 border-dashed border-2 border-black scale-98' : ''
                            } ${
                              isHidden
                                ? 'bg-[#EAEAEA] border border-gray-300/80 text-gray-500 hover:bg-[#E2E2E2]'
                                : 'bg-white border border-gray-200/90 hover:border-gray-300 hover:shadow-xs'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Drag Handle: shown only when Reorder mode is enabled */}
                              {isReordering && !filterHiddenOnly && (
                                <div className="flex items-center gap-1 shrink-0 -ml-1">
                                  <div
                                    className="cursor-grab active:cursor-grabbing text-purple-600 hover:text-purple-800 transition-colors p-1"
                                    title="Drag to reorder"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </div>
                                  <div className="lg:hidden flex flex-col gap-0.5">
                                    {index > 0 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMoveCard(index, -1);
                                        }}
                                        className="p-0.5 text-gray-500 hover:text-purple-600 bg-gray-100 rounded cursor-pointer"
                                        title="Move up"
                                      >
                                        <ArrowUp className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                    {index < displayedCards.length - 1 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMoveCard(index, 1);
                                        }}
                                        className="p-0.5 text-gray-500 hover:text-purple-600 bg-gray-100 rounded cursor-pointer"
                                        title="Move down"
                                      >
                                        <ArrowDown className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className={isHidden ? 'opacity-60' : ''}>
                                <FaviconIcon
                                  card={card}
                                  className="w-5 h-5"
                                  containerClassName="w-11 h-11 rounded-[16px] shrink-0"
                                />
                              </div>

                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className={`font-bold text-[13px] sm:text-sm truncate leading-snug ${
                                    !card.title
                                      ? 'text-gray-400 italic'
                                      : isHidden
                                        ? 'text-gray-500'
                                        : 'text-[#111111]'
                                  }`}>
                                    {displayTitle}
                                  </span>
                                  {isHidden && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-300/80 text-[9px] font-bold text-gray-600 shrink-0">
                                      <EyeOff className="w-2.5 h-2.5" />
                                      Hidden
                                    </span>
                                  )}
                                </div>
                                <div className={`text-[11px] truncate flex items-center gap-1.5 ${isHidden ? 'text-gray-400' : 'text-gray-400'}`}>
                                  {card.type === 'collapsible' ? (
                                    <span className="truncate">{displaySubtitle}</span>
                                  ) : (
                                    <>
                                      <span>{card.clicks || 0} clicks</span>
                                      {displaySubtitle && (
                                        <>
                                          <span>·</span>
                                          <span className="truncate">{displaySubtitle}</span>
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {isSetupNeeded && (
                                <button
                                  onClick={() => setActiveCardDetail(card)}
                                  className="px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#D97706] text-[11px] font-bold flex items-center gap-1 hover:bg-amber-100 transition-colors cursor-pointer"
                                >
                                  <Key className="w-3 h-3 fill-current" />
                                  <span>Setup</span>
                                </button>
                              )}

                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    // Not enough room below inside the scroll
                                    // sheet? Open the menu above the dots.
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const scroller = e.currentTarget.closest('.overflow-y-auto');
                                    const limit = scroller
                                      ? scroller.getBoundingClientRect().bottom
                                      : window.innerHeight;
                                    setCardMenuOpenUp(limit - rect.bottom < 240);
                                    setCardMenuId(cardMenuId === card.id ? null : card.id);
                                  }}
                                  className="p-2.5 -m-1 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
                                  title="More options"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {/* Card Context Menu matching Image 1 */}
                                {cardMenuId === card.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-30"
                                      onClick={() => setCardMenuId(null)}
                                    />
                                    <div className={`absolute right-0 ${cardMenuOpenUp ? 'bottom-9' : 'top-9'} w-36 bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5 z-40 text-xs font-semibold space-y-0.5 animate-in fade-in zoom-in-95 duration-100`}>
                                      <button
                                        onClick={() => {
                                          setCardMenuId(null);
                                          setActiveCardDetail(card);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:text-black hover:bg-[#F6F6F7] text-left transition-colors cursor-pointer"
                                      >
                                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                                        <span>Edit</span>
                                      </button>

                                      <button
                                        onClick={() => {
                                          setCardMenuId(null);
                                          handleDuplicateCard(card);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:text-black hover:bg-[#F6F6F7] text-left transition-colors cursor-pointer"
                                      >
                                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                                        <span>Duplicate</span>
                                      </button>

                                      <button
                                        onClick={() => {
                                          setCardMenuId(null);
                                          if (card.url && navigator.clipboard) {
                                            navigator.clipboard.writeText(card.url);
                                            setTopToast({ title: 'Link copied', subtitle: card.url });
                                            setTimeout(() => setTopToast(null), 3000);
                                          }
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:text-black hover:bg-[#F6F6F7] text-left transition-colors cursor-pointer"
                                      >
                                        <Share2 className="w-3.5 h-3.5 text-gray-500" />
                                        <span>Share</span>
                                      </button>

                                      <button
                                        onClick={() => {
                                          setCardMenuId(null);
                                          const nextVisible = card.visible === false ? true : false;
                                          handleUpdateCard(card.id, { visible: nextVisible });
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:text-black hover:bg-[#F6F6F7] text-left transition-colors cursor-pointer"
                                      >
                                        <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                                        <span>{card.visible === false ? 'Unhide' : 'Hide'}</span>
                                      </button>

                                      {index > 0 && !filterHiddenOnly && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCardMenuId(null);
                                            handleMoveCard(index, -1);
                                          }}
                                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:text-black hover:bg-[#F6F6F7] text-left transition-colors cursor-pointer"
                                        >
                                          <ArrowUp className="w-3.5 h-3.5 text-gray-500" />
                                          <span>Move up</span>
                                        </button>
                                      )}

                                      {index < displayedCards.length - 1 && !filterHiddenOnly && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCardMenuId(null);
                                            handleMoveCard(index, 1);
                                          }}
                                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:text-black hover:bg-[#F6F6F7] text-left transition-colors cursor-pointer"
                                        >
                                          <ArrowDown className="w-3.5 h-3.5 text-gray-500" />
                                          <span>Move down</span>
                                        </button>
                                      )}

                                      <button
                                        onClick={() => {
                                          setCardMenuId(null);
                                          handleDeleteCard(card.id);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:text-black hover:bg-[#F6F6F7] text-left transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                                        <span>Archive</span>
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}

                    {/* IndiaTaps footer toggle container */}
                    <div className="bg-white border border-gray-200/90 rounded-[22px] p-4 shadow-2xs mt-3.5">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#111111]">IndiaTaps footer</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const next = !isFooterEnabled;
                              setFooterEnabled(next);
                              storage.saveSettings({ footerEnabled: next });
                              if (currentTree) {
                                handleUpdateTree({
                                  footerEnabled: next,
                                  customTheme: {
                                    ...(currentTree.customTheme || {}),
                                    footerEnabled: next,
                                  },
                                });
                              }
                            }}
                            className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                              isFooterEnabled ? 'bg-[#10B981]' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full bg-white block shadow-sm transition-transform ${
                                isFooterEnabled ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Brand Wordmark & Asterisk matching Image 0 & 2 */}
                      <div className="font-extrabold text-xs flex items-center gap-0.5 text-[#111111] mt-1">
                        <span>IndiaTaps</span>
                        <span className="text-[#10B981] font-black text-xs">✱</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shop Tab */}
                {activeTab === 'shop' && (
                  <div className="space-y-4 pt-2">
                    <button
                      onClick={() =>
                        handleAddCard('product', 'Special Edition Product', {
                          price: '$49.00',
                        })
                      }
                      className="w-full py-3 rounded-full bg-[#7033FF] hover:bg-[#6025e6] text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      + Add Product Card
                    </button>
                    <div className="text-center py-10 bg-gray-50 rounded-2xl p-6 text-xs text-gray-500">
                      Product cards allow visitors to purchase directly via your out-links (Stripe, PayPal, UPI).
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
        )}

        {/* Mobile Floating Bottom Dock matching Reference Screenshot */}
        {!activeCardDetail && (
          <div className="lg:hidden fixed bottom-3 inset-x-0 z-30 flex justify-center pointer-events-none px-4">
            <div className="h-12 px-4.5 bg-white/95 backdrop-blur-md rounded-full shadow-2xl border border-gray-200/90 flex items-center gap-5 sm:gap-6 pointer-events-auto shrink-0">
              {/* 1. Dashboard */}
              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                className={`flex flex-col items-center gap-0.5 cursor-pointer group transition-colors ${
                  currentView === 'dashboard'
                    ? 'text-black font-extrabold'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                <LayoutGrid className="w-4 h-4 stroke-[2]" />
                <span className="text-[9px] font-bold">Dashboard</span>
              </button>

              {/* 2. Content */}
              <button
                type="button"
                onClick={() => {
                  setCurrentView('workspace');
                  setActiveRail('content');
                  setActiveTab('links');
                }}
                className={`flex flex-col items-center gap-0.5 cursor-pointer group transition-colors ${
                  currentView === 'workspace' && activeRail === 'content'
                    ? 'text-black font-extrabold'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                <svg className="w-4 h-4 stroke-[2.2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="7" y="3" width="13" height="13" rx="2" />
                  <path d="M4 8v11a2 2 0 0 0 2 2h11" />
                </svg>
                <span className="text-[9px] font-bold">Content</span>
              </button>

              {/* 3. Header */}
              <button
                type="button"
                onClick={() => {
                  setCurrentView('workspace');
                  setActiveRail('header');
                }}
                className={`flex flex-col items-center gap-0.5 cursor-pointer group transition-colors ${
                  currentView === 'workspace' && activeRail === 'header'
                    ? 'text-black font-extrabold'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                <svg className="w-4 h-4 stroke-[2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="3" />
                  <circle cx="9" cy="10" r="2" />
                  <line x1="15" y1="9" x2="17" y2="9" />
                  <line x1="15" y1="13" x2="17" y2="13" />
                  <path d="M6 16c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5" />
                </svg>
                <span className="text-[9px] font-bold">Header</span>
              </button>

              {/* 4. Design */}
              <button
                type="button"
                onClick={() => {
                  setCurrentView('workspace');
                  setActiveRail('design');
                }}
                className={`flex flex-col items-center gap-0.5 cursor-pointer group transition-colors ${
                  currentView === 'workspace' && activeRail === 'design'
                    ? 'text-black font-extrabold'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                <Palette className="w-4 h-4 stroke-[2]" />
                <span className="text-[9px] font-bold">Design</span>
              </button>

              {/* 5. Settings */}
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode(currentUser ? 'switch' : 'login');
                  setIsAuthModalOpen(true);
                }}
                className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-black cursor-pointer group transition-colors"
              >
                <Settings className="w-4 h-4 stroke-[2]" />
                <span className="text-[9px] font-bold">Settings</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. Right Side: Centered Phone Preview Mockup matching Reference */}
        {(currentView === 'workspace' || previewPhoneView) && (
          <aside
            className={`flex-1 bg-[#FAFBFB] flex items-center justify-center shrink-0 relative ${
              previewPhoneView ? 'fixed inset-0 z-50 bg-black p-0 lg:p-6 lg:bg-black/60' : 'hidden lg:flex p-4 lg:p-6'
            }`}
          >
          {previewPhoneView && (
            <button
              onClick={() => setPreviewPhoneView(false)}
              className="absolute top-4 right-4 z-30 text-white p-2 rounded-full bg-black/60 backdrop-blur-md shadow-lg hover:bg-black transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}

          <div className="relative w-full h-full lg:w-auto lg:h-auto flex items-center justify-center">
            {/* Phone Screen Mockup Container matching iPhone 16 Pro Max Preview Size (440px * 956px) */}
            <div
              className="w-full h-full lg:w-[440px] lg:h-[956px] lg:max-h-[calc(100vh-60px)] aspect-[440/956] rounded-none lg:rounded-[55px] shadow-none lg:shadow-2xl relative border-0 lg:border-[8px] lg:border-[#1C1C1E] overflow-hidden select-none"
              style={{
                color: activeTheme?.textColor || '#111111',
                fontFamily:
                  activeTheme?.fontFamily && activeTheme.fontFamily !== 'Link Sans'
                    ? `'${activeTheme.fontFamily}', sans-serif`
                    : "'Inter', system-ui, -apple-system, sans-serif",
              }}
            >
              {/* Wallpaper Background Base + Effects + Tint + Noise */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div
                  className="w-full h-full absolute inset-0"
                  style={{
                    background:
                      activeTheme?.wallpaperStyle === 'video'
                        ? 'transparent'
                        : activeTheme?.backgroundType === 'solid' || activeTheme?.wallpaperStyle === 'fill'
                        ? (activeTheme?.backgroundValue?.startsWith('#') ? activeTheme.backgroundValue : (activeTheme?.backgroundColor || '#F3F3F1'))
                        : activeTheme?.backgroundImageUrl
                        ? `url("${activeTheme.backgroundImageUrl}") center / cover no-repeat`
                        : activeTheme?.backgroundValue || activeTheme?.backgroundColor || '#111111',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    filter:
                      activeTheme?.wallpaperStyle === 'blur'
                        ? `blur(${activeTheme?.blurAmount ?? 20}px)`
                        : activeTheme?.effect === 'mono'
                        ? 'grayscale(100%)'
                        : activeTheme?.effect === 'blur'
                        ? `blur(${activeTheme?.blurAmount ?? 10}px)`
                        : activeTheme?.effect === 'halftone'
                        ? 'contrast(200%) grayscale(100%)'
                        : 'none',
                    transform:
                      activeTheme?.wallpaperStyle === 'blur' || activeTheme?.effect === 'blur'
                        ? 'scale(1.12)'
                        : 'none',
                  }}
                />

                {activeTheme?.wallpaperStyle === 'video' &&
                  (activeTheme?.wallpaperVideoUrl || activeTheme?.backgroundImageUrl) && (
                    <video
                      src={activeTheme.wallpaperVideoUrl || activeTheme.backgroundImageUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover absolute inset-0"
                    />
                  )}

                {activeTheme?.wallpaperStyle === 'gradient' && (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(180deg, ${activeTheme?.backgroundColor || '#638873'} 0%, rgba(0,0,0,0.85) 100%)`,
                      mixBlendMode: activeTheme?.backgroundImageUrl ? 'multiply' : 'normal',
                    }}
                  />
                )}

                {activeTheme?.wallpaperStyle === 'pattern' && (
                  <div
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{
                      backgroundColor: activeTheme?.backgroundImageUrl
                        ? 'transparent'
                        : activeTheme?.backgroundColor || '#050F15',
                      backgroundImage: `url("${getPatternSvg(
                        activeTheme?.patternType || 'organic',
                        activeTheme?.backgroundImageUrl
                          ? (activeTheme?.backgroundColor || '#050F15')
                          : getContrastingPatternColor(activeTheme?.backgroundColor || '#050F15'),
                        activeTheme?.backgroundImageUrl ? 0.45 : 0.3
                      )}")`,
                      backgroundRepeat: 'repeat',
                      mixBlendMode: activeTheme?.backgroundImageUrl ? 'multiply' : 'normal',
                    }}
                  />
                )}

                {typeof activeTheme?.tint === 'number' && activeTheme.tint !== 0 && (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor:
                        activeTheme.tint < 0
                          ? `rgba(0, 0, 0, ${(Math.abs(activeTheme.tint) / 100) * 0.75})`
                          : `rgba(255, 255, 255, ${(activeTheme.tint / 100) * 0.75})`,
                    }}
                  />
                )}

                {activeTheme?.noise && (
                  <div
                    className="absolute inset-0 opacity-25 mix-blend-overlay"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.6'/%3E%3C/svg%3E")`,
                    }}
                  />
                )}
              </div>

              {/* Scrollable Content Container Over Sticky Wallpaper */}
              <div data-lenis-prevent className="absolute inset-0 z-10 overflow-y-auto px-4 sm:px-5 pb-8 flex flex-col justify-between text-center no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pt-5 sm:pt-6">
                <div className="flex flex-col justify-between flex-1 min-h-full w-full max-w-[440px] mx-auto">
                  {/* Top iOS Icons */}
                  <div className="w-full flex items-center justify-between text-xs mb-4 z-10 px-1 pt-1" style={{ color: activeTheme?.textColor || '#FFFFFF' }}>
                    <span className="font-black text-base text-white select-none">✱</span>
                    <button
                      type="button"
                      onClick={handleCopyLiveUrl}
                      className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all cursor-pointer flex items-center justify-center shadow-2xs"
                      title="Copy live card link"
                    >
                      {copiedUrl ? (
                        <Check className="w-4 h-4 text-green-400 stroke-[3]" />
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                          <polyline points="16 6 12 2 8 6" />
                          <line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Profile Header */}
                  {renderPhoneHeader()}

                  {/* Cards Stack using CardRenderer */}
                  <div className="w-full space-y-3.5 flex-1 mt-4 mb-8">
                    {currentTree?.cards &&
                      currentTree.cards
                        .filter((c) => c.visible !== false)
                        .map((card) => (
                          <CardRenderer key={card.id} card={card} theme={activeTheme} isPreview />
                        ))}
                  </div>

                  {/* Footer */}
                  {isFooterEnabled && (
                    <div className="mt-auto pt-4 pb-4 space-y-2.5 w-full shrink-0">
                      {activeTheme?.footerButton && (
                        <div className="w-full max-w-[210px] py-2 px-4 rounded-full bg-white text-black text-xs font-bold shadow-md mx-auto block border border-gray-100 text-center">
                          {activeTheme?.footerText || 'Get your own IndiaTaps'}
                        </div>
                      )}
                      <div className="text-[10px] text-gray-400 leading-tight">
                        Cookie Preferences · Report · Privacy
                        <div className="mt-0.5">More from IndiaTaps</div>
                      </div>
                    </div>
                  )}

                  <div className="w-full h-12 shrink-0 pointer-events-none" aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Floating Side Action Pill on Phone Frame matching Reference */}
            <div className="hidden lg:flex absolute -right-12 top-1/2 -translate-y-1/2 bg-white rounded-full p-2.5 shadow-md border border-gray-200/90 flex-col gap-3 text-gray-600 z-30">
              <Link2 className="w-4 h-4 hover:text-black cursor-pointer transition-colors" />
              <ExternalLink className="w-4 h-4 hover:text-black cursor-pointer transition-colors" />
            </div>
          </div>
        </aside>
        )}
      </div>

      {/* Delete / Archive Confirmation Modal */}
      {cardPendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[28px] shadow-2xl border border-gray-100 max-w-sm w-full p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-extrabold text-base text-[#111111]">
                {cardPendingDelete.isBulk
                  ? `Delete ${cardPendingDelete.title}?`
                  : 'Delete this link?'}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed px-2">
                {cardPendingDelete.isBulk ? (
                  <>
                    Are you sure you want to delete{' '}
                    <span className="font-bold text-black">
                      {cardPendingDelete.count} {cardPendingDelete.title}
                    </span>
                    ? You can undo this for 15 seconds.
                  </>
                ) : (
                  <>
                    Are you sure you want to delete{' '}
                    <span className="font-bold text-black">
                      "{cardPendingDelete.title}"
                    </span>
                    ? You can undo this for 15 seconds.
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCardPendingDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-full border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const cards = cardPendingDelete.cards;
                  setCardPendingDelete(null);
                  executeDeleteCards(cards);
                }}
                className="flex-1 py-2.5 px-4 rounded-full bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-colors shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Toast with live 15s timer */}
      {undoToast && lastDeletedCards && lastDeletedCards.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-3 right-3 sm:bottom-6 sm:left-24 sm:right-auto z-50 bg-[#111111] text-white pl-4 pr-2.5 py-2.5 rounded-full shadow-2xl border border-white/10 flex items-center gap-3 text-xs animate-in slide-in-from-bottom-5"
        >
          <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-3 h-3" />
          </div>
          <span className="truncate max-w-[40vw] sm:max-w-[200px] text-gray-200 font-medium">
            {lastDeletedCards.length === 1
              ? `"${lastDeletedCards[0].title}" deleted`
              : `${lastDeletedCards.length} links deleted`}
          </span>
          <button
            onClick={handleUndoDelete}
            className="ml-1 px-3.5 py-1 rounded-full bg-white hover:bg-gray-100 text-black font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo ({undoSecondsLeft}s)</span>
          </button>
        </div>
      )}

      {/* Tree Delete Confirmation Modal */}
      {treePendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[28px] shadow-2xl border border-gray-100 max-w-sm w-full p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-extrabold text-base text-[#111111]">
                Delete @{treePendingDelete.slug}?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed px-2">
                Are you sure you want to delete <span className="font-bold text-black">"@{treePendingDelete.slug}"</span> and all its links? You can undo this for 15 seconds.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTreePendingDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-full border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = treePendingDelete;
                  setTreePendingDelete(null);
                  confirmDeleteTree(target);
                }}
                className="flex-1 py-2.5 px-4 rounded-full bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-colors shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tree Undo Toast with live 15s timer */}
      {treeUndoToast && lastDeletedTreeData && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-3 right-3 sm:bottom-6 sm:left-24 sm:right-auto z-50 bg-[#111111] text-white pl-4 pr-2.5 py-2.5 rounded-full shadow-2xl border border-white/10 flex items-center gap-3 text-xs animate-in slide-in-from-bottom-5"
        >
          <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-3 h-3" />
          </div>
          <span className="truncate max-w-[40vw] sm:max-w-[200px] text-gray-200 font-medium">
            "@{lastDeletedTreeData.tree.slug}" deleted
          </span>
          <button
            onClick={handleUndoDeleteTree}
            className="ml-1 px-3.5 py-1 rounded-full bg-white hover:bg-gray-100 text-black font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo ({treeUndoSecondsLeft}s)</span>
          </button>
        </div>
      )}

      {/* Add Card Modal */}
      <AddCardModal
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        onAddCard={handleAddCard}
      />

      {/* Card Settings Editor Modal */}
      <CardEditorModal
        card={editingCard}
        isOpen={!!editingCard}
        onClose={() => setEditingCard(null)}
        onSave={handleUpdateCard}
        onDelete={handleDeleteCard}
      />

      {/* Create Tree Modal */}
      <CreateTreeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUser={currentUser}
        adminEmail={currentUser?.email || 'sparshkoul6@gmail.com'}
        onTreeCreated={(newTree) => {
          const treeWithAdmin = {
            ...newTree,
            adminId: currentUser?.id || newTree.adminId || 1,
          };
          storage.saveTree(treeWithAdmin);
          storage.setActiveTreeId(treeWithAdmin.id);
          const allTrees = storage.getTrees();
          setTrees(allTrees.filter((t) => !currentUser?.id || t.adminId === currentUser?.id));
          loadTreeDetails(treeWithAdmin.id);
          setActiveTab('links');
        }}
      />

      {/* Login / Sign up / Account Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
        initialMode={authModalMode}
        treesCount={trees.length}
        onOpenCreateTree={() => setIsCreateModalOpen(true)}
      />

      {/* Help Topics / Support Email Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative space-y-5 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsHelpModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-black transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-xs">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-gray-950 tracking-tight">Need Help or Support?</h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                Have questions about your digital cards, customization, or account? Contact us directly:
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">
                Support & Admin Email
              </div>
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white border border-gray-200 shadow-2xs">
                <span className="font-mono font-bold text-sm text-gray-900 truncate">
                  india.taps7@gmail.com
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText('india.taps7@gmail.com');
                    setCopiedSupportEmail(true);
                    setTimeout(() => setCopiedSupportEmail(false), 2000);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    copiedSupportEmail
                      ? 'bg-emerald-600 text-white'
                      : 'bg-black text-white hover:bg-neutral-800'
                  }`}
                >
                  {copiedSupportEmail ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-2.5">
              <a
                href="mailto:india.taps7@gmail.com?subject=IndiaTaps%20Help%20%26%20Support"
                className="flex-1 py-3 px-4 rounded-full bg-[#1E2330] hover:bg-black text-white font-bold text-xs sm:text-sm transition-all shadow-sm text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Open in Email App</span>
              </a>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="px-5 py-3 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
