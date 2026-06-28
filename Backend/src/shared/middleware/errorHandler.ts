import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { logger, logContext } from '../logs/logger.js';

export interface StandardResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error: {
    code: string;
    details: any;
  } | null;
  timestamp: string;
  requestId: string | null;
}

export const expressErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const store = logContext.getStore();
  const requestId = store?.requestId || null;

  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
    details = err.details;
  } else {
    logger.error({ err, path: req.path }, 'Unhandled error in Express routing');
  }

  const responseBody: StandardResponse<null> = {
    success: false,
    message,
    data: null,
    error: {
      code: errorCode,
      details
    },
    timestamp: new Date().toISOString(),
    requestId
  };

  res.status(statusCode).json(responseBody);
};

// Formatter helper for GraphQL Yoga error formatting
export const formatYogaError = (error: any): any => {
  const store = logContext.getStore();
  const requestId = store?.requestId || null;
  
  const originalError = error.originalError;
  let message = error.message;
  let errorCode = 'GRAPHQL_ERROR';
  let details: any = null;

  if (originalError instanceof AppError) {
    message = originalError.message;
    errorCode = originalError.errorCode;
    details = originalError.details;
  } else if (originalError) {
    logger.error({ err: originalError }, 'Unhandled GraphQL resolver error');
  }

  return {
    message,
    extensions: {
      code: errorCode,
      details,
      timestamp: new Date().toISOString(),
      requestId
    }
  };
};
