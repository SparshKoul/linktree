/**
 * Checks that the security and data fixes are working on a running server.
 *
 *   npm run verify --workspace=server
 *
 * It signs a session for one account (the same secret the server uses), makes
 * a few safe requests and prints PASS or FAIL for every fix. It creates one
 * temporary card and removes it again.
 *
 * Optional environment variables:
 *   BASE_URL        default http://localhost:3001
 *   VERIFY_USER_ID  account to test with, default 2
 */

const BASE = (process.env.BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const USER_ID = Number(process.env.VERIFY_USER_ID || 2);

const { signSession } = await import('../src/utils/session.js');
const token = signSession(USER_ID);
const asUser = (extra = {}) => ({ ...extra, Cookie: `it_session=${token}` });
const json = { 'Content-Type': 'application/json' };

const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -> ' + detail : ''}`);
}

// --- Identity -------------------------------------------------------------
let res = await fetch(`${BASE}/api/admin/users`, { headers: { 'x-user-id': '1' } });
check('forged x-user-id header is rejected', res.status === 403, `status ${res.status}`);

res = await fetch(`${BASE}/api/admin/users`, { headers: { Cookie: 'userId=1; token=1' } });
check('forged legacy cookies are rejected', res.status === 403, `status ${res.status}`);

res = await fetch(`${BASE}/api/admin/users`, { headers: { Cookie: 'it_session=eyJ1aWQiOjF9.deadbeef' } });
check('tampered session cookie is rejected', res.status === 403, `status ${res.status}`);

res = await fetch(`${BASE}/api/admin/trees`);
check('anonymous admin request asks for sign in', res.status === 401, `status ${res.status}`);

res = await fetch(`${BASE}/api/auth/me`);
check('anonymous profile request is refused', res.status === 401, `status ${res.status}`);

res = await fetch(`${BASE}/api/admin/trees`, { headers: asUser() });
if (res.status === 401) {
  console.log(
    `\nThe signed session was refused by ${BASE}.\n` +
      'When testing another server, its SESSION_SECRET must match the one used\n' +
      'to sign this session, for example:\n' +
      `  SESSION_SECRET=<the value of that server> BASE_URL=${BASE} npm run verify --workspace=server\n`
  );
}
check('signed session works', res.status === 200, `status ${res.status}`);
const trees = res.status === 200 ? await res.json() : [];
const tree = Array.isArray(trees) ? trees[0] : null;
if (!tree) {
  console.log('\nThis account has no tree yet, so the card checks are skipped.');
}

// --- CORS -----------------------------------------------------------------
res = await fetch(`${BASE}/api/admin/users`, { headers: { Origin: 'https://evil.example' } });
check('foreign origin gets no CORS header', !res.headers.get('access-control-allow-origin'));

res = await fetch(`${BASE}/api/admin/users`, { headers: { Origin: BASE } });
check('same origin still works', res.headers.get('access-control-allow-origin') === BASE);

// --- View tracking --------------------------------------------------------
res = await fetch(`${BASE}/api/track`, {
  method: 'POST',
  headers: json,
  body: JSON.stringify({ treeId: tree?.id || 2, eventType: 'page_view' }),
});
check('page view tracking returns 200', res.status === 200, `status ${res.status}`);

res = await fetch(`${BASE}/api/health`);
check('server is still alive after tracking', res.status === 200, `status ${res.status}`);

// --- Ownership ------------------------------------------------------------
if (tree) {
  res = await fetch(`${BASE}/api/admin/trees/${tree.id}`, { headers: asUser() });
  check('owner can read their own tree', res.status === 200, `status ${res.status}`);
}

// --- Cards, passcodes and counters ----------------------------------------
if (tree) {
  const created = await (await fetch(`${BASE}/api/admin/trees/${tree.id}/cards`, {
    method: 'POST',
    headers: asUser(json),
    body: JSON.stringify({
      type: 'link',
      title: 'verification card',
      url: 'https://example.com/secret',
      position: 9999,
      lockType: 'code',
      lockValue: 'verify-42',
      settings: {},
    }),
  })).json();
  const cardId = created?.id;
  check('card with a passcode was created', Boolean(cardId), `id ${cardId}`);

  const pub = await (await fetch(`${BASE}/api/public/trees/${tree.slug}`)).json();
  check('passcode is not in the public payload', !JSON.stringify(pub).includes('verify-42'));
  check('tree payload has no nested card copy', !pub.tree?.cards);
  const locked = (pub.cards || []).find((c) => c.id === cardId);
  check('visitor still sees the lock gate', locked?.lockType === 'code', `lockType ${locked?.lockType}`);

  res = await fetch(`${BASE}/api/public/cards/${cardId}/unlock`, {
    method: 'POST', headers: json, body: JSON.stringify({ code: 'wrong' }),
  });
  check('wrong passcode is refused', res.status === 403, `status ${res.status}`);

  res = await fetch(`${BASE}/api/public/cards/${cardId}/unlock`, {
    method: 'POST', headers: json, body: JSON.stringify({ code: 'verify-42' }),
  });
  const unlocked = await res.json();
  check('correct passcode returns the link', res.status === 200 && unlocked.success === true, `status ${res.status}`);

  const synced = await (await fetch(`${BASE}/api/admin/trees/${tree.id}/sync`, {
    method: 'POST',
    headers: asUser(json),
    body: JSON.stringify({
      treeUpdates: { title: tree.title },
      cards: [{
        id: cardId, type: 'link', title: 'verification card v2',
        url: 'https://example.com/secret', position: 9999, visible: true,
        lockType: 'code', lockValue: 'verify-42', settings: {},
      }],
    }),
  })).json();
  const savedCard = (synced.cards || []).find((c) => c.id === cardId);
  check('saving keeps the same card (no delete and recreate)', Boolean(savedCard), `saved id ${savedCard?.id}`);

  const clicksBefore = Number(savedCard?.clicks || 0);
  await Promise.all(Array.from({ length: 10 }, () =>
    fetch(`${BASE}/api/public/cards/${cardId}/click`, { method: 'POST' })));
  await new Promise((r) => setTimeout(r, 1500));
  const after = await (await fetch(`${BASE}/api/admin/trees/${tree.id}`, { headers: asUser() })).json();
  const afterCard = (after.cards || []).find((c) => c.id === cardId);
  const gained = Number(afterCard?.clicks || 0) - clicksBefore;
  check('10 clicks are all counted', gained === 10, `counted ${gained}`);

  res = await fetch(`${BASE}/api/admin/trees/${tree.id}/cards`, {
    method: 'POST',
    headers: asUser(json),
    body: JSON.stringify({ type: 'not_a_real_type', title: 'bogus', url: 'https://example.com', settings: {} }),
  });
  const bogus = await res.json();
  check('unknown card type is refused, not silently dropped', res.status !== 201 && Boolean(bogus.error), `status ${res.status}`);
  check('refusal explains what to do', Boolean(bogus.hint), bogus.hint ? 'hint given' : 'no hint');

  await fetch(`${BASE}/api/admin/cards/${cardId}`, { method: 'DELETE', headers: asUser() });
  const cleaned = await (await fetch(`${BASE}/api/admin/trees/${tree.id}`, { headers: asUser() })).json();
  check('verification card removed again', !(cleaned.cards || []).some((c) => c.id === cardId));
}

// --- Logout ---------------------------------------------------------------
res = await fetch(`${BASE}/api/auth/logout`, { method: 'POST', headers: asUser() });
check('logout works', res.status === 200, `status ${res.status}`);

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log('FAILED:');
  failed.forEach((f) => console.log(' - ' + f.name + ' -> ' + f.detail));
  process.exitCode = 1;
}
