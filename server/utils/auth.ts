// server/utils/auth.js
import bcrypt from "bcrypt"
export async function hashPassword(pw: string) { return bcrypt.hash(pw, 10) }
export async function verifyPassword(plain: string, hash: string) { return bcrypt.compare(plain, hash) }
