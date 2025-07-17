// server/utils/auth.js
const bcrypt = require('bcrypt');

async function hashPassword(pw){
  return bcrypt.hash(pw, 10);
}

async function verifyPassword(hash,pw){
  return bcrypt.compare(pw, hash);
}

module.exports = { hashPassword, verifyPassword };
