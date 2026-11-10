import { describe, it, expect } from 'vitest';

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

  it('resolves multi-device user identity from header or cookie', () => {
    function resolveUser(headers, cookies) {
      const headerId = headers?.['x-user-id'];
      const cookieId = cookies?.userId || cookies?.token;
      if (headerId && !isNaN(parseInt(headerId, 10))) return parseInt(headerId, 10);
      if (cookieId && !isNaN(parseInt(cookieId, 10))) return parseInt(cookieId, 10);
      return null;
    }

    // Device A: uses cookie
    expect(resolveUser({}, { userId: '2' })).toBe(2);
    // Device B: uses header
    expect(resolveUser({ 'x-user-id': '3' }, {})).toBe(3);
    // Unauthenticated visitor gets null (no auto-impersonating admin)
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
    { id: 1, email: 'sparshkoul6@gmail.com', username: 'sparshkoul6', role: 'super_admin', accountType: 'super_admin', password: 'password123' },
    { id: 2, email: 'riyast@example.com', username: 'riyast', role: 'client', accountType: 'client', password: 'password123' },
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

  function handleEmailPasswordLogin(identifier, password) {
    const cleanId = (identifier || '').trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId);
    if (!user || user.password !== password) {
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

  it('allows authorized users to sign in with email and password', () => {
    // Via email
    const loginEmail = handleEmailPasswordLogin('sparshkoul6@gmail.com', 'password123');
    expect(loginEmail.status).toBe(200);
    expect(loginEmail.user.username).toBe('sparshkoul6');

    // Via username
    const loginUsername = handleEmailPasswordLogin('riyast', 'password123');
    expect(loginUsername.status).toBe(200);
    expect(loginUsername.user.email).toBe('riyast@example.com');

    // Invalid credentials
    const loginBad = handleEmailPasswordLogin('riyast', 'wrongpwd');
    expect(loginBad.status).toBe(401);
  });
});


