// lib/db/client.ts
import { MongoClient } from 'mongodb';

let clientPromise: Promise<MongoClient> | undefined;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI');
  return uri;
}

function getClientPromise() {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(getMongoUri());
    global._mongoClientPromise = client.connect();
  }
  return global._mongoClientPromise;
}

export async function connectDb() {
  const client = await getClientPromise();
  return client.db(); // optionally: .db(process.env.MONGODB_DB)
}
