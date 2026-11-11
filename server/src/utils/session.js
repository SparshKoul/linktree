import crypto from 'crypto';

export const SESSION_COOKIE = 'it_session';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

let cachedSecret = null;

/**
 * Secret used to sign session cookies.
 * Order: SESSION_SECRET -> Supabase service key -> Supabase anon key -> random.
 * The random fallback only happens when the app is misconfigured (no Supabase
 * keys at all), in which case nothing is stored in the database anyway.
 */
function getSecret() {
  if (cachedSecret) return cachedSecret;

  const secret =
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    crypto.randomBytes(32).toString('hex');

  if (!process.env.SESSION_SECRET && !process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_ANON_KEY) {
    console.warn('[Session] No SESSION_SECRET or Supabase key found. Using a random secret; sessions reset on restart.');
  }

  cachedSecret = secret;
  return secret;
}

/**
 * Create a signed session token for a user id.
 * @param {number|string} userId
 * @param {number} [ttlMs]
 * @returns {string}
 */
export function signSession(userId, ttlMs = SESSION_TTL_MS) {
  const payload = Buffer.from(
    JSON.stringify({ uid: Number(userId), exp: Date.now() + ttlMs })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

/**
 * Verify a signed session token and return the user id, or null when the
 * token is missing, tampered with or expired.
 * @param {string} token
 * @returns {number|null}
 */
export function verifySession(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('base64url');

  const given = Buffer.from(signature);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data?.uid || !data?.exp) return null;
    if (Date.now() > data.exp) return null;
    return Number(data.uid);
  } catch {
    return null;
  }
}

/**
 * Write the session cookie (httpOnly so page scripts cannot read it).
 * @param {import('express').Response} res
 * @param {number} userId
 */
export function setSessionCookie(res, userId) {
  res.cookie(SESSION_COOKIE, signSession(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS,
  });
}

/**
 * Remove the session cookie.
 * @param {import('express').Response} res
 */
export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}
