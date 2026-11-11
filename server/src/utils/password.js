import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt with salt rounds = 10.
 * @param {string} plainPassword
 * @returns {Promise<string>}
 */
export async function hashPassword(plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Password must be a valid string');
  }
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Synchronous hash for initial seed data
 * @param {string} plainPassword
 * @returns {string}
 */
export function hashPasswordSync(plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Password must be a valid string');
  }
  return bcrypt.hashSync(plainPassword, SALT_ROUNDS);
}

/**
 * Verify a plain text password against a stored bcrypt hash.
 * Also supports legacy plain text passwords for seamless zero-downtime migration.
 * @param {string} plainPassword
 * @param {string} storedPassword
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(plainPassword, storedPassword) {
  if (!plainPassword || !storedPassword) return false;

  // Check if storedPassword is a bcrypt hash ($2a$, $2b$, or $2y$)
  const isBcrypt = /^\$2[aby]\$\d+\$/.test(storedPassword);
  if (isBcrypt) {
    return bcrypt.compare(plainPassword, storedPassword);
  }

  // Graceful fallback for legacy unhashed entries
  return plainPassword === storedPassword;
}
