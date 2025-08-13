import mongoose from 'mongoose'

let cached = global._mongo
if (!cached) {
  cached = global._mongo = { conn: null, promise: null }
}

export async function connect() {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error('Missing MONGODB_URI environment variable')
    console.log('→ MONGODB_URI is', uri)
    cached.promise = mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then(m => m)
  }
  cached.conn = await cached.promise
  return cached.conn
}

export const db = mongoose.connection
