import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);
export const db = client.db(); // default DB

export async function connectDb() {
  if (!client.isConnected?.()) {
    await client.connect();
  }
}
