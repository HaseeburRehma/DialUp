const mongoose = require('mongoose');

let cached = global._mongo;
if (!cached) {
  cached = global._mongo = { conn: null, promise: null };
}

async function connect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('Missing MONGODB_URI environment variable');

    // Sanitize URI for logging (hide password)
    const sanitizedUri = uri.replace(/:([^:@]+)@/, ':***@');
    console.log('→ MONGODB_URI is', sanitizedUri);

    // Remove deprecated options - not needed in MongoDB driver 4.0+
    cached.promise = mongoose.connect(uri).then(m => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

const db = mongoose.connection;

module.exports = { connect, db };