import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { db } from './db/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());

// Multi-device session & authentication middleware
app.use((req, res, next) => {
  const headerId = req.headers['x-user-id'];
  const cookieId = req.cookies?.userId || req.cookies?.token;
  if (headerId && !isNaN(parseInt(headerId, 10))) {
    req.userId = parseInt(headerId, 10);
  } else if (cookieId && !isNaN(parseInt(cookieId, 10))) {
    req.userId = parseInt(cookieId, 10);
  } else {
    req.userId = store.currentUserId || 1;
  }
  next();
});

// Store (PostgreSQL / In-memory adapter)
const store = {
  admin: {
    id: 1,
    email: 'sparshkoul6@gmail.com',
    twoFactorEnabled: false,
  },
  users: [
    {
      id: 1,
      email: 'sparshkoul6@gmail.com',
      username: 'riyast',
      password: 'password123',
    },
    {
      id: 2,
      email: 'alex@example.com',
      username: 'alex',
      password: 'password123',
    },
  ],
  currentUserId: 1,
  trees: [
    {
      id: 1,
      adminId: 1,
      name: 'Riyast Boutique',
      slug: 'riyast',
      status: 'live',
      title: 'riyast',
      bio: '',
      avatarUrl: null,
      themeId: 'classic-light',
      customTheme: {
        name: 'Classic Clean',
        backgroundType: 'solid',
        backgroundValue: '#F3F3F1',
        buttonStyle: 'fill',
        buttonColor: '#FFFFFF',
        buttonTextColor: '#111111',
        buttonRadius: 9999,
        fontFamily: 'Inter',
        textColor: '#111111',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      adminId: 1,
      name: 'Helolo',
      slug: 'helolo',
      status: 'live',
      title: 'helolo',
      bio: '',
      avatarUrl: null,
      themeId: 'classic-light',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      adminId: 1,
      name: 'Riyast Studio',
      slug: 'riyastttttt',
      status: 'live',
      title: 'riyastttttt',
      bio: '',
      avatarUrl: null,
      themeId: 'classic-light',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 4,
      adminId: 2,
      name: 'Alex Designs',
      slug: 'alex',
      status: 'live',
      title: 'alex',
      bio: 'Digital Creator',
      avatarUrl: null,
      themeId: 'classic-light',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  cards: [],
  events: [],
};

const RESERVED_SLUGS = ['admin', 'api', 'login', 'dashboard', 'settings', 'static', 'auth'];

// Auth Me
app.get('/api/auth/me', async (req, res) => {
  const userId = req.userId || store.currentUserId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  let user = await db.getUserById(userId);
  if (!user) {
    user = store.users.find((u) => u.id === userId);
  }
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// Auth Login
app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  const setAuthCookies = (u) => {
    res.cookie('userId', String(u.id), {
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
    res.cookie('token', String(u.id), {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
  };

  try {
    const user = await db.signInUser({ identifier, password });
    if (user) {
      store.currentUserId = user.id;
      setAuthCookies(user);
      const { password: _, ...safeUser } = user;
      return res.json({ user: safeUser, message: 'Logged in successfully via Supabase' });
    }
  } catch (err) {
    if (err.message && !err.message.includes('fetch failed')) {
      return res.status(401).json({ error: err.message || 'Invalid username/email or password' });
    }
  }

  const clean = identifier.toLowerCase().trim();
  const user = store.users.find(
    (u) =>
      (u.email.toLowerCase() === clean || u.username.toLowerCase() === clean) &&
      u.password === password
  );
  if (!user) {
    return res.status(401).json({ error: 'Invalid username/email or password' });
  }
  store.currentUserId = user.id;
  setAuthCookies(user);
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser, message: 'Logged in successfully' });
});

// Auth Register / Signup
app.post('/api/auth/register', async (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 alphanumeric characters' });
  }

  const setAuthCookies = (u) => {
    res.cookie('userId', String(u.id), {
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
    res.cookie('token', String(u.id), {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
  };

  try {
    const user = await db.signUpUser({ email, username: cleanUsername, password });
    if (user) {
      store.currentUserId = user.id;
      setAuthCookies(user);
      const { password: _, ...safeUser } = user;
      return res.status(201).json({ user: safeUser, message: 'Account verified & created in Supabase' });
    }
  } catch (err) {
    if (err.message && (err.message.includes('already registered') || err.message.includes('duplicate key'))) {
      return res.status(409).json({ error: 'Username or email already in use' });
    }
  }

  const existing = store.users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase().trim() ||
      u.username.toLowerCase() === cleanUsername
  );
  if (existing) {
    return res.status(409).json({ error: 'Username or email already in use' });
  }

  const newId = Date.now();
  const newUser = {
    id: newId,
    email: email.trim(),
    username: cleanUsername,
    password,
  };
  store.users.push(newUser);
  store.currentUserId = newId;
  setAuthCookies(newUser);

  // Automatically create their primary tree
  const newTreeId = newId + 1;
  const newTree = {
    id: newTreeId,
    adminId: newId,
    name: cleanUsername,
    slug: cleanUsername,
    status: 'live',
    title: cleanUsername,
    bio: '',
    avatarUrl: null,
    themeId: 'classic-light',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.trees.push(newTree);

  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser, message: 'Account created successfully' });
});

// Google OAuth Authorization URL
app.get('/api/auth/google', (req, res) => {
  const redirectTo = req.query.redirect_to || 'http://localhost:5173';
  const supabaseUrl = process.env.SUPABASE_URL || 'https://qbnrhcllnuwdeivpxxoj.supabase.co';
  const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
  res.json({ url: authUrl });
});

// OAuth Callback / Session Sync
app.post('/api/auth/oauth-callback', async (req, res) => {
  const { email, username } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  const user = await db.syncOAuthUser({ email, username });
  if (user) {
    store.currentUserId = user.id;
    res.cookie('userId', String(user.id), { sameSite: 'lax', maxAge: 365 * 24 * 60 * 60 * 1000 });
    res.cookie('token', String(user.id), { httpOnly: true, sameSite: 'lax', maxAge: 365 * 24 * 60 * 60 * 1000 });
    const { password: _, ...safeUser } = user;
    return res.json({ user: safeUser, message: 'OAuth account synced' });
  }
  res.status(500).json({ error: 'Failed to sync OAuth account' });
});

// Auth Logout
app.post('/api/auth/logout', (req, res) => {
  store.currentUserId = null;
  res.clearCookie('userId');
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Admin Me
app.get('/api/admin/me', async (req, res) => {
  const userId = req.userId || store.currentUserId;
  let user = await db.getUserById(userId);
  if (!user) {
    user = store.users.find((u) => u.id === userId);
  }
  res.json(user || store.admin);
});

// Check Slug Availability
app.get('/api/admin/trees/check-slug/:slug', (req, res) => {
  const slug = req.params.slug.toLowerCase().trim();
  if (RESERVED_SLUGS.includes(slug)) {
    return res.json({ available: false, reason: 'Reserved keyword' });
  }
  if (!/^[a-z0-9-]+$/.test(slug) || slug.length < 3 || slug.length > 30) {
    return res.json({ available: false, reason: 'Invalid format (3-30 chars, alphanumeric or hyphen)' });
  }
  const exists = store.trees.some((t) => t.slug === slug && !t.deletedAt);
  res.json({ available: !exists });
});

// List Trees (filtered by current logged in user)
app.get('/api/admin/trees', async (req, res) => {
  const currentId = req.userId || store.currentUserId;
  const dbTrees = await db.getTrees(currentId);
  if (dbTrees !== null) {
    return res.json(dbTrees);
  }

  const activeTrees = store.trees
    .filter((t) => !t.deletedAt && (!currentId || t.adminId === currentId))
    .map((t) => {
      const treeCards = store.cards.filter((c) => c.treeId === t.id);
      return {
        ...t,
        cardCount: treeCards.length,
      };
    });
  res.json(activeTrees);
});

// Create Tree
app.post('/api/admin/trees', async (req, res) => {
  const { name, slug, title } = req.body;
  if (!slug || slug.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }

  const cleanSlug = slug.toLowerCase().trim();
  if (RESERVED_SLUGS.includes(cleanSlug)) {
    return res.status(400).json({ error: 'This username is reserved' });
  }

  const existing = store.trees.find((t) => t.slug === cleanSlug && !t.deletedAt);
  if (existing) {
    return res.status(409).json({ error: 'This username is already taken' });
  }

  const adminId = store.currentUserId || store.admin.id;
  const createdDbTree = await db.createTree({
    adminId,
    name: name || cleanSlug,
    slug: cleanSlug,
    title: title || cleanSlug,
  });
  if (createdDbTree) {
    return res.status(201).json(createdDbTree);
  }

  const newTree = {
    id: Date.now(),
    adminId,
    name: name || cleanSlug,
    slug: cleanSlug,
    status: 'live',
    title: title || cleanSlug,
    bio: '',
    avatarUrl: null,
    themeId: 'classic-light',
    customTheme: {
      name: 'Classic Clean',
      backgroundType: 'solid',
      backgroundValue: '#F3F3F1',
      buttonStyle: 'fill',
      buttonColor: '#FFFFFF',
      buttonTextColor: '#111111',
      buttonRadius: 9999,
      fontFamily: 'Inter',
      textColor: '#111111',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.trees.push(newTree);
  res.status(201).json(newTree);
});

// Get Tree Details with Cards
app.get('/api/admin/trees/:id', async (req, res) => {
  const treeId = parseInt(req.params.id, 10);
  const dbTree = await db.getTreeById(treeId);
  if (dbTree) {
    return res.json(dbTree);
  }

  const tree = store.trees.find((t) => t.id === treeId && !t.deletedAt);
  if (!tree) return res.status(404).json({ error: 'Tree not found' });

  const treeCards = store.cards.filter((c) => c.treeId === treeId);
  res.json({ ...tree, cards: treeCards });
});

// Update Tree
app.put('/api/admin/trees/:id', async (req, res) => {
  const treeId = parseInt(req.params.id, 10);
  const updatedDb = await db.updateTree(treeId, req.body);
  if (updatedDb) {
    return res.json(updatedDb);
  }

  const treeIndex = store.trees.findIndex((t) => t.id === treeId && !t.deletedAt);
  if (treeIndex === -1) return res.status(404).json({ error: 'Tree not found' });

  const updatedTree = {
    ...store.trees[treeIndex],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  store.trees[treeIndex] = updatedTree;
  res.json(updatedTree);
});

// Delete Tree
app.delete('/api/admin/trees/:id', async (req, res) => {
  const treeId = parseInt(req.params.id, 10);
  await db.deleteTree(treeId);

  const treeIndex = store.trees.findIndex((t) => t.id === treeId);
  if (treeIndex !== -1) {
    store.trees[treeIndex].deletedAt = new Date().toISOString();
  }
  res.json({ success: true, id: treeId });
});

// Add Card
app.post('/api/admin/trees/:id/cards', async (req, res) => {
  const treeId = parseInt(req.params.id, 10);
  const createdCard = await db.createCard({
    treeId,
    type: req.body.type || 'link',
    title: req.body.title || 'New Link',
    url: req.body.url || 'https://',
    thumbnailUrl: req.body.thumbnailUrl || null,
    position: req.body.position || 0,
    settings: req.body.settings || {},
  });
  if (createdCard) {
    return res.status(201).json(createdCard);
  }

  const tree = store.trees.find((t) => t.id === treeId && !t.deletedAt);
  if (!tree) return res.status(404).json({ error: 'Tree not found' });

  const currentCards = store.cards.filter((c) => c.treeId === treeId);
  const newCard = {
    id: Date.now(),
    treeId,
    type: req.body.type || 'link',
    title: req.body.title || 'New Link',
    url: req.body.url || 'https://',
    thumbnailUrl: req.body.thumbnailUrl || null,
    position: currentCards.length,
    visible: true,
    animation: req.body.animation || 'none',
    settings: req.body.settings || {},
    createdAt: new Date().toISOString(),
  };

  store.cards.push(newCard);
  res.status(201).json(newCard);
});

// Update Card
app.put('/api/admin/cards/:id', async (req, res) => {
  const cardId = parseInt(req.params.id, 10);
  const updatedDb = await db.updateCard(cardId, req.body);
  if (updatedDb) {
    return res.json(updatedDb);
  }

  const cardIndex = store.cards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return res.status(404).json({ error: 'Card not found' });

  store.cards[cardIndex] = {
    ...store.cards[cardIndex],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  res.json(store.cards[cardIndex]);
});

// Delete Card
app.delete('/api/admin/cards/:id', async (req, res) => {
  const cardId = parseInt(req.params.id, 10);
  await db.deleteCard(cardId);

  const cardIndex = store.cards.findIndex((c) => c.id === cardId);
  if (cardIndex !== -1) {
    store.cards.splice(cardIndex, 1);
  }
  res.json({ success: true, id: cardId });
});

// Public Tree Page
app.get('/api/public/trees/:slug', async (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const dbTree = await db.getTreeBySlug(slug);
  if (dbTree) {
    db.recordAnalyticsEvent({
      treeId: dbTree.id,
      eventType: 'page_view',
      referrer: req.headers['referer'] || req.headers['referrer'],
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.socket?.remoteAddress,
    });

    const publicCards = (dbTree.cards || [])
      .filter((c) => c.visible)
      .sort((a, b) => a.position - b.position);
    return res.json({
      tree: dbTree,
      cards: publicCards,
    });
  }

  const tree = store.trees.find((t) => t.slug === slug && !t.deletedAt && t.status === 'live');
  if (!tree) return res.status(404).json({ error: 'Tree not found or unpublished' });

  const publicCards = store.cards
    .filter((c) => c.treeId === tree.id && c.visible)
    .sort((a, b) => a.position - b.position);

  res.json({
    tree,
    cards: publicCards,
  });
});

// Public Click Tracker
app.post('/api/public/cards/:id/click', async (req, res) => {
  const cardId = parseInt(req.params.id, 10);
  await db.incrementCardClicks(cardId);

  const localCard = store.cards.find((c) => c.id === cardId);
  if (localCard) {
    localCard.clicks = (localCard.clicks || 0) + 1;
  }

  db.recordAnalyticsEvent({
    treeId: localCard?.treeId,
    cardId,
    eventType: 'card_click',
    referrer: req.headers['referer'] || req.headers['referrer'],
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.socket?.remoteAddress,
  });

  res.json({ success: true, id: cardId });
});

// Upload Asset (Image / PDF) to Supabase Storage CDN
app.post('/api/admin/upload', async (req, res) => {
  const { file, filename, folder, treeId } = req.body;
  if (!file) {
    return res.status(400).json({ error: 'File data is required' });
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
  const treeId = req.query.treeId ? parseInt(req.query.treeId, 10) : undefined;
  const folder = req.query.folder ? String(req.query.folder) : undefined;
  const assets = await db.getAssets({ treeId, adminId: req.userId, folder });
  res.json(assets);
});

// Delete Asset from Storage
app.delete('/api/admin/assets', async (req, res) => {
  const { filePath, publicUrl } = req.body;
  const success = await db.deleteAsset({ filePath, publicUrl });
  res.json({ success });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

