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
    function resolveUser(headers, cookies, defaultId = 1) {
      const headerId = headers?.['x-user-id'];
      const cookieId = cookies?.userId || cookies?.token;
      if (headerId && !isNaN(parseInt(headerId, 10))) return parseInt(headerId, 10);
      if (cookieId && !isNaN(parseInt(cookieId, 10))) return parseInt(cookieId, 10);
      return defaultId;
    }

    // Device A: uses cookie
    expect(resolveUser({}, { userId: '2' })).toBe(2);
    // Device B: uses header
    expect(resolveUser({ 'x-user-id': '3' }, {})).toBe(3);
    // Default fallback
    expect(resolveUser({}, {})).toBe(1);
  });
});

