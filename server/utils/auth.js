// server/utils/auth.js
const bcrypt = require('bcrypt');

async function hashPassword(pw){
  return bcrypt.hash(pw, 10);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, verifyPassword };
