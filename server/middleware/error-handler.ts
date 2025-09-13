import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Error classification types
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR'
}

// Error context interface
export interface ErrorContext {
  userId?: string;
  endpoint: string;
  requestId: string;
  timestamp: Date;
  method: string;
  userAgent?: string;
  ipAddress?: string;
  requestBody?: any;
  queryParams?: any;
  headers?: Record<string, string>;
}

// Custom error class
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    type: ErrorType,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Structured logging interface
interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  errorType?: ErrorType;
  statusCode?: number;
  endpoint?: string;
  method?: string;
  stack?: string;
  metadata?: Record<string, any>;
}

// Logger class for structured logging
class StructuredLogger {
  private logLevel: string = process.env.LOG_LEVEL || 'info';
  
  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
  }

  private formatLog(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      timestamp: new Date().toISOString()
    });
  }

  debug(message: string, metadata?: Record<string, any>, requestId?: string): void {
    if (!this.shouldLog('debug')) return;
    
    const entry: LogEntry = {
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      requestId,
      metadata
    };
    console.debug(this.formatLog(entry));
  }

  info(message: string, metadata?: Record<string, any>, requestId?: string): void {
    if (!this.shouldLog('info')) return;
    
    const entry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      requestId,
      metadata
    };
    console.info(this.formatLog(entry));
  }

  warn(message: string, metadata?: Record<string, any>, requestId?: string): void {
    if (!this.shouldLog('warn')) return;
    
    const entry: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      requestId,
      metadata
    };
    console.warn(this.formatLog(entry));
  }

  error(message: string, error?: Error, context?: ErrorContext): void {
    if (!this.shouldLog('error')) return;
    
    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      requestId: context?.requestId,
      userId: context?.userId,
      errorType: error instanceof AppError ? error.type : ErrorType.SYSTEM_ERROR,
      statusCode: error instanceof AppError ? error.statusCode : 500,
      endpoint: context?.endpoint,
      method: context?.method,
      stack: error?.stack,
      metadata: {
        userAgent: context?.userAgent,
        ipAddress: context?.ipAddress,
        ...(error instanceof AppError ? error.context : {})
      }
    };
    console.error(this.formatLog(entry));
  }
}

export const logger = new StructuredLogger();

// User-friendly error messages mapping
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.VALIDATION_ERROR]: 'The provided data is invalid. Please check your input and try again.',
  [ErrorType.BUSINESS_LOGIC_ERROR]: 'This operation cannot be completed due to business rules.',
  [ErrorType.DATABASE_ERROR]: 'A database error occurred. Please try again later.',
  [ErrorType.EXTERNAL_SERVICE_ERROR]: 'An external service is currently unavailable. Please try again later.',
  [ErrorType.SYSTEM_ERROR]: 'An unexpected error occurred. Please try again later.',
  [ErrorType.AUTHENTICATION_ERROR]: 'Authentication failed. Please check your credentials.',
  [ErrorType.AUTHORIZATION_ERROR]: 'You do not have permission to perform this action.',
  [ErrorType.NOT_FOUND_ERROR]: 'The requested resource was not found.',
  [ErrorType.RATE_LIMIT_ERROR]: 'Too many requests. Please wait before trying again.'
};

// Error classification helper
export function classifyError(error: Error): { type: ErrorType; statusCode: number } {
  // If it's already an AppError, use its classification
  if (error instanceof AppError) {
    return { type: error.type, statusCode: error.statusCode };
  }

  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';

  // Database errors
  if (message.includes('database') || message.includes('sql') || 
      message.includes('connection') || stack.includes('drizzle')) {
    return { type: ErrorType.DATABASE_ERROR, statusCode: 500 };
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid') ||
      message.includes('required') || message.includes('zod')) {
    return { type: ErrorType.VALIDATION_ERROR, statusCode: 400 };
  }

  // Not found errors
  if (message.includes('not found') || message.includes('404')) {
    return { type: ErrorType.NOT_FOUND_ERROR, statusCode: 404 };
  }

  // Authentication/Authorization errors
  if (message.includes('unauthorized') || message.includes('forbidden') ||
      message.includes('access denied')) {
    return { type: ErrorType.AUTHORIZATION_ERROR, statusCode: 403 };
  }

  // Rate limiting errors
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return { type: ErrorType.RATE_LIMIT_ERROR, statusCode: 429 };
  }

  // External service errors
  if (message.includes('fetch') || message.includes('network') ||
      message.includes('timeout') || message.includes('service unavailable')) {
    return { type: ErrorType.EXTERNAL_SERVICE_ERROR, statusCode: 503 };
  }

  // Default to system error
  return { type: ErrorType.SYSTEM_ERROR, statusCode: 500 };
}

// Generate request ID
export function generateRequestId(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Request ID middleware
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

// Error context builder
function buildErrorContext(req: Request, error: Error): ErrorContext {
  return {
    userId: req.user?.id, // Assuming user is attached to request if authenticated
    endpoint: req.originalUrl || req.url,
    requestId: req.requestId || generateRequestId(),
    timestamp: new Date(),
    method: req.method,
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip || req.connection.remoteAddress,
    requestBody: req.method !== 'GET' ? req.body : undefined,
    queryParams: Object.keys(req.query).length > 0 ? req.query : undefined,
    headers: {
      'content-type': req.headers['content-type'] || '',
      'accept': req.headers['accept'] || '',
      'authorization': req.headers['authorization'] ? '[REDACTED]' : ''
    }
  };
}

// Main error handler middleware
export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction): void {
  // Build error context
  const context = buildErrorContext(req, error);
  
  // Classify the error
  const { type, statusCode } = classifyError(error);
  
  // Log the error with full context
  logger.error(`Error in ${context.method} ${context.endpoint}`, error, context);
  
  // Don't expose internal errors in production
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Prepare error response
  const errorResponse: any = {
    success: false,
    error: {
      code: type,
      message: isProduction ? ERROR_MESSAGES[type] : error.message,
      timestamp: context.timestamp.toISOString(),
      requestId: context.requestId
    }
  };

  // Add additional details in development
  if (isDevelopment) {
    errorResponse.error.details = {
      originalMessage: error.message,
      stack: error.stack,
      context: error instanceof AppError ? error.context : undefined
    };
  }

  // Add validation details for validation errors
  if (type === ErrorType.VALIDATION_ERROR && error instanceof AppError && error.context) {
    errorResponse.error.validationErrors = error.context.validationErrors;
  }

  // Set appropriate status code and send response
  res.status(statusCode).json(errorResponse);
}

// Async error wrapper for route handlers
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler for unmatched routes
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    ErrorType.NOT_FOUND_ERROR,
    404,
    true,
    { route: req.originalUrl, method: req.method }
  );
  next(error);
}

// Validation error helper
export function createValidationError(message: string, validationErrors?: any[]): AppError {
  return new AppError(
    message,
    ErrorType.VALIDATION_ERROR,
    400,
    true,
    { validationErrors }
  );
}

// Business logic error helper
export function createBusinessLogicError(message: string, context?: Record<string, any>): AppError {
  return new AppError(
    message,
    ErrorType.BUSINESS_LOGIC_ERROR,
    400,
    true,
    context
  );
}

// Database error helper
export function createDatabaseError(message: string, originalError?: Error): AppError {
  return new AppError(
    message,
    ErrorType.DATABASE_ERROR,
    500,
    true,
    { originalError: originalError?.message }
  );
}

// External service error helper
export function createExternalServiceError(message: string, service?: string): AppError {
  return new AppError(
    message,
    ErrorType.EXTERNAL_SERVICE_ERROR,
    503,
    true,
    { service }
  );
}

// Extend Express Request interface to include requestId and user
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: { id: string; [key: string]: any };
    }
  }
}