import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { AuthenticationError, AuthorizationError } from '../errors/AppError.js';
import { logContext } from '../logs/logger.js';
import { UserRole } from '../../modules/auth/types.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    permissions: string[];
  };
}

// Helper: Check if token is blacklisted (imports dynamically to avoid early init issues)
const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const redis = await import('../cache/redis.js');
    const blacklisted = await redis.cacheGet(`bl:${token}`);
    return !!blacklisted;
  } catch {
    return false;
  }
};

// Express REST authentication middleware
export const authenticateExpress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authorization header missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new AuthenticationError('Token has been revoked');
    }

    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as any;
    req.user = decoded;

    // Bind user meta into pino logger thread-local storage context
    const currentStore = logContext.getStore();
    logContext.run(
      {
        requestId: currentStore?.requestId || crypto.randomUUID(),
        userId: decoded.id
      },
      () => {
        next();
      }
    );
  } catch (error) {
    next(new AuthenticationError('Invalid or expired authentication token'));
  }
};

// Express role guard
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError());
    }

    const hasRole = allowedRoles.includes(req.user.role) || req.user.role === UserRole.SUPER_ADMIN;
    if (!hasRole) {
      return next(new AuthorizationError('You do not have the required role to access this resource'));
    }

    next();
  };
};

// Express permission guard
export const requirePermission = (requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError());
    }

    const hasWildcard = req.user.permissions.includes('*');
    const hasAll = requiredPermissions.every((perm) => req.user?.permissions.includes(perm));

    if (!hasWildcard && !hasAll) {
      return next(new AuthorizationError('Access denied: insufficient permissions'));
    }

    next();
  };
};

// GraphQL guards
export const checkAuthGraphQL = (context: any) => {
  if (!context.user) {
    throw new AuthenticationError('Authentication required');
  }
  return context.user;
};

export const checkRoleGraphQL = (context: any, allowedRoles: UserRole[]) => {
  const user = checkAuthGraphQL(context);
  const hasRole = allowedRoles.includes(user.role) || user.role === UserRole.SUPER_ADMIN;
  if (!hasRole) {
    throw new AuthorizationError('Insufficient role privileges');
  }
  return user;
};

export const checkPermissionGraphQL = (context: any, requiredPermissions: string[]) => {
  const user = checkAuthGraphQL(context);
  const hasWildcard = user.permissions.includes('*');
  const hasAll = requiredPermissions.every((perm) => user.permissions.includes(perm));

  if (!hasWildcard && !hasAll) {
    throw new AuthorizationError('Access denied: insufficient permissions');
  }
  return user;
};
