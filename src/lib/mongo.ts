// src/lib/mongo.ts
import { MongoClient, GridFSBucket } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voiceai'

let client: MongoClient | null = null
let bucket: GridFSBucket | null = null

export async function getBucket(): Promise<GridFSBucket> {
  try {
    if (!client) {
      console.log('[MongoDB] Connecting to:', MONGODB_URI.replace(/:[^:]*@/, ':***@'))
      client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 30000,
      })
      await client.connect()
      console.log('[MongoDB] ✅ Connected successfully')
    }

    if (!bucket) {
      const db = client.db()
      bucket = new GridFSBucket(db, { bucketName: 'uploads' })
      console.log('[MongoDB] ✅ GridFS bucket ready')
    }

    return bucket
  } catch (error: any) {
    console.error('[MongoDB] ❌ Connection failed:', error)
    // Reset so next attempt will try to reconnect
    client = null
    bucket = null
    throw new Error(`Database connection failed: ${error.message}`)
  }
}

// Optional: Add a function to test the connection
export async function testConnection(): Promise<boolean> {
  try {
    await getBucket()
    return true
  } catch {
    return false
  }
}


