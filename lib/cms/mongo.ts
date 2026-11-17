import 'server-only';
import { MongoClient, type Db } from 'mongodb';

// One connection, reused across requests (and across hot reloads in development).
const g = globalThis as typeof globalThis & { __mongo?: Promise<MongoClient> };

export const mongoConfigured = () => !!process.env.MONGODB_URI;

export async function db(): Promise<Db> {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  g.__mongo ??= new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000, maxPoolSize: 5 }).connect();
  try {
    return (await g.__mongo).db(process.env.MONGODB_DB || 'adyssey');
  } catch (e) {
    g.__mongo = undefined; // try again next time
    throw e;
  }
}
