import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from './index.js';
import { toPublicCard } from './lib/public-payload.js';
import { isSafeCardUrl, sanitizeCardUrl } from './utils/url.js';
import { SESSION_COOKIE, signSession, verifySession } from './utils/session.js';

// Some checks talk to the database. They are skipped when the environment
// has no database, so a fresh copy of the project still runs its tests.
const hasDatabase = Boolean(
  process.env.SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
);

let server;
let baseUrl;

beforeAll(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('Session tokens', () => {
  it('round trips a user id', () => {
    const token = signSession(42);
    expect(verifySession(token)).toBe(42);
  });

  it('rejects a tampered token', () => {
    const token = signSession(42);
    const [payload, signature] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ uid: 1, exp: Date.now() + 60000 })).toString('base64url');
    expect(verifySession(`${forged}.${signature}`)).toBeNull();
    expect(verifySession(`${payload}.${signature.slice(0, -1)}x`)).toBeNull();
  });

  it('rejects an expired token', () => {
    const token = signSession(42, -1000);
    expect(verifySession(token)).toBeNull();
  });

  it('rejects junk', () => {
    expect(verifySession('')).toBeNull();
    expect(verifySession('abc')).toBeNull();
    expect(verifySession(undefined)).toBeNull();
  });
});

describe('API identity', () => {
  it('refuses admin routes when the caller only sends a user id header', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { 'x-user-id': '1' },
    });
    expect(res.status).toBe(403);
  });

  it('refuses admin routes when the caller only sends a legacy cookie', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Cookie: 'userId=1; token=1' },
    });
    expect(res.status).toBe(403);
  });

  it('refuses admin routes when the session cookie is tampered with', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Cookie: `${SESSION_COOKIE}=${signSession(1)}.deadbeef` },
    });
    expect(res.status).toBe(403);
  });

  it('asks anonymous callers to sign in on admin routes', async () => {
    const res = await fetch(`${baseUrl}/api/admin/trees`);
    expect(res.status).toBe(401);
  });

  it('answers "not authenticated" for an anonymous profile request', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    expect(res.status).toBe(401);
  });

  it.skipIf(!hasDatabase)('accepts a signed session cookie', async () => {
    const res = await fetch(`${baseUrl}/api/admin/trees`, {
      headers: { Cookie: `${SESSION_COOKIE}=${signSession(2)}` },
    });
    expect(res.status).toBe(200);
  });

  it('keeps public pages public', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
  });
});

describe('Public payload', () => {
  it('never sends the passcode to visitors', () => {
    const card = toPublicCard({
      id: 7,
      type: 'link',
      title: 'Members only',
      url: 'https://example.com',
      lock_type: 'code',
      lock_value: 'hunter2',
      lockValue: 'hunter2',
      visible: true,
    });

    expect(card.lockType).toBe('code');
    expect(card.lock_value).toBeUndefined();
    expect(card.lockValue).toBeUndefined();
    expect(JSON.stringify(card)).not.toContain('hunter2');
  });

  it('keeps the lock type so the visitor still sees the gate', () => {
    expect(toPublicCard({ lock_type: 'age' }).lockType).toBe('age');
    expect(toPublicCard({ lock_type: 'email' }).lockType).toBe('email');
    expect(toPublicCard({}).lockType).toBe('none');
  });
});

describe('Card links', () => {
  it('allows the address types a card needs', () => {
    expect(isSafeCardUrl('https://example.com')).toBe(true);
    expect(isSafeCardUrl('http://example.com')).toBe(true);
    expect(isSafeCardUrl('mailto:hello@example.com')).toBe(true);
    expect(isSafeCardUrl('tel:+911234567890')).toBe(true);
    expect(isSafeCardUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    expect(isSafeCardUrl('data:application/pdf;base64,JVBERi0=')).toBe(true);
  });

  it('refuses addresses that would run code', () => {
    expect(isSafeCardUrl("javascript:alert(document.domain)")).toBe(false);
    expect(isSafeCardUrl('JavaScript:alert(1)')).toBe(false);
    expect(isSafeCardUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeCardUrl('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=')).toBe(false);
    expect(isSafeCardUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeCardUrl('')).toBe(false);
    expect(isSafeCardUrl(null)).toBe(false);
  });

  it('drops an unsafe address instead of storing it', () => {
    expect(sanitizeCardUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeCardUrl('https://example.com')).toBe('https://example.com');
  });
});

describe('View tracking', () => {
  it.skipIf(!hasDatabase)('accepts a tracked page view instead of crashing', async () => {
    const res = await fetch(`${baseUrl}/api/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ treeId: 2, eventType: 'page_view' }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  it('accepts a beacon sent as plain text', async () => {
    const res = await fetch(`${baseUrl}/api/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ treeId: 2, eventType: 'page_view' }),
    });
    expect(res.status).toBe(200);
  });
});

describe('Passcode gate', () => {
  it('asks for a passcode', async () => {
    const res = await fetch(`${baseUrl}/api/public/cards/1/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it.skipIf(!hasDatabase)('does not hand out a link for a card that does not exist', async () => {
    const res = await fetch(`${baseUrl}/api/public/cards/999999999/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'anything' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('Undo delete', () => {
  it.skipIf(!hasDatabase)('refuses to restore a tree that does not exist', async () => {
    const res = await fetch(`${baseUrl}/api/admin/trees/999999999/restore`, {
      method: 'POST',
      headers: { Cookie: `${SESSION_COOKIE}=${signSession(2)}` },
    });
    expect(res.status).toBe(404);
  });

  it.skipIf(!hasDatabase)('refuses to restore a tree of somebody else', async () => {
    const res = await fetch(`${baseUrl}/api/admin/trees/1/restore`, {
      method: 'POST',
      headers: { Cookie: `${SESSION_COOKIE}=${signSession(2)}` },
    });
    expect(res.status).toBe(403);
  });

  it('needs a signed in owner', async () => {
    const res = await fetch(`${baseUrl}/api/admin/trees/1/restore`, { method: 'POST' });
    expect(res.status).toBe(401);
  });
});
