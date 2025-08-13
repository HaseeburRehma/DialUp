// server/utils/auth.js
import bcrypt from 'bcrypt';

/**
 * Hash a password with bcrypt
 * @param {string} pw - The plain text password
 * @returns {Promise<string>} The hashed password
 */
export async function hashPassword(pw) {
  return bcrypt.hash(pw, 10);
}

/**
 * Verify a plain password against a hash
 * @param {string} plain - The plain text password
 * @param {string} hash - The hashed password
 * @returns {Promise<boolean>} Whether the passwords match
 */
export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
