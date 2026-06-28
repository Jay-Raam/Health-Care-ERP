export class AppError extends Error {
  public readonly statusCode: number;
  public readonly success: boolean;
  public readonly errorCode: string;
  public readonly details: any;

  constructor(message: string, statusCode = 500, errorCode = 'INTERNAL_SERVER_ERROR', details: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: any = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Not authorized to access this resource') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', details: any = null) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}
