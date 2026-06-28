import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient, checkRedisStatus } from '../cache/redis.js';
import { AppError } from '../errors/AppError.js';
import { config } from '../../config/index.js';

const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
  prefix: string;
}) => {
  // Bypass rate limiting during test executions to avoid Redis Lua mock script evaluation issues
  if (config.NODE_ENV === 'test') {
    return (req: any, res: any, next: any) => next();
  }

  const redisClient = getRedisClient();

  const limiter = rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      // @ts-expect-error - ioredis type mismatch with rate-limit-redis client type definition, but compatible at runtime
      sendCommand: async (...args: string[]) => {
        try {
          if (!checkRedisStatus()) {
            return '0000000000000000000000000000000000000000';
          }
          return await redisClient.call(args[0], ...args.slice(1));
        } catch (err) {
          return '0000000000000000000000000000000000000000';
        }
      },
      prefix: `rl:${options.prefix}:`
    }),
    handler: (req, res, next) => {
      next(new AppError(options.message, 429, 'RATE_LIMIT_ERROR'));
    }
  });

  // Fail-open: bypass rate limiting if Redis is down
  return (req: any, res: any, next: any) => {
    if (!checkRedisStatus()) {
      return next();
    }
    return limiter(req, res, next);
  };
};

export const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Too many requests from this IP, please try again later.',
  prefix: 'global'
});

export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again after 15 minutes.',
  prefix: 'login'
});

export const otpLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: 'Too many OTP requests. Please wait a few minutes before trying again.',
  prefix: 'otp'
});

export const graphqlLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: 'Rate limit exceeded for GraphQL operations. Please slow down.',
  prefix: 'graphql'
});

export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Upload limit reached. You can upload 20 files per hour.',
  prefix: 'upload'
});
