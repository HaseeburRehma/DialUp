// src/lib/mongo.ts
import { MongoClient, GridFSBucket } from 'mongodb'
import { logger, logError } from './logger'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voiceai'

let client: MongoClient | null = null
let bucket: GridFSBucket | null = null
let isConnecting = false

async function connectWithRetry(maxRetries = 3): Promise<MongoClient> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`[MongoDB] Connection attempt ${attempt}/${maxRetries}`)

      const newClient = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 15000,  // Increased from 10s
        connectTimeoutMS: 15000,           // Increased from 10s
        socketTimeoutMS: 45000,            // Increased from 30s
        maxPoolSize: 10,                   // Connection pooling
        minPoolSize: 2,
        maxIdleTimeMS: 60000,
        retryWrites: true,
        retryReads: true,
      })

      await newClient.connect()

      // Test the connection
      await newClient.db().admin().ping()

      logger.info('[MongoDB] ✅ Connected and verified successfully')
      return newClient

    } catch (error: any) {
      logError(`[MongoDB] Connection attempt ${attempt} failed`, error)

      if (attempt === maxRetries) {
        throw error
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
      logger.info(`[MongoDB] Retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw new Error('Max connection retries exceeded')
}

export async function getBucket(): Promise<GridFSBucket> {
  try {
    // If already connecting, wait for it
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Check if existing client is still connected
    if (client) {
      try {
        await client.db().admin().ping()
        logger.info('[MongoDB] Using existing connection')
      } catch (pingError) {
        logger.info('[MongoDB] Existing connection failed ping, reconnecting...')
        await client.close().catch(() => { })
        client = null
        bucket = null
      }
    }

    if (!client) {
      isConnecting = true
      try {
        logger.info('[MongoDB] Connecting to:', MONGODB_URI.replace(/:[^:]*@/, ':***@'))
        client = await connectWithRetry()
      } finally {
        isConnecting = false
      }
    }

    if (!bucket) {
      const db = client.db()
      bucket = new GridFSBucket(db, { bucketName: 'uploads' })
      logger.info('[MongoDB] ✅ GridFS bucket ready')
    }

    return bucket
  } catch (error: any) {
    logError('[MongoDB] Connection failed after retries', error)
    // Reset so next attempt will try to reconnect
    client = null
    bucket = null
    isConnecting = false
    throw new Error(`Database connection failed: ${error.message}`)
  }
}

// Optional: Add a function to test the connection
export async function testConnection(): Promise<boolean> {
  try {
    await getBucket()
    return true
  } catch (error) {
    logError('[MongoDB] Connection test failed', error)
    return false
  }
}

// Graceful shutdown
export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    bucket = null
    logger.info('[MongoDB] Connection closed')
  }
}
