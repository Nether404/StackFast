import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { z } from "zod";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { 
  AppError, 
  ErrorType, 
  createValidationError,
  logger
} from "./error-handler";

// Create DOMPurify instance for server-side use
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

// Enhanced input validation middleware with sanitization
export function validateAndSanitizeRequest(schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize string inputs to prevent XSS
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
      }
      
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
      }
      
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params);
      }

      // Validate with Zod schemas
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
        
        logger.warn('Input validation failed', {
          errors: validationErrors,
          path: req.path,
          method: req.method
        }, req.requestId);
        
        const validationError = createValidationError(
          'Request validation failed',
          validationErrors
        );
        next(validationError);
      } else {
        next(error);
      }
    }
  };
}

// Sanitize object recursively
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return purify.sanitize(obj, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true 
    });
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Parameter validation schemas
export const paramSchemas = {
  id: z.object({
    id: z.string().uuid('Invalid ID format')
  }),
  
  toolId: z.object({
    id: z.string().uuid('Invalid tool ID format')
  }),
  
  compatibilityIds: z.object({
    toolOneId: z.string().uuid('Invalid tool one ID format'),
    toolTwoId: z.string().uuid('Invalid tool two ID format')
  }),
  
  pagination: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').transform(Number).optional(),
    offset: z.string().regex(/^\d+$/, 'Offset must be a number').transform(Number).optional()
  })
};

// Query validation schemas
export const querySchemas = {
  search: z.object({
    q: z.string().min(1).max(100).optional(),
    query: z.string().min(1).max(100).optional(),
    category: z.string().max(50).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    offset: z.string().regex(/^\d+$/).transform(Number).optional()
  }),
  
  toolSearch: z.object({
    query: z.string().min(1).max(100).optional(),
    q: z.string().min(1).max(100).optional(),
    category: z.string().max(50).optional(),
    minPopularity: z.string().regex(/^\d*\.?\d+$/).transform(Number).optional(),
    minMaturity: z.string().regex(/^\d*\.?\d+$/).transform(Number).optional(),
    min_popularity: z.string().regex(/^\d*\.?\d+$/).transform(Number).optional(),
    min_maturity: z.string().regex(/^\d*\.?\d+$/).transform(Number).optional(),
    hasFreeTier: z.string().optional(),
    frameworks: z.string().optional(),
    languages: z.string().optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    summary: z.string().optional()
  })
};

// Rate limiting configurations
export const rateLimitConfigs = {
  // General API rate limit
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent']
      }, req.requestId);
      
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later.',
          retryAfter: '15 minutes'
        }
      });
    }
  }),

  // Strict rate limit for write operations
  strict: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 write requests per windowMs
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many write requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'GET', // Only apply to non-GET requests
    handler: (req: Request, res: Response) => {
      logger.warn('Strict rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent']
      }, req.requestId);
      
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many write requests from this IP, please try again later.',
          retryAfter: '15 minutes'
        }
      });
    }
  }),

  // Lenient rate limit for read operations
  lenient: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 read requests per windowMs
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many read requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method !== 'GET', // Only apply to GET requests
    handler: (req: Request, res: Response) => {
      logger.warn('Read rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent']
      }, req.requestId);
      
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many read requests from this IP, please try again later.',
          retryAfter: '15 minutes'
        }
      });
    }
  })
};

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: process.env.NODE_ENV === 'development' 
        ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://replit.com"] 
        : ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"], // Allow WebSocket for Vite HMR
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API compatibility
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Request size limiting middleware
export function requestSizeLimit(maxSize: string = '10mb') {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength, 10);
      const maxSizeInBytes = parseSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        logger.warn('Request size limit exceeded', {
          contentLength: sizeInBytes,
          maxSize: maxSizeInBytes,
          path: req.path,
          method: req.method,
          ip: req.ip
        }, req.requestId);
        
        return res.status(413).json({
          success: false,
          error: {
            code: 'REQUEST_TOO_LARGE',
            message: `Request size exceeds limit of ${maxSize}`,
            maxSize
          }
        });
      }
    }
    
    next();
  };
}

// Helper function to parse size strings like '10mb', '1gb', etc.
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)$/);
  if (!match) {
    throw new Error(`Invalid size format: ${size}`);
  }
  
  const [, value, unit] = match;
  return parseFloat(value) * units[unit];
}

// Audit logging middleware
export function auditLogger(req: Request, res: Response, next: NextFunction) {
  // Only log write operations and sensitive endpoints
  const shouldLog = req.method !== 'GET' || 
                   req.path.includes('/admin') || 
                   req.path.includes('/auth');
  
  if (shouldLog) {
    const auditData = {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
      body: req.method !== 'GET' ? sanitizeForLogging(req.body) : undefined,
      query: Object.keys(req.query).length > 0 ? req.query : undefined
    };
    
    logger.info('Audit log', auditData, req.requestId);
  }
  
  next();
}

// Sanitize sensitive data for logging
function sanitizeForLogging(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
  const sanitized = { ...obj };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

// IP whitelist middleware (for admin endpoints)
export function ipWhitelist(allowedIPs: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || '';
    
    // Allow localhost in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    const localhostIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    
    if (isDevelopment && localhostIPs.includes(clientIP)) {
      return next();
    }
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      logger.warn('IP access denied', {
        ip: clientIP,
        path: req.path,
        method: req.method
      }, req.requestId);
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'IP_ACCESS_DENIED',
          message: 'Access denied from this IP address'
        }
      });
    }
    
    next();
  };
}