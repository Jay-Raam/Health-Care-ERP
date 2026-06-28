import jwt from 'jsonwebtoken';
import { createPubSub } from 'graphql-yoga';
import { config } from '../config/index.js';
import { createDataLoaders, IDataLoaders } from './loaders/index.js';
import { logger } from '../shared/logs/logger.js';
import { UserRole } from '../modules/auth/types.js';

export const pubSub = createPubSub<{
  APPOINTMENT_BOOKED: [any];
  BILL_SETTLED: [any];
}>();

export interface GraphQLContext {
  user: {
    id: string;
    email: string;
    role: UserRole;
    permissions: string[];
  } | null;
  loaders: IDataLoaders;
  logger: typeof logger;
  deviceInfo: string;
  ipAddress: string;
  pubSub: typeof pubSub;
}

export const createContext = async ({ request }: { request: Request }): Promise<GraphQLContext> => {
  const authHeader = request.headers.get('authorization');
  let user = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as any;
      user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role as UserRole,
        permissions: decoded.permissions
      };
    } catch (err: any) {
      logger.debug('GraphQL request token invalid: ' + err.message);
    }
  }

  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';

  return {
    user,
    loaders: createDataLoaders(),
    logger,
    deviceInfo: userAgent,
    ipAddress,
    pubSub
  };
};
