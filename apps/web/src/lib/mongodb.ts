import { MongoClient, type Db } from "mongodb";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017";
const DB_NAME = "chronos_sentinel";

let cachedDb: Db | null = null;

/**
 * Returns a cached MongoDB database connection.
 * In serverless environments (Vercel), the cache persists
 * within a single warm function instance.
 */
export async function getDatabase(): Promise<Db> {
  if (cachedDb) return cachedDb;

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedDb = client.db(DB_NAME);

  return cachedDb;
}
