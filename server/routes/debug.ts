import type { Express } from "express";
import { 
  getSystemHealth, 
  getDebugInfo, 
  getPerformanceMetrics, 
  getRequestTraces 
} from "../middleware/debug";
import { logger } from "../middleware/error-handler";
import { storage } from "../storage";

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Register debug and health check routes
 */
export function registerDebugRoutes(app: Express) {
  
  // Health check endpoint - available in all environments
  app.get("/api/health", async (req, res) => {
    try {
      const health = await getSystemHealth();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      logger.error('Health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      });
    }
  });

  // Readiness probe - checks if app is ready to serve traffic
  app.get("/api/health/ready", async (req, res) => {
    try {
      // Test database connectivity
      await storage.getToolCategories();
      
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'connected',
          server: 'running'
        }
      });
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Liveness probe - checks if app is alive
  app.get("/api/health/live", (req, res) => {
    res.json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      pid: process.pid
    });
  });

  // Development-only debug endpoints
  if (isDevelopment) {
    
    // Comprehensive debug information
    app.get("/api/debug/info", async (req, res) => {
      try {
        const debugInfo = await getDebugInfo();
        res.json(debugInfo);
      } catch (error) {
        logger.error('Debug info collection failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        res.status(500).json({
          error: 'Failed to collect debug information',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Performance metrics
    app.get("/api/debug/performance", (req, res) => {
      try {
        const metrics = getPerformanceMetrics();
        res.json(metrics);
      } catch (error) {
        logger.error('Performance metrics collection failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        res.status(500).json({
          error: 'Failed to collect performance metrics',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Request traces
    app.get("/api/debug/traces", (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 50;
        const traces = getRequestTraces(limit);
        res.json(traces);
      } catch (error) {
        logger.error('Request traces collection failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        res.status(500).json({
          error: 'Failed to collect request traces',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Database statistics
    app.get("/api/debug/database", async (req, res) => {
      try {
        const [tools, categories, compatibilities] = await Promise.all([
          storage.getToolsWithAllCategories(),
          storage.getToolCategories(),
          storage.getCompatibilities()
        ]);

        const stats = {
          timestamp: new Date().toISOString(),
          tables: {
            tools: {
              total: tools.length,
              withCategories: tools.filter(t => t.categoryId).length,
              withDescriptions: tools.filter(t => t.description && t.description.length > 10).length,
              withFeatures: tools.filter(t => t.features && t.features.length > 0).length,
              avgPopularityScore: tools.length > 0 
                ? Math.round(tools.reduce((sum, t) => sum + (t.popularityScore || 0), 0) / tools.length * 10) / 10
                : 0,
              avgMaturityScore: tools.length > 0 
                ? Math.round(tools.reduce((sum, t) => sum + (t.maturityScore || 0), 0) / tools.length * 10) / 10
                : 0
            },
            categories: {
              total: categories.length,
              names: categories.map(c => c.name),
              toolDistribution: categories.map(c => ({
                name: c.name,
                toolCount: tools.filter(t => t.categoryId === c.id).length
              }))
            },
            compatibilities: {
              total: compatibilities.length,
              avgScore: compatibilities.length > 0 
                ? Math.round(compatibilities.reduce((sum, c) => sum + c.compatibilityScore, 0) / compatibilities.length * 10) / 10
                : 0,
              scoreDistribution: {
                excellent: compatibilities.filter(c => c.compatibilityScore >= 80).length,
                good: compatibilities.filter(c => c.compatibilityScore >= 60 && c.compatibilityScore < 80).length,
                fair: compatibilities.filter(c => c.compatibilityScore >= 40 && c.compatibilityScore < 60).length,
                poor: compatibilities.filter(c => c.compatibilityScore < 40).length
              },
              difficultyDistribution: {
                easy: compatibilities.filter(c => c.integrationDifficulty === 'easy').length,
                medium: compatibilities.filter(c => c.integrationDifficulty === 'medium').length,
                hard: compatibilities.filter(c => c.integrationDifficulty === 'hard').length
              }
            }
          }
        };

        res.json(stats);
      } catch (error) {
        logger.error('Database stats collection failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        res.status(500).json({
          error: 'Failed to collect database statistics',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Environment information
    app.get("/api/debug/environment", (req, res) => {
      try {
        const envInfo = {
          timestamp: new Date().toISOString(),
          node: {
            version: process.version,
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
            uptime: process.uptime(),
            cwd: process.cwd()
          },
          environment: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            DATABASE_URL: process.env.DATABASE_URL ? '[REDACTED]' : 'Not set',
            // Add other non-sensitive env vars as needed
          },
          memory: process.memoryUsage(),
          versions: process.versions
        };

        res.json(envInfo);
      } catch (error) {
        logger.error('Environment info collection failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        res.status(500).json({
          error: 'Failed to collect environment information',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Clear request traces
    app.delete("/api/debug/traces", (req, res) => {
      try {
        // Clear traces by importing and calling the function
        const { requestTraces } = require("../middleware/debug");
        if (Array.isArray(requestTraces)) {
          requestTraces.length = 0;
        }
        
        res.json({
          message: 'Request traces cleared',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Failed to clear request traces', { error: error instanceof Error ? error.message : 'Unknown error' });
        res.status(500).json({
          error: 'Failed to clear request traces',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Force garbage collection (if available)
    app.post("/api/debug/gc", (req, res) => {
      try {
        if (global.gc) {
          const beforeMemory = process.memoryUsage();
          global.gc();
          const afterMemory = process.memoryUsage();
          
          res.json({
            message: 'Garbage collection triggered',
            timestamp: new Date().toISOString(),
            memory: {
              before: beforeMemory,
              after: afterMemory,
              freed: {
                rss: beforeMemory.rss - afterMemory.rss,
                heapTotal: beforeMemory.heapTotal - afterMemory.heapTotal,
                heapUsed: beforeMemory.heapUsed - afterMemory.heapUsed
              }
            }
          });
        } else {
          res.status(400).json({
            error: 'Garbage collection not available. Start Node.js with --expose-gc flag.',
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        logger.error('Garbage collection failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        res.status(500).json({
          error: 'Failed to trigger garbage collection',
          timestamp: new Date().toISOString()
        });
      }
    });

  } else {
    // In production, return 404 for debug endpoints
    const debugPaths = [
      "/api/debug/info",
      "/api/debug/performance", 
      "/api/debug/traces",
      "/api/debug/database",
      "/api/debug/environment"
    ];

    debugPaths.forEach(path => {
      app.get(path, (req, res) => {
        res.status(404).json({
          error: 'Debug endpoints not available in production',
          timestamp: new Date().toISOString()
        });
      });
    });
  }
}