import { AsyncLocalStorage } from 'async_hooks';
import pino from 'pino';
import { config } from '../../config/index.js';

// AsyncLocalStorage to hold request-scoped metadata (e.g. requestId, userId)
export const logContext = new AsyncLocalStorage<{ requestId?: string; userId?: string }>();

const isDevelopment = config.NODE_ENV === 'development';

export const logger = pino({
  level: config.LOG_LEVEL,
  mixin() {
    const store = logContext.getStore();
    return store ? { requestId: store.requestId, userId: store.userId } : {};
  },
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard'
        }
      }
    : undefined
});

export const getLoggerContext = () => logContext.getStore() || {};
