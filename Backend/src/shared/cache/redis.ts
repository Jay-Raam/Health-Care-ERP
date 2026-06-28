import Redis from 'ioredis';
import { config } from '../../config/index.js';
import { logger } from '../logs/logger.js';

let redisClient: Redis | null = null;
let isRedisConnected = false;
let attemptedLocalFallback = false;

export const initRedis = (): Redis => {
  if (redisClient) return redisClient;

  console.log("config", config)

    redisClient = new Redis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      username: config.REDIS_USERNAME,
      password: config.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: null, // Required by BullMQ
      retryStrategy(times) {
        // Slow down connection attempts after 5 retries to avoid overloading logs
        const delay = times > 5 ? 30000 : Math.min(times * 100, 3000);
        return delay;
      }
    });

  redisClient.on('connect', () => {
    isRedisConnected = true;
    logger.info('Connected to Redis server');
  });

  let lastLoggedError = '';
  redisClient.on('error', (err) => {
    isRedisConnected = false;
    
    // Deduplicate error logging to prevent log spam
    if (err.message !== lastLoggedError) {
      lastLoggedError = err.message;
      logger.error('Redis client error: ' + err.message);
      
      if (err.message.includes('ENOTFOUND')) {
        logger.warn('⚠️  WARNING: The configured Redis host domain is not found. The database instance may have expired or been deleted.');
      }
    }
  });

  redisClient.on('close', () => {
    isRedisConnected = false;
    logger.warn('Redis connection closed');
  });

  redisClient.connect().catch((err) => {
    logger.error('Redis failed to connect during initialization: ' + err.message);

    // If the configured host DNS cannot be resolved, attempt a safe localhost fallback once.
    if (!attemptedLocalFallback && /ENOTFOUND|getaddrinfo/i.test(err.message)) {
      attemptedLocalFallback = true;
      logger.warn('Attempting localhost Redis fallback (127.0.0.1:6379) due to DNS resolution error.');
      try {
        redisClient = new Redis({
          host: '127.0.0.1',
          port: 6379,
          lazyConnect: true,
          enableOfflineQueue: false,
          maxRetriesPerRequest: null,
          retryStrategy(times) {
            const delay = times > 5 ? 30000 : Math.min(times * 100, 3000);
            return delay;
          }
        });

        // Reattach handlers to the new client
        redisClient.on('connect', () => {
          isRedisConnected = true;
          logger.info('Connected to Redis server (localhost fallback)');
        });
        redisClient.on('error', (e) => {
          isRedisConnected = false;
          logger.error('Redis client error (fallback): ' + e.message);
        });
        redisClient.on('close', () => {
          isRedisConnected = false;
          logger.warn('Redis fallback connection closed');
        });

        redisClient.connect().catch((e) => {
          logger.error('Redis localhost fallback failed to connect: ' + e.message);
        });
      } catch (e: any) {
        logger.error('Failed to initialize local Redis fallback: ' + (e?.message || String(e)));
      }
    }
  });

  return redisClient;
};

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
};

export const cacheSet = async (key: string, value: any, ttlSeconds?: number): Promise<void> => {
  try {
    const client = getRedisClient();
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await client.set(key, stringValue, 'EX', ttlSeconds);
    } else {
      await client.set(key, stringValue);
    }
  } catch (err: any) {
    logger.warn(`Redis cacheSet error for key ${key}: ${err.message}`);
  }
};

export const cacheGet = async <T = any>(key: string): Promise<T | null> => {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  } catch (err: any) {
    logger.warn(`Redis cacheGet error for key ${key}: ${err.message}`);
    return null;
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (err: any) {
    logger.warn(`Redis cacheDel error for key ${key}: ${err.message}`);
  }
};

export const cacheInvalidatePattern = async (pattern: string): Promise<void> => {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
      logger.info(`Invalidated cache pattern: ${pattern} (${keys.length} keys)`);
    }
  } catch (err: any) {
    logger.warn(`Redis cacheInvalidatePattern error for pattern ${pattern}: ${err.message}`);
  }
};

export const checkRedisStatus = (): boolean => isRedisConnected;
