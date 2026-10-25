// server/utils/db.js

import mongoose from 'mongoose';

let isConnected = false;

/**
 * Connect to MongoDB. Safe to call multiple times
 * @param {string} [uri] - Override process.env.MONGODB_URI
 */
export async function connectDB(uri = process.env.MONGODB_URI) {
  if (isConnected) return mongoose.connection;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Copy .env.example to .env and set MONGODB_URI.'
    );
  }

  mongoose.set('strictQuery', true);

  //
  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  };

  await mongoose.connect(uri, options);
  isConnected = true;

  mongoose.connection.on('error', (err) => {
    console.error('[db] connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[db] disconnected');
  });

  console.log(`[db] connected to ${mongoose.connection.name}`);
  return mongoose.connection;
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}

export default connectDB;
