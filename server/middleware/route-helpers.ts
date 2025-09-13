import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { 
  AppError, 
  ErrorType, 
  createValidationError, 
  createDatabaseError,
  createBusinessLogicError,
  asyncHandler,
  logger
} from "./error-handler";

// Enhanced validation middleware factory with security features
export function validateRequest(schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Log validation attempt for security monitoring
      logger.debug('Validating request', {
        method: req.method,
        path: req.path,
        hasBody: !!req.body,
        hasQuery: Object.keys(req.query).length > 0,
        hasParams: Object.keys(req.params).length > 0
      }, req.requestId);

      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: (err as any).received
        }));
        
        // Log validation failure for security monitoring
        logger.warn('Request validation failed', {
          method: req.method,
          path: req.path,
          errors: validationErrors,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }, req.requestId);
        
        const validationError = createValidationError(
          'Request validation failed',
          validationErrors
        );
        next(validationError);
      } else {
        logger.error('Unexpected validation error', error as Error, req.requestId);
        next(error);
      }
    }
  };
}

// Database operation wrapper
export function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  return operation().catch(error => {
    logger.error(`Database operation failed: ${context || 'Unknown operation'}`, error);
    
    // Check for specific database errors
    if (error.message?.includes('UNIQUE constraint')) {
      throw createValidationError('A record with this data already exists');
    }
    
    if (error.message?.includes('FOREIGN KEY constraint')) {
      throw createValidationError('Referenced record does not exist');
    }
    
    if (error.message?.includes('NOT NULL constraint')) {
      throw createValidationError('Required field is missing');
    }
    
    // Generic database error
    throw createDatabaseError(
      context ? `Failed to ${context}` : 'Database operation failed',
      error
    );
  });
}

// Business logic wrapper
export function withBusinessLogicValidation<T>(
  operation: () => Promise<T> | T,
  validationRules: Array<{
    condition: boolean;
    message: string;
    context?: Record<string, any>;
  }>
): Promise<T> {
  return Promise.resolve().then(() => {
    // Check all validation rules
    for (const rule of validationRules) {
      if (rule.condition) {
        throw createBusinessLogicError(rule.message, rule.context);
      }
    }
    
    return Promise.resolve(operation());
  });
}

// Success response helper
export function sendSuccess(
  res: Response, 
  data: any, 
  message?: string, 
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}

// Paginated response helper
export function sendPaginatedSuccess(
  res: Response,
  data: any[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  message?: string
): void {
  res.json({
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString()
  });
}

// Resource not found helper
export function throwNotFound(resource: string, identifier?: string): never {
  throw new AppError(
    `${resource}${identifier ? ` with ID '${identifier}'` : ''} not found`,
    ErrorType.NOT_FOUND_ERROR,
    404,
    true,
    { resource, identifier }
  );
}

// Conditional resource not found
export function throwNotFoundIf(condition: boolean, resource: string, identifier?: string): void {
  if (condition) {
    throwNotFound(resource, identifier);
  }
}

// Rate limiting helper (placeholder for future implementation)
export function checkRateLimit(req: Request, limit: number, windowMs: number): void {
  // This would integrate with a rate limiting service
  // For now, just a placeholder that could be implemented later
  const userKey = req.ip || 'anonymous';
  logger.debug(`Rate limit check for ${userKey}: ${limit} requests per ${windowMs}ms`);
}

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  // Log request start
  logger.info(`${req.method} ${req.originalUrl} - Request started`, {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  }, req.requestId);
  
  // Override res.json to log response
  const originalJson = res.json.bind(res);
  res.json = function(body: any) {
    const duration = Date.now() - start;
    
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} in ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      responseSize: JSON.stringify(body).length
    }, req.requestId);
    
    return originalJson(body);
  };
  
  next();
}

// Health check helper
export function createHealthCheck(dependencies: Array<{
  name: string;
  check: () => Promise<boolean>;
}>) {
  return asyncHandler(async (req: Request, res: Response) => {
    const results = await Promise.allSettled(
      dependencies.map(async dep => ({
        name: dep.name,
        status: await dep.check() ? 'healthy' : 'unhealthy'
      }))
    );
    
    const healthChecks = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          name: dependencies[index].name,
          status: 'error',
          error: result.reason?.message || 'Unknown error'
        };
      }
    });
    
    const allHealthy = healthChecks.every(check => check.status === 'healthy');
    
    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: healthChecks
    });
  });
}

// Export commonly used patterns
export {
  asyncHandler,
  AppError,
  ErrorType,
  createValidationError,
  createDatabaseError,
  createBusinessLogicError,
  logger
};