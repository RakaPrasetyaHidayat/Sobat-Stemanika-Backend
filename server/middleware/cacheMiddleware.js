import { cacheGet, cacheSet } from '../config/redis.js';

export const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${req.method}:${req.originalUrl}`;

    try {
      const cachedData = await cacheGet(cacheKey);
      if (cachedData) {
        res.set('X-Cache', 'HIT');
        return res.json(cachedData);
      }
    } catch (error) {
      console.warn('Cache middleware error:', error);
    }

    res.set('X-Cache', 'MISS');

    const originalJson = res.json.bind(res);
    res.json = function(data) {
      cacheSet(cacheKey, data, ttl).catch(err => {
        console.warn('Cache set failed:', err);
      });
      return originalJson(data);
    };

    next();
  };
};

export const addCacheHeaders = (maxAge = 3600) => {
  return (_req, res, next) => {
    res.set({
      'Cache-Control': `public, max-age=${maxAge}`,
      'ETag': `"${Date.now()}"`
    });
    next();
  };
};

export const noCacheHeaders = (_req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  next();
};
