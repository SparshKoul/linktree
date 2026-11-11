import crypto from 'crypto';

/**
 * Compare two secrets without leaking how much of them matched.
 * Both sides are hashed first, so different lengths are handled safely.
 */
export function safeEqual(a, b) {
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Turn a database error into something the owner can act on.
 * A rejected card type means the database is missing the migration.
 */
export function dbErrorHint(err) {
  const message = err?.message || '';
  if (message.includes('check constraint')) {
    return 'The database does not know this card type yet. Run server/src/db/migrations/001_allow_all_card_types.sql in the Supabase SQL editor.';
  }
  if (message.includes('row-level security') || message.includes('RLS')) {
    return 'The database refused the write because of its row level security rules.';
  }
  return null;
}