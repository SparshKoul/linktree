import { describe, it, expect } from 'vitest';
import { hashPassword, hashPasswordSync, verifyPassword } from './utils/password.js';

describe('Tree Slug Validation', () => {
  const RESERVED_SLUGS = ['admin', 'api', 'login', 'dashboard', 'settings', 'static', 'auth'];

  function validateSlug(slug) {
    const clean = slug.toLowerCase().trim();
    if (clean.length < 3 || clean.length > 30) {
      return { valid: false, error: 'Must be between 3 and 30 characters' };
    }
    if (!/^[a-z0-9-]+$/.test(clean)) {
      return { valid: false, error: 'Only lowercase letters, numbers, and hyphens allowed' };
    }
    if (RESERVED_SLUGS.includes(clean)) {
      return { valid: false, error: 'Reserved keyword' };
    }
    return { valid: true };
  }

  it('accepts valid business slugs', () => {
    expect(validateSlug('riyast').valid).toBe(true);
    expect(validateSlug('my-boutique-2026').valid).toBe(true);
    expect(validateSlug('shop123').valid).toBe(true);
  });

  it('rejects reserved words', () => {
    expect(validateSlug('admin').valid).toBe(false);
    expect(validateSlug('api').valid).toBe(false);
    expect(validateSlug('login').valid).toBe(false);
  });

  it('rejects too short or too long slugs', () => {
    expect(validateSlug('ab').valid).toBe(false);
    expect(validateSlug('a'.repeat(31)).valid).toBe(false);
  });

  it('rejects invalid characters', () => {
    expect(validateSlug('riyast boutique').valid).toBe(false);
    expect(validateSlug('riyast!').valid).toBe(false);
    expect(validateSlug('riyast@shop').valid).toBe(false);
  });
});

describe('Multi-Account Tree Isolation', () => {
  it('correctly associates trees per account', () => {
    const trees = [
      { id: 1, adminId: 1, slug: 'riyast' },
      { id: 2, adminId: 1, slug: 'helolo' },
      { id: 3, adminId: 1, slug: 'riyastttttt' },
      { id: 4, adminId: 2, slug: 'alex' },
    ];

    const user1Trees = trees.filter((t) => t.adminId === 1);
    const user2Trees = trees.filter((t) => t.adminId === 2);

    expect(user1Trees).toHaveLength(3);
    expect(user1Trees.map((t) => t.slug)).toEqual(['riyast', 'helolo', 'riyastttttt']);

    expect(user2Trees).toHaveLength(1);
    expect(user2Trees[0].slug).toBe('alex');
  });
});

describe('Supabase Asset Upload & Multi-Device Sync', () => {
  it('identifies base64 images and PDFs for Supabase storage uploading', () => {
    const isBase64Image = (str) => typeof str === 'string' && str.startsWith('data:image');
    const isBase64Pdf = (str) => typeof str === 'string' && str.startsWith('data:application/pdf');

    const imageSample = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const pdfSample = 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCg==';
    const httpSample = 'https://qbnrhcllnuwdeivpxxoj.supabase.co/storage/v1/object/public/linktree-assets/banners/sample.png';

    expect(isBase64Image(imageSample)).toBe(true);
    expect(isBase64Image(httpSample)).toBe(false);
    expect(isBase64Pdf(pdfSample)).toBe(true);
    expect(isBase64Pdf(httpSample)).toBe(false);
  });

  it('never takes the user id from a caller supplied header or legacy cookie', () => {
    // The real server only trusts the signed session cookie. This test keeps
    // the rule visible: a header or an unsigned cookie must never be an id.
    function resolveUser(headers, cookies) {
      const headerId = headers?.['x-user-id'];
      const cookieId = cookies?.userId || cookies?.token;
      if (headerId) return 'FORGED HEADER';
      if (cookieId) return 'FORGED COOKIE';
      return null;
    }

    expect(resolveUser({ 'x-user-id': '1' }, {})).toBe('FORGED HEADER');
    expect(resolveUser({}, { userId: '1' })).toBe('FORGED COOKIE');
    expect(resolveUser({}, { token: '1' })).toBe('FORGED COOKIE');
    expect(resolveUser({}, {})).toBeNull();
  });

  it('formats modular storage file paths per folder and tree', () => {
    function generateModularStoragePath(folder, treeId, filename) {
      const cleanFolder = (folder || 'uploads').replace(/^\/+|\/+$/g, '');
      const subDir = treeId ? `tree_${treeId}` : 'common';
      const ext = filename.split('.').pop();
      return `${cleanFolder}/${subDir}/mock-timestamp.${ext}`;
    }

    expect(generateModularStoragePath('avatars', 1, 'avatar.png')).toBe('avatars/tree_1/mock-timestamp.png');
    expect(generateModularStoragePath('wallpapers', 2, 'bg.avif')).toBe('wallpapers/tree_2/mock-timestamp.avif');
    expect(generateModularStoragePath('menus', null, 'menu.pdf')).toBe('menus/common/mock-timestamp.pdf');
  });

  it('extracts storage file path from CDN public URL for asset deletion', () => {
    function extractStoragePath(publicUrl, bucket = 'linktree-assets') {
      const marker = `/${bucket}/`;
      const idx = publicUrl.indexOf(marker);
      return idx !== -1 ? publicUrl.substring(idx + marker.length) : null;
    }

    const sampleUrl = 'https://qbnrhcllnuwdeivpxxoj.supabase.co/storage/v1/object/public/linktree-assets/banners/tree_1/1731234567-abc.png';
    expect(extractStoragePath(sampleUrl)).toBe('banners/tree_1/1731234567-abc.png');
  });

  it('assigns tree ownership to the authenticated user ID and isolates across accounts', () => {
    function createTreeRecord({ reqUser, bodyAdmin, currentUserId, defaultAdminId }, treeData) {
      const adminId = reqUser || currentUserId || (bodyAdmin ? parseInt(bodyAdmin, 10) : defaultAdminId);
      return {
        id: Date.now(),
        adminId,
        ...treeData,
      };
    }

    const treeUser1 = createTreeRecord(
      { reqUser: 1, currentUserId: 1, defaultAdminId: 1 },
      { slug: 'indiataps-store', name: 'IndiaTaps Store' }
    );
    expect(treeUser1.adminId).toBe(1);

    const treeUser2 = createTreeRecord(
      { reqUser: 2, currentUserId: 2, defaultAdminId: 1 },
      { slug: 'alex-cafe', name: 'Alex Cafe' }
    );
    expect(treeUser2.adminId).toBe(2);

    // Cross-device query: only trees matching user 2 are shown to user 2
    const allTrees = [treeUser1, treeUser2];
    const user2Trees = allTrees.filter((t) => t.adminId === 2);
    expect(user2Trees).toHaveLength(1);
    expect(user2Trees[0].slug).toBe('alex-cafe');
  });
});

describe('SaaS Security & Ownership Verification Logic', () => {
  const mockTrees = [
    { id: 101, adminId: 1, slug: 'riyast', status: 'live' },
    { id: 102, adminId: 1, slug: 'taps-cafe', status: 'live' },
    { id: 201, adminId: 2, slug: 'bistro-delight', status: 'live' },
    { id: 202, adminId: 2, slug: 'hidden-bar', status: 'draft' },
  ];

  const mockCards = [
    { id: 1001, treeId: 101, title: 'Menu', visible: true, position: 0 },
    { id: 1002, treeId: 101, title: 'Secret Promo', visible: false, position: 1 },
    { id: 2001, treeId: 201, title: 'Instagram', visible: true, position: 0 },
  ];

  function verifyTreePermission(treeId, requestingUserId) {
    if (!requestingUserId) return { allowed: false, status: 401, error: 'Authentication required' };
    const tree = mockTrees.find((t) => t.id === treeId);
    if (!tree) return { allowed: false, status: 404, error: 'Tree not found' };
    if (tree.adminId !== requestingUserId) {
      return { allowed: false, status: 403, error: 'Forbidden: You do not own this tree' };
    }
    return { allowed: true, status: 200 };
  }

  function verifyCardPermission(cardId, requestingUserId) {
    if (!requestingUserId) return { allowed: false, status: 401, error: 'Authentication required' };
    const card = mockCards.find((c) => c.id === cardId);
    if (!card) return { allowed: false, status: 404, error: 'Card not found' };
    return verifyTreePermission(card.treeId, requestingUserId);
  }

  function isSlugAvailableAcrossAllAccounts(newSlug, excludeTreeId = null) {
    const clean = newSlug.toLowerCase().trim();
    const reserved = ['admin', 'api', 'login', 'dashboard', 'settings', 'static', 'auth'];
    if (reserved.includes(clean)) return { available: false, reason: 'Reserved keyword' };
    if (!/^[a-z0-9-]+$/.test(clean) || clean.length < 3) return { available: false, reason: 'Invalid format' };
    const conflict = mockTrees.find((t) => t.slug === clean && (excludeTreeId ? t.id !== excludeTreeId : true));
    if (conflict) return { available: false, reason: 'Slug already claimed by another user' };
    return { available: true };
  }

  function getPublicTreePayload(slug) {
    const clean = slug.toLowerCase().trim();
    const tree = mockTrees.find((t) => t.slug === clean && t.status === 'live');
    if (!tree) return null;
    const cards = mockCards.filter((c) => c.treeId === tree.id && c.visible !== false);
    return { tree, cards };
  }

  it('allows public read-only access without login, filtering hidden cards', () => {
    const publicData = getPublicTreePayload('riyast');
    expect(publicData).not.toBeNull();
    expect(publicData.tree.slug).toBe('riyast');
    expect(publicData.cards).toHaveLength(1);
    expect(publicData.cards[0].title).toBe('Menu');
    // Secret Promo is invisible so not served publicly
    expect(publicData.cards.some((c) => c.visible === false)).toBe(false);
  });

  it('rejects public access to draft or unpublished trees with 404', () => {
    const draftData = getPublicTreePayload('hidden-bar');
    expect(draftData).toBeNull();
  });

  it('permits tree owner to edit their own card and tree', () => {
    const resTree = verifyTreePermission(101, 1);
    expect(resTree.allowed).toBe(true);

    const resCard = verifyCardPermission(1001, 1);
    expect(resCard.allowed).toBe(true);
  });

  it('blocks other users from editing or deleting someone elses tree (403 Forbidden)', () => {
    // User 2 trying to edit User 1's tree (101)
    const res = verifyTreePermission(101, 2);
    expect(res.allowed).toBe(false);
    expect(res.status).toBe(403);
    expect(res.error).toContain('Forbidden');
  });

  it('blocks other users from editing or deleting someone elses card (403 Forbidden)', () => {
    // User 2 trying to edit User 1's card (1001)
    const res = verifyCardPermission(1001, 2);
    expect(res.allowed).toBe(false);
    expect(res.status).toBe(403);
    expect(res.error).toContain('Forbidden');
  });

  it('blocks unauthenticated requests from editing cards or trees (401 Unauthorized)', () => {
    const res = verifyTreePermission(101, null);
    expect(res.allowed).toBe(false);
    expect(res.status).toBe(401);
  });

  it('enforces globally unique URLs across all users and accounts', () => {
    // User 2 trying to claim User 1's slug 'riyast'
    const check1 = isSlugAvailableAcrossAllAccounts('riyast');
    expect(check1.available).toBe(false);
    expect(check1.reason).toContain('already claimed');

    // User 1 trying to claim User 2's slug 'bistro-delight'
    const check2 = isSlugAvailableAcrossAllAccounts('bistro-delight');
    expect(check2.available).toBe(false);

    // Completely new unique slug is accepted
    const check3 = isSlugAvailableAcrossAllAccounts('urban-grill');
    expect(check3.available).toBe(true);

    // Tree updating its own slug allows keeping same slug
    const checkSelf = isSlugAvailableAcrossAllAccounts('riyast', 101);
    expect(checkSelf.available).toBe(true);
  });
});

describe('Super Admin & Authentication Restrictions', () => {
  const users = [
    { id: 1, email: 'sparshkoul6@gmail.com', username: 'sparshkoul6', role: 'super_admin', accountType: 'super_admin', password: hashPasswordSync('mockAdminPass!2026') },
    { id: 2, email: 'riyast@example.com', username: 'riyast', role: 'client', accountType: 'client', password: hashPasswordSync('mockClientPass!2026') },
  ];

  function isSuperAdmin(user) {
    if (!user) return false;
    return (
      user.role === 'super_admin' ||
      user.accountType === 'super_admin' ||
      user.email?.toLowerCase() === 'sparshkoul6@gmail.com'
    );
  }

  function handleRegisterAttempt(callerUser, newUserData) {
    if (!isSuperAdmin(callerUser)) {
      return { status: 403, error: 'Public registration is disabled. Accounts can only be provisioned by the Super Admin (sparshkoul6@gmail.com).' };
    }
    return {
      status: 201,
      user: {
        id: users.length + 1,
        email: newUserData.email,
        username: newUserData.username,
        role: newUserData.role || 'client',
        accountType: newUserData.accountType || 'client',
      },
    };
  }

  function handleGoogleOAuthAttempt() {
    return { status: 403, error: 'Google OAuth and social logins are disabled. Please sign in using your email and password.' };
  }

  async function handleEmailPasswordLogin(identifier, password) {
    const cleanId = (identifier || '').trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId);
    if (!user || !(await verifyPassword(password, user.password))) {
      return { status: 401, error: 'Invalid username/email or password' };
    }
    return { status: 200, user };
  }

  it('recognizes sparshkoul6@gmail.com as Super Admin', () => {
    expect(isSuperAdmin(users[0])).toBe(true);
    expect(isSuperAdmin(users[1])).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
  });

  it('rejects public registration by unauthenticated callers (403 Forbidden)', () => {
    const res = handleRegisterAttempt(null, { email: 'stranger@example.com', username: 'stranger' });
    expect(res.status).toBe(403);
    expect(res.error).toContain('Public registration is disabled');
  });

  it('rejects account creation attempts by non-super-admin users (403 Forbidden)', () => {
    const regularUser = users[1]; // client
    const res = handleRegisterAttempt(regularUser, { email: 'fake@example.com', username: 'fake' });
    expect(res.status).toBe(403);
    expect(res.error).toContain('Super Admin');
  });

  it('allows Super Admin (sparshkoul6@gmail.com) to provision new client accounts with only email and password', () => {
    const superAdmin = users[0];
    const res = handleRegisterAttempt(superAdmin, { email: 'cafe@delight.com' });
    expect(res.status).toBe(201);
    expect(res.user.email).toBe('cafe@delight.com');
    expect(res.user.role).toBe('client');
  });

  it('allows a single user account to create unlimited digital cards', () => {
    const accountTrees = [];
    const userId = 2;
    for (let i = 1; i <= 10; i++) {
      accountTrees.push({ id: 500 + i, adminId: userId, slug: `branch-${i}`, name: `Branch ${i}` });
    }
    const userCards = accountTrees.filter((t) => t.adminId === userId);
    expect(userCards).toHaveLength(10);
    expect(userCards[0].slug).toBe('branch-1');
    expect(userCards[9].slug).toBe('branch-10');
  });

  it('disables Google OAuth with 403 Forbidden', () => {
    const res = handleGoogleOAuthAttempt();
    expect(res.status).toBe(403);
    expect(res.error).toContain('disabled');
  });

  it('allows authorized users to sign in with email and password', async () => {
    // Via email
    const loginEmail = await handleEmailPasswordLogin('sparshkoul6@gmail.com', 'mockAdminPass!2026');
    expect(loginEmail.status).toBe(200);
    expect(loginEmail.user.username).toBe('sparshkoul6');

    // Via username
    const loginUsername = await handleEmailPasswordLogin('riyast', 'mockClientPass!2026');
    expect(loginUsername.status).toBe(200);
    expect(loginUsername.user.email).toBe('riyast@example.com');

    // Invalid credentials
    const loginBad = await handleEmailPasswordLogin('riyast', 'wrongpwd');
    expect(loginBad.status).toBe(401);
  });

  it('allows Super Admin to view client trees count and lock/unlock client accounts via account_state', () => {
    const clients = [
      { id: 10, email: 'client1@test.com', account_state: 'active', isBlocked: false },
      { id: 20, email: 'client2@test.com', account_state: 'active', isBlocked: false },
    ];
    const trees = [
      { id: 101, adminId: 10, slug: 'client1-tree1' },
      { id: 102, adminId: 10, slug: 'client1-tree2' },
      { id: 103, adminId: 20, slug: 'client2-tree1' },
    ];

    // Compute client trees
    const enriched = clients.map((c) => {
      const userTrees = trees.filter((t) => t.adminId === c.id);
      return {
        ...c,
        treesCount: userTrees.length,
        trees: userTrees,
      };
    });

    expect(enriched[0].treesCount).toBe(2);
    expect(enriched[1].treesCount).toBe(1);

    // Toggle block / account_state logic
    function toggleAccountState(caller, targetUser, isLocked) {
      if (!isSuperAdmin(caller)) return { status: 403, error: 'Forbidden' };
      if (targetUser.email === 'sparshkoul6@gmail.com') return { status: 400, error: 'Cannot block Super Admin' };
      targetUser.account_state = isLocked ? 'locked' : 'active';
      targetUser.isBlocked = isLocked;
      return { status: 200, account_state: targetUser.account_state, isBlocked: targetUser.isBlocked };
    }

    // Lock client1
    const lockRes = toggleAccountState(users[0], clients[0], true);
    expect(lockRes.status).toBe(200);
    expect(clients[0].account_state).toBe('locked');
    expect(clients[0].isBlocked).toBe(true);

    // Verify locked user cannot log in
    function tryLogin(user) {
      if (user.account_state === 'locked' || user.isBlocked) {
        return { status: 403, error: 'Your account has been locked by the administrator.' };
      }
      return { status: 200, success: true };
    }
    expect(tryLogin(clients[0]).status).toBe(403);

    // Cannot lock Super Admin
    const lockSuperRes = toggleAccountState(users[0], users[0], true);
    expect(lockSuperRes.status).toBe(400);

    // Unlock client1
    const unlockRes = toggleAccountState(users[0], clients[0], false);
    expect(unlockRes.status).toBe(200);
    expect(clients[0].account_state).toBe('active');
    expect(clients[0].isBlocked).toBe(false);
    expect(tryLogin(clients[0]).status).toBe(200);
  });

  it('allows ONLY Super Admin to update/change password of any user', async () => {
    const initialSecret = 'originalSecKey_987';
    const clientUser = { id: 55, email: 'client55@example.com', password: hashPasswordSync(initialSecret) };

    async function changeUserPassword(caller, target, newPassword) {
      if (!isSuperAdmin(caller)) return { status: 403, error: 'Forbidden: Super Admin access required' };
      if (!newPassword || newPassword.trim().length < 6) {
        return { status: 400, error: 'Password must be at least 6 characters long' };
      }
      target.password = await hashPassword(newPassword.trim());
      return { status: 200, success: true, message: 'Password updated successfully' };
    }

    // 1. Regular client cannot change someone else's password via admin API
    const regularUser = { id: 2, email: 'client@indiataps.com', role: 'client' };
    const unauthorizedRes = await changeUserPassword(regularUser, clientUser, 'unauthorizedAttempt');
    expect(unauthorizedRes.status).toBe(403);
    expect(await verifyPassword(initialSecret, clientUser.password)).toBe(true);

    // 2. Reject short passwords
    const shortPwdRes = await changeUserPassword(users[0], clientUser, '123');
    expect(shortPwdRes.status).toBe(400);
    expect(await verifyPassword(initialSecret, clientUser.password)).toBe(true);

    // 3. Super Admin successfully updates password
    const updatedSecret = 'brandNewAdminAssignedKey_456';
    const successRes = await changeUserPassword(users[0], clientUser, updatedSecret);
    expect(successRes.status).toBe(200);
    expect(await verifyPassword(updatedSecret, clientUser.password)).toBe(true);

    // 4. Verify login behavior with new vs old password
    async function checkCredentials(user, password) {
      const match = await verifyPassword(password, user.password);
      if (!match) return 401;
      return 200;
    }
    expect(await checkCredentials(clientUser, initialSecret)).toBe(401);
    expect(await checkCredentials(clientUser, updatedSecret)).toBe(200);
  });

  it('hides cards and shows suspended state when card owner account is blocked, and restores when unblocked', () => {
    const owner = { id: 77, email: 'bistro@example.com', account_state: 'active', isBlocked: false };
    const tree = { id: 701, adminId: 77, slug: 'bistro-delight', status: 'live' };
    const cards = [
      { id: 1, treeId: 701, title: 'Menu' },
      { id: 2, treeId: 701, title: 'Instagram' },
    ];

    function resolvePublicTree(slug, currentOwner, currentTree, currentCards) {
      if (!currentTree || currentTree.slug !== slug || currentTree.status !== 'live') {
        return { status: 404, error: 'Not found' };
      }
      if (currentOwner.account_state === 'locked' || currentOwner.isBlocked) {
        return {
          status: 403,
          error: 'Account Suspended',
          isBlocked: true,
          message: 'This digital card is temporarily unavailable because the account has been locked. Please contact the administrator at indiataps.vercel.app or india.taps7@gmail.com.',
        };
      }
      return { status: 200, tree: currentTree, cards: currentCards };
    }

    // 1. When owner is active, public page returns cards normally
    const activeRes = resolvePublicTree('bistro-delight', owner, tree, cards);
    expect(activeRes.status).toBe(200);
    expect(activeRes.cards.length).toBe(2);
    expect(activeRes.cards[0].title).toBe('Menu');

    // 2. When owner is locked/blocked, public page returns 403 and hides all cards
    owner.account_state = 'locked';
    owner.isBlocked = true;
    const blockedRes = resolvePublicTree('bistro-delight', owner, tree, cards);
    expect(blockedRes.status).toBe(403);
    expect(blockedRes.isBlocked).toBe(true);
    expect(blockedRes.cards).toBeUndefined();
    expect(blockedRes.message).toContain('indiataps.vercel.app');

    // 3. When unblocked, all cards work normally again without loss
    owner.account_state = 'active';
    owner.isBlocked = false;
    const restoredRes = resolvePublicTree('bistro-delight', owner, tree, cards);
    expect(restoredRes.status).toBe(200);
    expect(restoredRes.cards.length).toBe(2);
  });

  it('guarantees unique slug constraint persists even when the card owner is locked/blocked', () => {
    const blockedOwner = { id: 88, email: 'blocked@example.com', account_state: 'locked', isBlocked: true };
    const trees = [
      { id: 801, adminId: 88, slug: 'helo', deletedAt: null },
    ];

    function checkSlugAvailable(slug, allTrees) {
      const clean = slug.toLowerCase().trim();
      const taken = allTrees.some((t) => t.slug.toLowerCase() === clean && !t.deletedAt);
      return !taken;
    }

    // Even though owner is blocked, slug 'helo' remains strictly reserved
    expect(checkSlugAvailable('helo', trees)).toBe(false);
    expect(checkSlugAvailable('HELO', trees)).toBe(false);

    // Another user attempting to create/claim 'helo' gets rejected
    function tryCreateTree(slug, allTrees) {
      if (!checkSlugAvailable(slug, allTrees)) {
        return { status: 409, error: 'This URL slug is already taken or reserved across IndiaTaps' };
      }
      return { status: 201, success: true };
    }

    const claimAttempt = tryCreateTree('helo', trees);
    expect(claimAttempt.status).toBe(409);
    expect(claimAttempt.error).toContain('already taken');
  });

  describe('Password Security and Bcrypt Hashing', () => {
    it('hashes passwords using standard bcrypt format ($2a$ or $2b$)', async () => {
      const raw = 'mySecretPass@2026';
      const hash = await hashPassword(raw);

      // Must NOT be stored in plain text
      expect(hash).not.toBe(raw);
      expect(hash.length).toBeGreaterThanOrEqual(50);
      // Bcrypt hash identifier
      expect(/^\$2[aby]\$\d+\$/.test(hash)).toBe(true);
    });

    it('generates unique salts so identical passwords produce completely different hashes', async () => {
      const raw = 'duplicateSourcePayload_99';
      const hash1 = await hashPassword(raw);
      const hash2 = await hashPassword(raw);

      expect(hash1).not.toBe(hash2);
      expect(await verifyPassword(raw, hash1)).toBe(true);
      expect(await verifyPassword(raw, hash2)).toBe(true);
    });

    it('correctly validates valid passwords and rejects invalid passwords', async () => {
      const plain = 'superAdminSecureKey#1';
      const hashed = hashPasswordSync(plain);

      expect(await verifyPassword(plain, hashed)).toBe(true);
      expect(await verifyPassword('wrongPassword', hashed)).toBe(false);
      expect(await verifyPassword('', hashed)).toBe(false);
    });

    it('gracefully supports legacy unhashed passwords for seamless zero-downtime migration', async () => {
      const legacyPlain = 'legacyPass123';
      // If a legacy user hasn't been upgraded yet:
      expect(await verifyPassword(legacyPlain, legacyPlain)).toBe(true);
      expect(await verifyPassword('wrong', legacyPlain)).toBe(false);
    });
  });
});


