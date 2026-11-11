/**
 * Signing in, signing out and the accounts of the clients.
 */
import { db } from '../db/db.js';
import { supabase } from '../db/supabase.js';
import { store } from '../lib/store.js';
import { authRateLimiter, trackRateLimiter } from '../lib/rate-limit.js';
import { safeEqual, dbErrorHint } from '../lib/errors.js';
import {
  resolveTree,
  resolveTreeOwner,
  resolveCardOwner,
  isSlugAvailableGlobally,
  isCallerSuperAdmin,
  isTreeOwnerBlocked,
} from '../lib/ownership.js';
import {
  invalidatePublicTreeCache,
  invalidatePublicTreeCacheForTree,
  publicTreeCache,
  PUBLIC_CACHE_TTL_MS,
  treeInfoCache,
} from '../lib/cache.js';
import { toPublicCard, sanitizeTreeForPublic } from '../lib/public-payload.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { setSessionCookie, clearSessionCookie } from '../utils/session.js';

/**
 * Register the routes on the app.
 * @param {import('express').Express} app
 */
export function registerAuthRoutes(app) {
  // Auth Me
  app.get('/api/auth/me', async (req, res) => {
    const userId = req.userId;
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
      setSessionCookie(res, u.id);
      // Drop the old unsigned cookies so nothing keeps using them.
      res.clearCookie('userId', { path: '/' });
      res.clearCookie('token', { path: '/' });
    };

    try {
      const user = await db.signInUser({ identifier: loginId, password });
      if (user) {
        if (user.isBlocked || user.is_blocked || user.status === 'blocked' || user.account_state === 'locked' || user.accountState === 'locked' || user.tier === 'blocked') {
          return res.status(403).json({ error: 'Your account has been locked by the administrator. Contact india.taps7@gmail.com for assistance.' });
        }
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
      console.warn('[Admin provision error]', err.message);
    }

    const existingEmail = store.users.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Ensure cleanUsername is unique in memory store
    let memUsername = cleanUsername;
    let counter = 1;
    while (store.users.some((u) => u.username.toLowerCase() === memUsername)) {
      memUsername = `${cleanUsername}${counter++}`;
    }

    const newId = Date.now();
    const hashedPassword = await hashPassword(password);
    const newUser = {
      id: newId,
      email: cleanEmail,
      username: memUsername,
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
      name: memUsername,
      slug: memUsername,
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
    clearSessionCookie(res);
    res.clearCookie('userId', { path: '/' });
    res.clearCookie('token', { path: '/' });
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
}
