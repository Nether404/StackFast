import { Request, Response, NextFunction } from "express";
import { logger } from "./error-handler";
import os from "os";
import process from "process";

// Performance metrics interfaces
export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  timestamp: Date;
  statusCode: number;
  requestSize: number;
  responseSize: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  requestId?: string;
  userId?: string;
}

export interface DatabaseQueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  requestId?: string;
  success: boolean;
  errorMessage?: string;
}

export interface SystemMetrics {
  timestamp: Date;
  memoryUsage: {
    total: number;
    free: number;
    used: number;
    usedPercentage: number;
  };
  cpuUsage: {
    user: number;
    system: number;
    idle: number;
    loadAverage: number[];
  };
  processMetrics: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    uptime: number;
  };
}

// In-memory storage for metrics (in production, this should be replaced with a proper metrics store)
class MetricsStore {
  private performanceMetrics: PerformanceMetrics[] = [];
  private databaseMetrics: DatabaseQueryMetrics[] = [];
  private systemMetrics: SystemMetrics[] = [];
  private maxStoredMetrics = 1000; // Keep last 1000 metrics in memory

  addPerformanceMetric(metric: PerformanceMetrics): void {
    this.performanceMetrics.push(metric);
    if (this.performanceMetrics.length > this.maxStoredMetrics) {
      this.performanceMetrics.shift();
    }
  }

  addDatabaseMetric(metric: DatabaseQueryMetrics): void {
    this.databaseMetrics.push(metric);
    if (this.databaseMetrics.length > this.maxStoredMetrics) {
      this.databaseMetrics.shift();
    }
  }

  addSystemMetric(metric: SystemMetrics): void {
    this.systemMetrics.push(metric);
    if (this.systemMetrics.length > this.maxStoredMetrics) {
      this.systemMetrics.shift();
    }
  }

  getPerformanceMetrics(limit: number = 100): PerformanceMetrics[] {
    return this.performanceMetrics.slice(-limit);
  }

  getDatabaseMetrics(limit: number = 100): DatabaseQueryMetrics[] {
    return this.databaseMetrics.slice(-limit);
  }

  getSystemMetrics(limit: number = 100): SystemMetrics[] {
    return this.systemMetrics.slice(-limit);
  }

  getAggregatedMetrics(timeWindow: number = 300000): any { // 5 minutes default
    const now = Date.now();
    const cutoff = now - timeWindow;

    const recentMetrics = this.performanceMetrics.filter(
      m => m.timestamp.getTime() > cutoff
    );

    if (recentMetrics.length === 0) {
      return null;
    }

    const responseTimes = recentMetrics.map(m => m.responseTime);
    const statusCodes = recentMetrics.reduce((acc, m) => {
      acc[m.statusCode] = (acc[m.statusCode] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      timeWindow: timeWindow / 1000, // in seconds
      totalRequests: recentMetrics.length,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      p99ResponseTime: this.calculatePercentile(responseTimes, 99),
      statusCodeDistribution: statusCodes,
      errorRate: (statusCodes[500] || 0) / recentMetrics.length,
      throughput: recentMetrics.length / (timeWindow / 1000) // requests per second
    };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
}

export const metricsStore = new MetricsStore();

// Performance monitoring middleware
export function performanceMonitoringMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime.bigint();
  const startCpuUsage = process.cpuUsage();
  const requestSize = parseInt(req.headers['content-length'] || '0', 10);

  // Store original res.end to capture response size
  const originalEnd = res.end;
  let responseSize = 0;

  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    if (chunk) {
      responseSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk, encoding);
    }
    return originalEnd.call(this, chunk, encoding, cb);
  };

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    const endCpuUsage = process.cpuUsage(startCpuUsage);

    const metric: PerformanceMetrics = {
      endpoint: req.originalUrl || req.url,
      method: req.method,
      responseTime,
      timestamp: new Date(),
      statusCode: res.statusCode,
      requestSize,
      responseSize,
      memoryUsage: process.memoryUsage(),
      cpuUsage: endCpuUsage,
      requestId: req.requestId,
      userId: req.user?.id
    };

    // Store the metric
    metricsStore.addPerformanceMetric(metric);

    // Log slow requests (> 1 second)
    if (responseTime > 1000) {
      logger.warn(`Slow request detected: ${req.method} ${req.originalUrl}`, {
        responseTime,
        statusCode: res.statusCode,
        requestId: req.requestId
      });
    }

    // Log error responses
    if (res.statusCode >= 400) {
      logger.info(`Error response: ${req.method} ${req.originalUrl}`, {
        statusCode: res.statusCode,
        responseTime,
        requestId: req.requestId
      });
    }
  });

  next();
}

// Database query performance monitoring
export class DatabaseQueryMonitor {
  static trackQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    requestId?: string
  ): Promise<T> {
    const startTime = process.hrtime.bigint();
    
    return queryFn()
      .then((result) => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        const metric: DatabaseQueryMetrics = {
          query: queryName,
          duration,
          timestamp: new Date(),
          requestId,
          success: true
        };

        metricsStore.addDatabaseMetric(metric);

        // Log slow queries (> 100ms)
        if (duration > 100) {
          logger.warn(`Slow database query detected: ${queryName}`, {
            duration,
            requestId
          });
        }

        return result;
      })
      .catch((error) => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;

        const metric: DatabaseQueryMetrics = {
          query: queryName,
          duration,
          timestamp: new Date(),
          requestId,
          success: false,
          errorMessage: error.message
        };

        metricsStore.addDatabaseMetric(metric);

        logger.error(`Database query failed: ${queryName}`, error, {
          requestId,
          endpoint: queryName,
          method: 'DATABASE_QUERY',
          timestamp: new Date()
        } as any);

        throw error;
      });
  }
}

// System metrics collection
export class SystemMetricsCollector {
  private intervalId: NodeJS.Timeout | null = null;
  private collectionInterval = 30000; // 30 seconds

  start(): void {
    if (this.intervalId) {
      return; // Already running
    }

    this.collectMetrics(); // Collect initial metrics
    this.intervalId = setInterval(() => {
      this.collectMetrics();
    }, this.collectionInterval);

    logger.info('System metrics collection started', {
      interval: this.collectionInterval
    });
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('System metrics collection stopped');
    }
  }

  private collectMetrics(): void {
    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;

      const metric: SystemMetrics = {
        timestamp: new Date(),
        memoryUsage: {
          total: totalMemory,
          free: freeMemory,
          used: usedMemory,
          usedPercentage: (usedMemory / totalMemory) * 100
        },
        cpuUsage: {
          user: 0, // Will be calculated from process.cpuUsage()
          system: 0,
          idle: 0,
          loadAverage: os.loadavg()
        },
        processMetrics: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          uptime: process.uptime()
        }
      };

      metricsStore.addSystemMetric(metric);

      // Log high memory usage (> 80%)
      if (metric.memoryUsage.usedPercentage > 80) {
        logger.warn('High memory usage detected', {
          usedPercentage: metric.memoryUsage.usedPercentage,
          totalMemory: totalMemory / 1024 / 1024 / 1024, // GB
          freeMemory: freeMemory / 1024 / 1024 / 1024 // GB
        });
      }

      // Log high load average (> number of CPUs)
      const cpuCount = os.cpus().length;
      const loadAvg1min = metric.cpuUsage.loadAverage[0];
      if (loadAvg1min > cpuCount) {
        logger.warn('High CPU load detected', {
          loadAverage: loadAvg1min,
          cpuCount,
          loadRatio: loadAvg1min / cpuCount
        });
      }
    } catch (error) {
      logger.error('Failed to collect system metrics', error as Error);
    }
  }
}

// Create singleton instance
export const systemMetricsCollector = new SystemMetricsCollector();

// Metrics API endpoints helper
export function getMetricsData() {
  return {
    performance: metricsStore.getPerformanceMetrics(100),
    database: metricsStore.getDatabaseMetrics(100),
    system: metricsStore.getSystemMetrics(100),
    aggregated: metricsStore.getAggregatedMetrics()
  };
}

// Health check helper
export function getHealthStatus(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, any>;
  timestamp: string;
} {
  const aggregated = metricsStore.getAggregatedMetrics();
  const systemMetrics = metricsStore.getSystemMetrics(1)[0];

  const checks: Record<string, any> = {
    responseTime: {
      status: 'healthy',
      value: aggregated?.averageResponseTime || 0,
      threshold: 1000
    },
    errorRate: {
      status: 'healthy',
      value: aggregated?.errorRate || 0,
      threshold: 0.05 // 5%
    },
    memoryUsage: {
      status: 'healthy',
      value: systemMetrics?.memoryUsage.usedPercentage || 0,
      threshold: 80 // 80%
    },
    uptime: {
      status: 'healthy',
      value: process.uptime(),
      threshold: 0
    }
  };

  // Evaluate health status
  if (aggregated) {
    if (aggregated.averageResponseTime > 1000) {
      checks.responseTime.status = 'degraded';
    }
    if (aggregated.errorRate > 0.05) {
      checks.errorRate.status = 'unhealthy';
    }
  }

  if (systemMetrics && systemMetrics.memoryUsage.usedPercentage > 80) {
    checks.memoryUsage.status = 'degraded';
  }

  if (systemMetrics && systemMetrics.memoryUsage.usedPercentage > 90) {
    checks.memoryUsage.status = 'unhealthy';
  }

  // Determine overall status
  const hasUnhealthy = Object.values(checks).some(check => check.status === 'unhealthy');
  const hasDegraded = Object.values(checks).some(check => check.status === 'degraded');

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (hasUnhealthy) {
    status = 'unhealthy';
  } else if (hasDegraded) {
    status = 'degraded';
  }

  return {
    status,
    checks,
    timestamp: new Date().toISOString()
  };
}