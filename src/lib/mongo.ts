// src/lib/mongo.ts
import { MongoClient, GridFSBucket } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error("❌ MONGODB_URI is not set in environment variables")
}

let client: MongoClient
let bucket: GridFSBucket

export async function getBucket() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
    console.log("✅ Connected to MongoDB")
  }

  const db = client.db(process.env.MONGODB_DB || "voiceai")
  if (!bucket) {
    bucket = new GridFSBucket(db, { bucketName: "uploads" })
  }

  return bucket
}
