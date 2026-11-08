import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

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
app.get('/api/auth/me', (req, res) => {
  if (!store.currentUserId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = store.users.find((u) => u.id === store.currentUserId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// Auth Login
app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
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
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser, message: 'Logged in successfully' });
});

// Auth Register / Signup
app.post('/api/auth/register', (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 alphanumeric characters' });
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

// Auth Logout
app.post('/api/auth/logout', (req, res) => {
  store.currentUserId = null;
  res.json({ success: true, message: 'Logged out successfully' });
});

// Admin Me
app.get('/api/admin/me', (req, res) => {
  const user = store.users.find((u) => u.id === store.currentUserId);
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
app.get('/api/admin/trees', (req, res) => {
  const currentId = store.currentUserId;
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
app.post('/api/admin/trees', (req, res) => {
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

  const newTree = {
    id: Date.now(),
    adminId: store.currentUserId || store.admin.id,
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
app.get('/api/admin/trees/:id', (req, res) => {
  const treeId = parseInt(req.params.id, 10);
  const tree = store.trees.find((t) => t.id === treeId && !t.deletedAt);
  if (!tree) return res.status(404).json({ error: 'Tree not found' });

  const treeCards = store.cards.filter((c) => c.treeId === treeId);
  res.json({ ...tree, cards: treeCards });
});

// Update Tree
app.put('/api/admin/trees/:id', (req, res) => {
  const treeId = parseInt(req.params.id, 10);
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

// Add Card
app.post('/api/admin/trees/:id/cards', (req, res) => {
  const treeId = parseInt(req.params.id, 10);
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
app.put('/api/admin/cards/:id', (req, res) => {
  const cardId = parseInt(req.params.id, 10);
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
app.delete('/api/admin/cards/:id', (req, res) => {
  const cardId = parseInt(req.params.id, 10);
  const cardIndex = store.cards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return res.status(404).json({ error: 'Card not found' });

  store.cards.splice(cardIndex, 1);
  res.json({ success: true, id: cardId });
});

// Public Tree Page
app.get('/api/public/trees/:slug', (req, res) => {
  const slug = req.params.slug.toLowerCase();
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

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

