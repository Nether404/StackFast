import { Request, Response, NextFunction } from "express";
import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import { logger } from "./error-handler";
import { logSecurityEvent } from "./audit";

// Rate limit store interface
interface RateLimitStore {
  incr(key: string): Promise<{ totalHits: number; timeToExpire: number }>;
  decrement(key: string): Promise<void>;
  resetKey(key: string): Promise<void>;
}

// In-memory rate limit store (in production, use Redis)
class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  
  async incr(key: string): Promise<{ totalHits: number; timeToExpire: number }> {
    const now = Date.now();
    const existing = this.store.get(key);
    
    if (!existing || now > existing.resetTime) {
      // Create new entry or reset expired entry
      this.store.set(key, { count: 1, resetTime: now + (15 * 60 * 1000) }); // 15 minutes
      return { totalHits: 1, timeToExpire: 15 * 60 * 1000 };
    }
    
    existing.count++;
    this.store.set(key, existing);
    
    return { 
      totalHits: existing.count, 
      timeToExpire: existing.resetTime - now 
    };
  }
  
  async decrement(key: string): Promise<void> {
    const existing = this.store.get(key);
    if (existing && existing.count > 0) {
      existing.count--;
      this.store.set(key, existing);
    }
  }
  
  async resetKey(key: string): Promise<void> {
    this.store.delete(key);
  }
  
  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

const rateLimitStore = new MemoryRateLimitStore();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  rateLimitStore.cleanup();
}, 5 * 60 * 1000);

// Key generators for different rate limiting strategies
export const keyGenerators = {
  // IP-based rate limiting (use default for IPv6 compatibility)
  byIP: undefined, // Use express-rate-limit default
  
  // User-based rate limiting (requires authentication)
  byUser: (req: Request): string => {
    const userId = (req as any).userId || 'anonymous';
    return `user:${userId}`;
  },
  
  // Combined IP and user rate limiting
  byIPAndUser: (req: Request): string => {
    const userId = (req as any).userId || 'anonymous';
    return `user:${userId}`;
  },
  
  // Endpoint-specific rate limiting
  byEndpoint: (req: Request): string => {
    const endpoint = `${req.method}:${req.route?.path || req.path}`;
    return `endpoint:${endpoint}`;
  }
};

// Rate limit configurations
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (req: Request, res: Response) => void;
}

// Create rate limiter with custom configuration
export function createRateLimit(config: RateLimitConfig): RateLimitRequestHandler {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: config.message,
        retryAfter: Math.ceil(config.windowMs / 1000 / 60) + ' minutes'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: config.keyGenerator || keyGenerators.byIP,
    skipSuccessfulRequests: config.skipSuccessfulRequests || false,
    skipFailedRequests: config.skipFailedRequests || false,
    handler: (req: Request, res: Response) => {
      // Log rate limit exceeded event
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'],
        limit: config.max,
        window: config.windowMs
      }, req.requestId);
      
      // Log security event
      logSecurityEvent(req, 'RATE_LIMIT_EXCEEDED', {
        limit: config.max,
        window: config.windowMs,
        keyType: config.keyGenerator?.name || 'byIP'
      });
      
      // Call custom handler if provided
      if (config.onLimitReached) {
        config.onLimitReached(req, res);
      }
      
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: config.message,
          retryAfter: Math.ceil(config.windowMs / 1000 / 60) + ' minutes'
        }
      });
    }
  });
}

// Predefined rate limiters
export const rateLimiters = {
  // General API rate limit (100 requests per 15 minutes per IP)
  general: createRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    keyGenerator: keyGenerators.byIP
  }),
  
  // Strict rate limit for write operations (20 requests per 15 minutes per IP)
  strict: createRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many write requests from this IP, please try again later.',
    keyGenerator: keyGenerators.byIP,
    skipSuccessfulRequests: false
  }),
  
  // Lenient rate limit for read operations (200 requests per 15 minutes per IP)
  lenient: createRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: 'Too many read requests from this IP, please try again later.',
    keyGenerator: keyGenerators.byIP,
    skipFailedRequests: true
  }),
  
  // Very strict rate limit for sensitive operations (5 requests per hour per IP)
  sensitive: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: 'Too many sensitive operations from this IP, please try again later.',
    keyGenerator: keyGenerators.byIPAndUser
  }),
  
  // Search rate limit (50 searches per 15 minutes per IP)
  search: createRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many search requests from this IP, please try again later.',
    keyGenerator: keyGenerators.byIP,
    skipFailedRequests: true
  }),
  
  // File upload rate limit (10 uploads per hour per IP)
  upload: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: 'Too many file uploads from this IP, please try again later.',
    keyGenerator: keyGenerators.byIP
  })
};

// Dynamic rate limiting based on endpoint patterns
export function dynamicRateLimit(req: Request, res: Response, next: NextFunction) {
  const path = req.path.toLowerCase();
  const method = req.method.toUpperCase();
  
  // Determine appropriate rate limiter based on endpoint
  let rateLimiter: RateLimitRequestHandler;
  
  if (path.includes('/search') || path.includes('/recommend')) {
    rateLimiter = rateLimiters.search;
  } else if (path.includes('/upload') || path.includes('/import')) {
    rateLimiter = rateLimiters.upload;
  } else if (path.includes('/admin') || path.includes('/seed') || path.includes('/clear')) {
    rateLimiter = rateLimiters.sensitive;
  } else if (method === 'GET') {
    rateLimiter = rateLimiters.lenient;
  } else if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    rateLimiter = rateLimiters.strict;
  } else {
    rateLimiter = rateLimiters.general;
  }
  
  rateLimiter(req, res, next);
}

// Whitelist middleware to bypass rate limiting for trusted IPs
export function rateLimitWhitelist(trustedIPs: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || '';
    
    // Allow localhost in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    const localhostIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    
    if (isDevelopment && localhostIPs.includes(clientIP)) {
      return next();
    }
    
    // Check if IP is in whitelist
    if (trustedIPs.includes(clientIP)) {
      logger.debug('Rate limit bypassed for trusted IP', {
        ip: clientIP,
        path: req.path
      }, req.requestId);
      return next();
    }
    
    // Apply dynamic rate limiting
    dynamicRateLimit(req, res, next);
  };
}

// Rate limit status endpoint
export function getRateLimitStatus(req: Request): Promise<{
  ip: string;
  limits: Array<{
    type: string;
    current: number;
    max: number;
    resetTime: Date;
  }>;
}> {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  // This is a simplified version - in production, you'd query the actual rate limit store
  return Promise.resolve({
    ip,
    limits: [
      {
        type: 'general',
        current: 0, // Would be fetched from store
        max: 100,
        resetTime: new Date(Date.now() + 15 * 60 * 1000)
      }
    ]
  });
}

// Middleware to add rate limit headers to responses
export function rateLimitHeaders(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);
  
  res.json = function(body: any) {
    // Add custom rate limit headers
    res.setHeader('X-RateLimit-Policy', 'dynamic');
    res.setHeader('X-RateLimit-IP', req.ip || 'unknown');
    
    return originalJson(body);
  };
  
  next();
}