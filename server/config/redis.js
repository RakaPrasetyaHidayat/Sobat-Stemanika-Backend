import { createClient } from 'redis';

let redisClient = null;

export async function initializeRedis() {
  if (redisClient) return redisClient;

  try {
    redisClient = createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.warn('Redis connection refused. Caching disabled.');
          return new Error('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Redis retry time exhausted');
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    redisClient.on('error', (err) => {
      console.warn('Redis error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.warn('Redis initialization failed:', error.message);
    console.warn('Caching will be disabled.');
    return null;
  }
}

export function getRedisClient() {
  return redisClient;
}

export async function cacheGet(key) {
  if (!redisClient) return null;
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.warn('Redis get error:', error.message);
    return null;
  }
}

export async function cacheSet(key, value, ttl = 300) {
  if (!redisClient) return false;
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('Redis set error:', error.message);
    return false;
  }
}

export async function cacheDel(key) {
  if (!redisClient) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.warn('Redis del error:', error.message);
    return false;
  }
}

export async function cacheFlush() {
  if (!redisClient) return false;
  try {
    await redisClient.flushDb();
    return true;
  } catch (error) {
    console.warn('Redis flush error:', error.message);
    return false;
  }
}
