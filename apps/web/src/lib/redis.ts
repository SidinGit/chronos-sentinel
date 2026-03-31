import Redis from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is not defined.');
}

// Ensure in dev mode we don't open 100 connections on hot-reload
const globalForRedis = global as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
  });

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
