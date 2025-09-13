import type { Request, Response, NextFunction } from "express";
import { logger } from "./error-handler";
import { storage } from "../storage";
import * as os from "os";
import * as process from "process";

// Development environment check
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Request/Response logging middleware for API debugging
 * Only active in development mode
 */
export function requestResponseLogger(req: Request, res: Response, next: NextFunction) {
  if (!isDevelopment) {
    return next();
  }

  const startTime = Date.now();
  const requestId = req.requestId || 'unknown';
  
  // Log incoming request
  logger.debug('Incoming Request', {
    requestId,
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: req.body,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Capture response data
  const originalSend = res.send;
  const originalJson = res.json;
  let responseBody: any;

  res.send = function(body) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  res.json = function(body) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.debug('Outgoing Response', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      headers: res.getHeaders(),
      body: responseBody,
      contentLength: res.get('Content-Length')
    });
  });

  next();
}

/**
 * System health check data
 */
export async function getSystemHealth() {
  const startTime = Date.now();
  
  try {
    // Test database connection
    const dbHealthStart = Date.now();
    await storage.getToolCategories(); // Simple query to test DB
    const dbHealth = {
      status: 'healthy',
      responseTime: Date.now() - dbHealthStart
    };

    // System metrics
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          process: {
            rss: memoryUsage.rss,
            heapTotal: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
            external: memoryUsage.external
          }
        },
        cpu: {
          usage: cpuUsage,
          loadAverage: os.loadavg(),
          cores: os.cpus().length
        }
      },
      database: dbHealth,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        isDevelopment
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime(),
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Debug information collector
 */
export async function getDebugInfo() {
  if (!isDevelopment) {
    return { error: 'Debug info only available in development mode' };
  }

  try {
    const [tools, categories, compatibilities] = await Promise.all([
      storage.getToolsWithAllCategories(),
      storage.getToolCategories(),
      storage.getCompatibilities()
    ]);

    return {
      timestamp: new Date().toISOString(),
      database: {
        tools: {
          count: tools.length,
          categories: Array.from(new Set(tools.map(t => t.categoryId))).length,
          withDescriptions: tools.filter(t => t.description && t.description.length > 0).length,
          withFeatures: tools.filter(t => t.features && t.features.length > 0).length
        },
        categories: {
          count: categories.length,
          names: categories.map(c => c.name)
        },
        compatibilities: {
          count: compatibilities.length,
          avgScore: compatibilities.length > 0 
            ? Math.round(compatibilities.reduce((sum, c) => sum + c.compatibilityScore, 0) / compatibilities.length)
            : 0,
          scoreDistribution: {
            high: compatibilities.filter(c => c.compatibilityScore >= 70).length,
            medium: compatibilities.filter(c => c.compatibilityScore >= 40 && c.compatibilityScore < 70).length,
            low: compatibilities.filter(c => c.compatibilityScore < 40).length
          }
        }
      },
      system: await getSystemHealth()
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to collect debug info',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Performance metrics for debugging
 */
export function getPerformanceMetrics() {
  if (!isDevelopment) {
    return { error: 'Performance metrics only available in development mode' };
  }

  const memoryUsage = process.memoryUsage();
  const resourceUsage = process.resourceUsage();
  
  return {
    timestamp: new Date().toISOString(),
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      arrayBuffers: `${Math.round(memoryUsage.arrayBuffers / 1024 / 1024)}MB`
    },
    cpu: {
      userCPUTime: `${resourceUsage.userCPUTime}μs`,
      systemCPUTime: `${resourceUsage.systemCPUTime}μs`,
      maxRSS: `${Math.round(resourceUsage.maxRSS / 1024)}MB`
    },
    uptime: `${Math.round(process.uptime())}s`,
    pid: process.pid,
    platform: process.platform,
    nodeVersion: process.version
  };
}

/**
 * Request tracing for debugging
 */
export interface RequestTrace {
  requestId: string;
  method: string;
  url: string;
  timestamp: string;
  duration?: number;
  statusCode?: number;
  error?: string;
}

// In-memory request traces (development only)
const requestTraces: RequestTrace[] = [];
const MAX_TRACES = 100;

export function addRequestTrace(trace: RequestTrace) {
  if (!isDevelopment) return;
  
  requestTraces.unshift(trace);
  if (requestTraces.length > MAX_TRACES) {
    requestTraces.splice(MAX_TRACES);
  }
}

export function getRequestTraces(limit = 50) {
  if (!isDevelopment) {
    return { error: 'Request traces only available in development mode' };
  }
  
  return {
    traces: requestTraces.slice(0, limit),
    total: requestTraces.length,
    timestamp: new Date().toISOString()
  };
}

/**
 * Middleware to track request traces
 */
export function requestTracingMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!isDevelopment) {
    return next();
  }

  const startTime = Date.now();
  const requestId = req.requestId || 'unknown';
  
  const trace: RequestTrace = {
    requestId,
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  };

  res.on('finish', () => {
    trace.duration = Date.now() - startTime;
    trace.statusCode = res.statusCode;
    
    if (res.statusCode >= 400) {
      trace.error = `HTTP ${res.statusCode}`;
    }
    
    addRequestTrace(trace);
  });

  next();
}