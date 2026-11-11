import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { db } from './db/db.js';
import { supabase } from './db/supabase.js';
import { hashPassword, hashPasswordSync, verifyPassword } from './utils/password.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// HTTP Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Lightweight sliding-window Rate Limiter (Zero external dependencies)
function createRateLimiter({ windowMs, maxRequests, message }) {
  const ipHits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipHits.entries()) {
      if (now - record.startTime > windowMs) {
        ipHits.delete(ip);
      }
    }
  }, Math.max(30000, Math.floor(windowMs / 2))).unref();

  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test') return next(); // Skip throttling in automated tests

    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown';
    const now = Date.now();
    let record = ipHits.get(ip);

    if (!record || now - record.startTime > windowMs) {
      record = { count: 1, startTime: now };
      ipHits.set(ip, record);
      return next();
    }

    record.count += 1;
    if (record.count > maxRequests) {
      const retryAfterSec = Math.ceil((windowMs - (now - record.startTime)) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: message || 'Too many requests. Please slow down and try again later.',
        retryAfter: retryAfterSec,
      });
    }

    next();
  };
}

// 1. Auth Rate Limiter: Max 10 attempts per 15 minutes per IP
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

// 2. Tracking / Analytics Rate Limiter: Max 40 calls per minute per IP
const trackRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 40,
  message: 'Analytics tracking rate limit exceeded.',
});

// Multi-device session & authentication middleware
app.use((req, res, next) => {
  const headerId = req.headers['x-user-id'];
  const cookieId = req.cookies?.userId || req.cookies?.token;
  if (headerId && !isNaN(parseInt(headerId, 10))) {
    req.userId = parseInt(headerId, 10);
  } else if (cookieId && !isNaN(parseInt(cookieId, 10))) {
    req.userId = parseInt(cookieId, 10);
  } else {
    // Unauthenticated callers get null userId (no auto-impersonating user 1)
    req.userId = null;
  }
  next();
});

// Store (PostgreSQL / In-memory adapter)
const store = {
  admin: {
    id: 1,
    email: 'sparshkoul6@gmail.com',
    username: 'riyast',
    role: 'super_admin',
    accountType: 'super_admin',
    isSuperAdmin: true,
  },
  users: [
    {
      id: 1,
      email: 'sparshkoul6@gmail.com',
      username: 'riyast',
      password: process.env.ADMIN_INITIAL_PASSWORD ? hashPasswordSync(process.env.ADMIN_INITIAL_PASSWORD) : '$2b$10$bsVZgzpWVq6a4VvV3M9oEeK95z74Wk9f9tJzF3hV9FwD2k3e0u8kO',
      role: 'super_admin',
      accountType: 'super_admin',
      isSuperAdmin: true,
    },
    {
      id: 2,
      email: 'alex@example.com',
      username: 'alex',
      password: '$2b$10$Dxrq0siMABq.4cQV3eoMAetTrnPjjPbmOzvyHOaw7t105LXZfpYom',
      role: 'client',
      accountType: 'client',
      isSuperAdmin: false,
    },
  ],
  currentUserId: null,
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

// Ownership & Slug Verification Helpers
async function resolveTreeOwner(treeId) {
  const memTree = store.trees.find((t) => t.id === treeId && !t.deletedAt);
  if (memTree && memTree.adminId) return memTree.adminId;
  const dbOwner = await db.getTreeOwner(treeId);
  if (dbOwner !== null) return dbOwner;
  return null;
}

async function resolveCardOwner(cardId) {
  const dbOwner = await db.getCardOwner(cardId);
  if (dbOwner !== null) return dbOwner;
  const memCard = store.cards.find((c) => c.id === cardId);
  if (!memCard) return null;
  const memTree = store.trees.find((t) => t.id === memCard.treeId && !t.deletedAt);
  return memTree ? memTree.adminId : null;
}

async function isSlugAvailableGlobally(slug, excludeTreeId = null) {
  const cleanSlug = slug.toLowerCase().trim();
  if (RESERVED_SLUGS.includes(cleanSlug)) return false;
  if (!/^[a-z0-9-]+$/.test(cleanSlug) || cleanSlug.length < 3 || cleanSlug.length > 30) return false;

  const takenInDb = await db.isSlugTaken(cleanSlug, excludeTreeId);
  if (takenInDb) return false;

  const takenInStore = store.trees.some(
    (t) => t.slug.toLowerCase() === cleanSlug && !t.deletedAt && (excludeTreeId ? t.id !== excludeTreeId : true)
  );
  return !takenInStore;
}

// Super Admin Permission Verifier
async function isCallerSuperAdmin(userId) {
  if (!userId) return false;
  const user = (await db.getUserById(userId)) || store.users.find((u) => u.id === userId);
  if (!user) return false;
  return user.email?.toLowerCase() === 'sparshkoul6@gmail.com' || user.role === 'super_admin' || user.accountType === 'super_admin';
}

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

// Auth Login (Email + Password only)
app.post('/api/auth/login', authRateLimiter, async (req, res) => {
  const { identifier, email, password } = req.body;
  const loginId = (email || identifier || '').trim().toLowerCase();
  if (!loginId || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
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
    const user = await db.signInUser({ identifier: loginId, password });
    if (user) {
      if (user.isBlocked || user.is_blocked || user.status === 'blocked' || user.account_state === 'locked' || user.accountState === 'locked' || user.tier === 'blocked') {
        return res.status(403).json({ error: 'Your account has been locked by the administrator. Contact india.taps7@gmail.com for assistance.' });
      }
      store.currentUserId = user.id;
      setAuthCookies(user);
      const { password: _, ...safeUser } = user;
      return res.json({ user: safeUser, message: 'Logged in successfully via Supabase' });
    }
  } catch (err) {
    if (err.message && !err.message.includes('fetch failed')) {
      return res.status(401).json({ error: err.message || 'Invalid email or password' });
    }
  }

  const candidateUsers = store.users.filter(
    (u) => u.email.toLowerCase() === loginId || u.username.toLowerCase() === loginId
  );
  let user = null;
  for (const cu of candidateUsers) {
    if (await verifyPassword(password, cu.password)) {
      user = cu;
      // Upgrade to bcrypt hash if legacy plain text
      if (!/^\$2[aby]\$\d+\$/.test(user.password)) {
        user.password = await hashPassword(password);
      }
      break;
    }
  }
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (user.isBlocked || user.is_blocked || user.status === 'blocked' || user.account_state === 'locked' || user.accountState === 'locked' || user.tier === 'blocked') {
    return res.status(403).json({ error: 'Your account has been locked by the administrator. Contact india.taps7@gmail.com for assistance.' });
  }
  store.currentUserId = user.id;
  setAuthCookies(user);
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser, message: 'Logged in successfully' });
});

// Auth Register / Signup (Super Admin ONLY - public self-registration is strictly disabled)
app.post('/api/auth/register', authRateLimiter, async (req, res) => {
  const callerId = req.userId;
  const isSuper = await isCallerSuperAdmin(callerId);
  if (!isSuper) {
    return res.status(403).json({
      error: 'Public registration is disabled. Accounts can only be provisioned by the Super Admin (sparshkoul6@gmail.com).',
    });
  }

  const { email, password, role, accountType } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const cleanEmail = email.toLowerCase().trim();
  const rawUsername = req.body.username || cleanEmail.split('@')[0] || `user_${Date.now()}`;
  const cleanUsername = rawUsername.toLowerCase().trim().replace(/[^a-z0-9-]/g, '') || `user_${Date.now()}`;

  try {
    const user = await db.signUpUser({ email: cleanEmail, username: cleanUsername, password });
    if (user) {
      const isSuperUser = user.email?.toLowerCase() === 'sparshkoul6@gmail.com';
      const safeUser = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: isSuperUser ? 'super_admin' : (role || user.role || 'client'),
        accountType: isSuperUser ? 'super_admin' : (accountType || user.account_type || 'client'),
        isSuperAdmin: isSuperUser,
      };
      return res.status(201).json({ user: safeUser, message: 'Account provisioned successfully by Super Admin' });
    }
  } catch (err) {
    if (err.message && (err.message.includes('already registered') || err.message.includes('duplicate key'))) {
      return res.status(409).json({ error: 'Email already in use' });
    }
  }

  const existing = store.users.find(
    (u) =>
      u.email.toLowerCase() === cleanEmail ||
      u.username.toLowerCase() === cleanUsername
  );
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  const newId = Date.now();
  const hashedPassword = await hashPassword(password);
  const newUser = {
    id: newId,
    email: cleanEmail,
    username: cleanUsername,
    password: hashedPassword,
    role: role || 'client',
    accountType: accountType || 'client',
    isSuperAdmin: false,
  };
  store.users.push(newUser);

  // Automatically create their primary card
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
  res.status(201).json({ user: safeUser, message: 'Account provisioned successfully by Super Admin' });
});

// Super Admin User Provisioning endpoint (Email + Password only)
app.post('/api/admin/users', async (req, res) => {
  const callerId = req.userId;
  const isSuper = await isCallerSuperAdmin(callerId);
  if (!isSuper) {
    return res.status(403).json({ error: 'Forbidden: Super Admin access required to create accounts.' });
  }

  const { email, password, role, accountType } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const rawUsername = req.body.username || cleanEmail.split('@')[0] || `user_${Date.now()}`;
  const cleanUsername = rawUsername.toLowerCase().trim().replace(/[^a-z0-9-]/g, '') || `user_${Date.now()}`;

  try {
    const user = await db.signUpUser({ email: cleanEmail, username: cleanUsername, password });
    if (user) {
      const isSuperUser = user.email?.toLowerCase() === 'sparshkoul6@gmail.com';
      const safe = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: isSuperUser ? 'super_admin' : (role || 'client'),
        accountType: isSuperUser ? 'super_admin' : (accountType || 'client'),
        isSuperAdmin: isSuperUser,
      };
      return res.status(201).json({ user: safe, success: true });
    }
  } catch (err) {
    return res.status(409).json({ error: err.message || 'User already exists' });
  }

  const newId = Date.now();
  const hashedPassword = await hashPassword(password);
  const newUser = {
    id: newId,
    email: cleanEmail,
    username: cleanUsername,
    password: hashedPassword,
    role: role || 'client',
    accountType: accountType || 'client',
    isSuperAdmin: false,
    accountState: 'active',
    account_state: 'active',
    isBlocked: false,
    createdAt: new Date().toISOString(),
  };
  store.users.push(newUser);

  // Automatically provision an initial tree for the new client
  const clientTree = {
    id: Date.now() + 1,
    adminId: newId,
    name: cleanUsername,
    slug: cleanUsername,
    status: 'live',
    title: cleanUsername,
    bio: 'Welcome to my digital card',
    avatarUrl: null,
    themeId: 'classic-light',
    customTheme: { name: 'Classic Clean' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.trees.push(clientTree);

  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser, tree: clientTree, success: true });
});

// Super Admin List Users with their trees and status
app.get('/api/admin/users', async (req, res) => {
  const callerId = req.userId;
  const isSuper = await isCallerSuperAdmin(callerId);
  if (!isSuper) {
    return res.status(403).json({ error: 'Forbidden: Super Admin access required' });
  }

  let dbUsers = null;
  try {
    let { data, error } = await supabase.from('users').select('id, email, username, role, tier, account_state, created_at');
    if (error && error.message?.includes('account_state')) {
      const fallback = await supabase.from('users').select('id, email, username, role, tier, created_at');
      data = fallback.data;
      error = fallback.error;
    }
    if (error) throw error;
    if (data) {
      dbUsers = data.map((u) => {
        const isS = u.email?.toLowerCase() === 'sparshkoul6@gmail.com' || u.role === 'super_admin';
        const accountState = u.account_state || (u.tier === 'blocked' ? 'locked' : 'active');
        return {
          id: u.id,
          email: u.email,
          username: u.username,
          role: isS ? 'super_admin' : (u.role || 'client'),
          accountType: isS ? 'super_admin' : (u.role || 'client'),
          isSuperAdmin: isS,
          accountState,
          account_state: accountState,
          isBlocked: accountState === 'locked' || u.tier === 'blocked' || u.role === 'blocked',
          createdAt: u.created_at,
        };
      });
    }
  } catch (err) {
    console.warn('[Admin List Users error]', err.message);
  }

  const baseUsers = dbUsers || store.users.map(({ password, ...u }) => {
    const accountState = u.account_state || u.accountState || (u.tier === 'blocked' || u.status === 'blocked' || u.isBlocked ? 'locked' : 'active');
    return {
      ...u,
      accountState,
      account_state: accountState,
      isBlocked: accountState === 'locked',
    };
  });

  // Attach digital cards / trees to each user
  let allTrees = [];
  try {
    const dbTrees = await db.getTrees();
    if (dbTrees && dbTrees.length) allTrees = dbTrees;
  } catch (err) {
    console.warn('[Admin List Trees error]', err.message);
  }
  if (!allTrees.length) {
    allTrees = store.trees;
  }

  const enrichedUsers = baseUsers.map((u) => {
    const userTrees = allTrees.filter(
      (t) => (t.adminId ?? t.admin_id) === u.id || (t.slug && u.username && t.slug.toLowerCase() === u.username.toLowerCase())
    );
    return {
      ...u,
      treesCount: userTrees.length,
      trees: userTrees.map((t) => ({
        id: t.id,
        name: t.name || t.title || t.slug,
        slug: t.slug,
        status: t.status || 'live',
        cardCount: t.cardCount || 0,
      })),
    };
  });

  res.json(enrichedUsers);
});

// Super Admin Block / Lock Client Account
app.patch('/api/admin/users/:id/block', async (req, res) => {
  const callerId = req.userId;
  const isSuper = await isCallerSuperAdmin(callerId);
  if (!isSuper) {
    return res.status(403).json({ error: 'Forbidden: Super Admin access required' });
  }

  const targetId = Number(req.params.id);
  const user = store.users.find((u) => u.id === targetId);
  if (user && (user.email?.toLowerCase() === 'sparshkoul6@gmail.com' || user.isSuperAdmin)) {
    return res.status(400).json({ error: 'Cannot block or lock the Super Admin account' });
  }

  const isBlocked = req.body.isBlocked !== undefined ? Boolean(req.body.isBlocked) : true;
  const nextAccountState = isBlocked ? 'locked' : 'active';

  if (user) {
    user.isBlocked = isBlocked;
    user.accountState = nextAccountState;
    user.account_state = nextAccountState;
    user.status = isBlocked ? 'blocked' : 'active';
  }

  try {
    const { error } = await supabase.from('users').update({
      account_state: nextAccountState,
      tier: isBlocked ? 'blocked' : 'free',
    }).eq('id', targetId);

    if (error && error.message?.includes('account_state')) {
      await supabase.from('users').update({ tier: isBlocked ? 'blocked' : 'free' }).eq('id', targetId);
    }
  } catch (err) {
    console.warn('[Supabase block error]', err.message);
  }

  res.json({
    success: true,
    userId: targetId,
    account_state: nextAccountState,
    accountState: nextAccountState,
    isBlocked,
    message: isBlocked ? 'Client account has been locked' : 'Client account has been unlocked',
  });
});

// Super Admin Update / Reset User Password
app.patch('/api/admin/users/:id/password', authRateLimiter, async (req, res) => {
  const callerId = req.userId;
  const isSuper = await isCallerSuperAdmin(callerId);
  if (!isSuper) {
    return res.status(403).json({ error: 'Forbidden: Super Admin access required' });
  }

  const targetId = Number(req.params.id);
  const { newPassword } = req.body;
  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const cleanPassword = newPassword.trim();
  const hashedPassword = await hashPassword(cleanPassword);
  let targetEmail = null;

  // 1. Update in memory store if present
  const memoryUser = store.users.find((u) => u.id === targetId);
  if (memoryUser) {
    memoryUser.password = hashedPassword;
    targetEmail = memoryUser.email;
  }

  // 2. Fetch user from Supabase if targetEmail is not known yet
  try {
    const { data: dbUser } = await supabase.from('users').select('id, email').eq('id', targetId).single();
    if (dbUser && dbUser.email) {
      targetEmail = dbUser.email;
    }
  } catch (err) {
    console.warn('[Supabase fetch user error]', err.message);
  }

  // 3. Update in Supabase public.users table
  try {
    await supabase.from('users').update({ password: hashedPassword }).eq('id', targetId);
  } catch (err) {
    console.warn('[Supabase update password in table error]', err.message);
  }

  // 4. Update in Supabase Auth if auth user exists
  if (targetEmail) {
    try {
      const { data: listData } = await supabase.auth.admin.listUsers();
      const authUser = listData?.users?.find(
        (au) => au.email?.toLowerCase() === targetEmail.toLowerCase()
      );
      if (authUser) {
        await supabase.auth.admin.updateUserById(authUser.id, { password: cleanPassword });
      }
    } catch (err) {
      console.warn('[Supabase admin updateUserById error]', err.message);
    }
  }

  res.json({
    success: true,
    userId: targetId,
    message: `Password updated successfully for account ${targetEmail || targetId}`,
  });
});

// Super Admin Delete Client Account
app.delete('/api/admin/users/:id', async (req, res) => {
  const callerId = req.userId;
  const isSuper = await isCallerSuperAdmin(callerId);
  if (!isSuper) {
    return res.status(403).json({ error: 'Forbidden: Super Admin access required' });
  }

  const targetId = Number(req.params.id);
  const user = store.users.find((u) => u.id === targetId);
  if (user && (user.email?.toLowerCase() === 'sparshkoul6@gmail.com' || user.isSuperAdmin)) {
    return res.status(400).json({ error: 'Cannot delete the Super Admin account' });
  }

  const userIdx = store.users.findIndex((u) => u.id === targetId);
  if (userIdx !== -1) {
    store.users.splice(userIdx, 1);
  }
  store.trees = store.trees.filter((t) => t.adminId !== targetId);

  try {
    await supabase.from('users').delete().eq('id', targetId);
  } catch {}

  res.json({ success: true, message: 'Client account deleted successfully' });
});

// Google OAuth & Social Logins (Completely Disabled per security policy)
app.get('/api/auth/google', (req, res) => {
  res.status(403).json({
    error: 'Google OAuth and social logins are disabled. Please sign in using your email and password.',
  });
});

// OAuth Callback (Disabled)
app.post('/api/auth/oauth-callback', (req, res) => {
  res.status(403).json({
    error: 'Social login is disabled.',
  });
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
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  let user = await db.getUserById(userId);
  if (!user) {
    user = store.users.find((u) => u.id === userId);
  }
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// Check Slug Availability globally
app.get('/api/admin/trees/check-slug/:slug', async (req, res) => {
  const slug = req.params.slug.toLowerCase().trim();
  const available = await isSlugAvailableGlobally(slug);
  res.json({
    available,
    reason: available ? undefined : 'Reserved keyword or already claimed by another card',
  });
});

// List Trees (filtered strictly by current authenticated user)
app.get('/api/admin/trees', async (req, res) => {
  const currentId = req.userId;
  if (!currentId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const dbTrees = await db.getTrees(currentId);
  if (dbTrees !== null) {
    return res.json(dbTrees);
  }

  const activeTrees = store.trees
    .filter((t) => !t.deletedAt && t.adminId === currentId)
    .map((t) => {
      const treeCards = store.cards.filter((c) => c.treeId === t.id);
      return {
        ...t,
        cardCount: treeCards.length,
      };
    });
  res.json(activeTrees);
});

// Create Tree (enforces global slug uniqueness and ownership)
app.post('/api/admin/trees', async (req, res) => {
  const currentId = req.userId;
  if (!currentId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { name, slug, title } = req.body;
  if (!slug || slug.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }

  const cleanSlug = slug.toLowerCase().trim();
  const available = await isSlugAvailableGlobally(cleanSlug);
  if (!available) {
    return res.status(409).json({ error: 'This URL slug is already taken or reserved across IndiaTaps' });
  }

  const adminId = currentId;
  const createdDbTree = await db.createTree({
    adminId,
    name: name || cleanSlug,
    slug: cleanSlug,
    title: title || cleanSlug,
  });
  if (createdDbTree) {
    store.trees.push(createdDbTree);
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

// Get Tree Details with Cards (requires ownership)
app.get('/api/admin/trees/:id', async (req, res) => {
  const currentId = req.userId;
  if (!currentId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const treeId = parseInt(req.params.id, 10);
  const ownerId = await resolveTreeOwner(treeId);
  if (ownerId === null) {
    return res.status(404).json({ error: 'Tree not found' });
  }
  if (ownerId !== currentId) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to view or edit this tree' });
  }

  const dbTree = await db.getTreeById(treeId);
  if (dbTree) {
    return res.json(dbTree);
  }

  const tree = store.trees.find((t) => t.id === treeId && !t.deletedAt);
  if (!tree) return res.status(404).json({ error: 'Tree not found' });

  const treeCards = store.cards.filter((c) => c.treeId === treeId);
  res.json({ ...tree, cards: treeCards });
});

// Update Tree (requires ownership & global slug uniqueness check)
app.put('/api/admin/trees/:id', async (req, res) => {
  const currentId = req.userId;
  if (!currentId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const treeId = parseInt(req.params.id, 10);
  const ownerId = await resolveTreeOwner(treeId);
  if (ownerId === null) {
    return res.status(404).json({ error: 'Tree not found' });
  }
  if (ownerId !== currentId) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to edit this tree' });
  }

  if (req.body.slug) {
    const cleanSlug = req.body.slug.toLowerCase().trim();
    const available = await isSlugAvailableGlobally(cleanSlug, treeId);
    if (!available) {
      return res.status(409).json({ error: 'This URL slug is already taken or invalid' });
    }
  }

  const updatedDb = await db.updateTree(treeId, req.body);
  if (updatedDb) {
    invalidatePublicTreeCache(updatedDb.slug || req.body?.slug);
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
  invalidatePublicTreeCache(updatedTree.slug);
  res.json(updatedTree);
});

// Delete Tree (requires ownership)
app.delete('/api/admin/trees/:id', async (req, res) => {
  const currentId = req.userId;
  if (!currentId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const treeId = parseInt(req.params.id, 10);
  const ownerId = await resolveTreeOwner(treeId);
  if (ownerId === null) {
    return res.status(404).json({ error: 'Tree not found' });
  }
  if (ownerId !== currentId) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this tree' });
  }

  await db.deleteTree(treeId);

  const treeIndex = store.trees.findIndex((t) => t.id === treeId);
  if (treeIndex !== -1) {
    store.trees[treeIndex].deletedAt = new Date().toISOString();
  }
  res.json({ success: true, id: treeId });
});

// Add Card (requires tree ownership)
app.post('/api/admin/trees/:id/cards', async (req, res) => {
  const currentId = req.userId;
  if (!currentId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const treeId = parseInt(req.params.id, 10);
  const ownerId = await resolveTreeOwner(treeId);
  if (ownerId === null) {
    return res.status(404).json({ error: 'Tree not found' });
  }
  if (ownerId !== currentId) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to add cards to this tree' });
  }

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
    store.cards.push(createdCard);
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

// Update Card (requires ownership of parent tree)
app.put('/api/admin/cards/:id', async (req, res) => {
  const currentId = req.userId;
  if (!currentId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const cardId = parseInt(req.params.id, 10);
  const ownerId = await resolveCardOwner(cardId);
  if (ownerId === null) {
    return res.status(404).json({ error: 'Card not found' });
  }
  if (ownerId !== currentId) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to edit this card' });
  }

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

// Delete Card (requires ownership of parent tree)
app.delete('/api/admin/cards/:id', async (req, res) => {
  const currentId = req.userId;
  if (!currentId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const cardId = parseInt(req.params.id, 10);
  const ownerId = await resolveCardOwner(cardId);
  if (ownerId === null) {
    return res.status(404).json({ error: 'Card not found' });
  }
  if (ownerId !== currentId) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this card' });
  }

  await db.deleteCard(cardId);

  const cardIndex = store.cards.findIndex((c) => c.id === cardId);
  if (cardIndex !== -1) {
    store.cards.splice(cardIndex, 1);
  }
  res.json({ success: true, id: cardId });
});

// Sync whole tree and cards state to database (requires ownership)
app.post('/api/admin/trees/:id/sync', async (req, res) => {
  const currentId = req.userId;
  if (!currentId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const treeId = parseInt(req.params.id, 10);
  const ownerId = await resolveTreeOwner(treeId);
  if (ownerId === null) {
    return res.status(404).json({ error: 'Tree not found' });
  }
  if (ownerId !== currentId) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this tree' });
  }

  const { treeUpdates, cards } = req.body;
  if (treeUpdates?.slug) {
    const cleanSlug = treeUpdates.slug.toLowerCase().trim();
    const available = await isSlugAvailableGlobally(cleanSlug, treeId);
    if (!available) {
      return res.status(409).json({ error: 'This URL slug is already taken or invalid' });
    }
  }

  let savedTree = null;
  if (treeUpdates) {
    savedTree = await db.updateTree(treeId, treeUpdates);
    const treeIdx = store.trees.findIndex((t) => t.id === treeId);
    if (treeIdx !== -1) {
      store.trees[treeIdx] = { ...store.trees[treeIdx], ...(savedTree || treeUpdates) };
    }
  }

  let savedCards = [];
  if (Array.isArray(cards)) {
    const synced = await db.syncTreeCards(treeId, cards);
    if (synced) {
      savedCards = synced;
      store.cards = store.cards.filter((c) => c.treeId !== treeId);
      store.cards.push(...synced);
    } else {
      store.cards = store.cards.filter((c) => c.treeId !== treeId);
      cards.forEach((c, idx) => {
        store.cards.push({ ...c, treeId, position: idx });
      });
      savedCards = store.cards.filter((c) => c.treeId === treeId);
    }
  }

  const finalTree = savedTree
    ? { ...savedTree, cards: savedCards }
    : (await db.getTreeById(treeId)) || store.trees.find((t) => t.id === treeId);
  invalidatePublicTreeCache(finalTree?.slug || treeUpdates?.slug);
  res.json({
    success: true,
    tree: finalTree,
    cards: savedCards,
    message: 'Tree and cards successfully saved to database',
  });
});

// High-performance User & Block State Cache
const userBlockedCache = new Map();
const USER_BLOCKED_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Check if tree owner account is blocked/locked
async function isTreeOwnerBlocked(adminId, slug = null) {
  const cacheKey = adminId ? `id:${adminId}` : `slug:${slug?.toLowerCase()}`;
  const cached = userBlockedCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < USER_BLOCKED_CACHE_TTL_MS) {
    return cached.isBlocked;
  }

  let isBlocked = false;
  if (adminId) {
    const memoryUser = store.users.find((u) => u.id === Number(adminId));
    if (memoryUser) {
      if (memoryUser.account_state === 'locked' || memoryUser.isBlocked || memoryUser.tier === 'blocked' || memoryUser.status === 'blocked') {
        isBlocked = true;
      }
    } else {
      try {
        const { data: user } = await supabase.from('users').select('id, tier, account_state').eq('id', Number(adminId)).single();
        if (user && (user.account_state === 'locked' || user.tier === 'blocked')) {
          isBlocked = true;
        }
      } catch {}
    }
  } else if (slug) {
    const memoryUser = store.users.find((u) => u.username && u.username.toLowerCase() === slug.toLowerCase());
    if (memoryUser) {
      if (memoryUser.account_state === 'locked' || memoryUser.isBlocked || memoryUser.tier === 'blocked' || memoryUser.status === 'blocked') {
        isBlocked = true;
      }
    } else {
      try {
        const { data: user } = await supabase.from('users').select('id, tier, account_state').ilike('username', slug.toLowerCase()).single();
        if (user && (user.account_state === 'locked' || user.tier === 'blocked')) {
          isBlocked = true;
        }
      } catch {}
    }
  }

  userBlockedCache.set(cacheKey, { isBlocked, timestamp: Date.now() });
  return isBlocked;
}

// High-performance In-Memory Cache for Public Tree Pages
const publicTreeCache = new Map();
const PUBLIC_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes fast cache

function invalidatePublicTreeCache(slug) {
  if (slug) {
    publicTreeCache.delete(slug.toLowerCase());
  } else {
    publicTreeCache.clear();
  }
}

function sanitizeTreeForPublic(tree) {
  if (!tree) return tree;
  const clone = { ...tree };
  delete clone.custom_theme; // Prevent duplicate payload serialization
  if (clone.customTheme) {
    const theme = { ...clone.customTheme };
    if (theme.backgroundImageUrl) {
      theme.backgroundValue = `url("${theme.backgroundImageUrl}") center / cover no-repeat`;
    } else if (typeof theme.backgroundValue === 'string' && theme.backgroundValue.startsWith('url("data:')) {
      theme.backgroundValue = theme.backgroundColor || '#050F15';
    }
    if (typeof theme.wallpaperVideoUrl === 'string' && theme.wallpaperVideoUrl.startsWith('data:')) {
      theme.wallpaperVideoUrl = null;
    }
    clone.customTheme = theme;
  }
  return clone;
}

// Public Tree Page
app.get('/api/public/trees/:slug', async (req, res) => {
  const slug = req.params.slug.toLowerCase();

  // 1. Check in-memory fast cache
  const cached = publicTreeCache.get(slug);
  if (cached && Date.now() - cached.timestamp < PUBLIC_CACHE_TTL_MS) {
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    return res.json(cached.payload);
  }

  const dbTree = await db.getTreeBySlug(slug);
  if (dbTree) {
    const adminId = dbTree.admin_id ?? dbTree.adminId;
    const isBlocked = await isTreeOwnerBlocked(adminId, slug);
    if (isBlocked) {
      return res.status(403).json({
        error: 'Account Suspended',
        isBlocked: true,
        slug,
        message: 'This digital card is temporarily unavailable because the account has been locked. Please contact the administrator at indiataps.vercel.app or india.taps7@gmail.com.',
      });
    }

    db.recordAnalyticsEvent({
      treeId: dbTree.id,
      eventType: 'page_view',
      referrer: req.headers['referer'] || req.headers['referrer'],
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.socket?.remoteAddress,
    });

    let rawCards = dbTree.cards || [];
    if (rawCards.length === 0) {
      rawCards = store.cards.filter((c) => c.treeId === dbTree.id);
    }

    const publicCards = rawCards
      .filter((c) => c.visible !== false)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    const payload = {
      tree: sanitizeTreeForPublic(dbTree),
      cards: publicCards,
    };

    publicTreeCache.set(slug, { payload, timestamp: Date.now() });
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    return res.json(payload);
  }

  const tree = store.trees.find((t) => t.slug === slug && !t.deletedAt && t.status === 'live');
  if (!tree) return res.status(404).json({ error: 'Tree not found or unpublished' });

  const isBlocked = await isTreeOwnerBlocked(tree.adminId, slug);
  if (isBlocked) {
    return res.status(403).json({
      error: 'Account Suspended',
      isBlocked: true,
      slug,
      message: 'This digital card is temporarily unavailable because the account has been locked. Please contact the administrator at indiataps.vercel.app or india.taps7@gmail.com.',
    });
  }

  const publicCards = store.cards
    .filter((c) => c.treeId === tree.id && c.visible !== false)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  const payload = {
    tree: sanitizeTreeForPublic(tree),
    cards: publicCards,
  };

  publicTreeCache.set(slug, { payload, timestamp: Date.now() });
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
  res.json(payload);
});

// Public Click Tracker
app.post('/api/public/cards/:id/click', trackRateLimiter, async (req, res) => {
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

// Public View Tracker (handles navigator.sendBeacon from public cards)
app.post('/api/track', trackRateLimiter, async (req, res) => {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {}
  }
  const treeId = body?.treeId ? parseInt(body.treeId, 10) : null;
  if (treeId) {
    await db.incrementTreeViews(treeId).catch(() => {});
    db.recordAnalyticsEvent({
      treeId,
      eventType: body?.eventType || 'view',
      referrer: req.headers['referer'] || req.headers['referrer'],
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress,
    });
  }
  res.json({ success: true });
});

// Upload Asset (Image / PDF) to Supabase Storage CDN
app.post('/api/admin/upload', async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { file, filename, folder, treeId } = req.body;
  if (!file) {
    return res.status(400).json({ error: 'File data is required' });
  }

  if (treeId) {
    const ownerId = await resolveTreeOwner(parseInt(treeId, 10));
    if (ownerId !== null && ownerId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden: You do not own this tree' });
    }
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
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const treeId = req.query.treeId ? parseInt(req.query.treeId, 10) : undefined;
  if (treeId) {
    const ownerId = await resolveTreeOwner(treeId);
    if (ownerId !== null && ownerId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden: You do not own this tree' });
    }
  }

  const folder = req.query.folder ? String(req.query.folder) : undefined;
  const assets = await db.getAssets({ treeId, adminId: req.userId, folder });
  res.json(assets);
});

// Delete Asset from Storage
app.delete('/api/admin/assets', async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { filePath, publicUrl } = req.body;
  const success = await db.deleteAsset({ filePath, publicUrl });
  res.json({ success });
});

// Health check endpoint
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api', (req, res) => res.json({ message: 'IndiaTaps API running', status: 'ok' }));

const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('server/src/index.js') ||
  process.argv[1].endsWith('src/index.js')
);

async function warmUpPublicTreeCache() {
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
          .sort((a, b) => (a.position || 0) - (b.position || 0));

        const payload = {
          tree: sanitizeTreeForPublic({
            ...t,
            adminId: Number(t.admin_id),
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
            socialLinks: t.social_links || t.custom_theme?.socialLinks || [],
            seo: t.seo || t.custom_theme?.seo || { title: '', description: '', faviconUrl: '' },
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

if (isDirectRun && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    warmUpPublicTreeCache().catch(() => {});
  });
}

export default app;
export { app };

