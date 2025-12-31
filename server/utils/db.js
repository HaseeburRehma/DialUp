const mongoose = require('mongoose');

let cached = global._mongo;
if (!cached) {
  cached = global._mongo = { conn: null, promise: null };
}

async function connect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      throw new Error('Missing MONGODB_URI environment variable');
    }

    // Sanitize URI for logging (hide password)
    const sanitizedUri = uri.replace(/:([^:@]+)@/, ':***@');
    console.log('→ Attempting to connect to MongoDB:', sanitizedUri);

    const options = {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of default 30s
      socketTimeoutMS: 45000,         // Close sockets after 45s of inactivity
      family: 4,                      // Force IPv4 (fixes many Windows SSL alert 80 issues)
      retryWrites: true,
      retryReads: true,
    };

    cached.promise = mongoose.connect(uri, options)
      .then(m => {
        console.log('✅ MongoDB connection established successfully');
        return m;
      })
      .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        if (err.message.includes('alert number 80')) {
          console.error('💡 TIP: SSL alert 80 often means your current IP is not whitelisted in MongoDB Atlas or there is a TLS negotiation issue.');
        }
        cached.promise = null; // Reset promise on failure so it can be retried
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}

const db = mongoose.connection;

module.exports = { connect, db };