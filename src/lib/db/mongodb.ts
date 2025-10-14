// lib/db/mongodb.ts
import mongoose from 'mongoose';

let isConnected = false;

export const connectToDatabase = async () => {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI');

  await mongoose.connect(uri);
  isConnected = true;
};
