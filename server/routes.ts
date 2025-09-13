import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, DatabaseStorage } from "./storage";
import { insertToolSchema, insertToolCategorySchema, insertCompatibilitySchema } from "@shared/schema";
import { cacheMiddleware, invalidateCache } from "./middleware/cache";
import { 
  asyncHandler, 
  validateRequest, 
  withDatabaseErrorHandling,
  sendSuccess,
  throwNotFoundIf,
  logger
} from "./middleware/route-helpers";
import { 
  validateAndSanitizeRequest
} from "./middleware/security";
import { z } from "zod";
import { 
  rateLimiters 
} from "./middleware/rate-limiting";
import { 
  auditMiddleware 
} from "./middleware/audit";
import { 
  paramSchemas, 
  querySchemas, 
  bodySchemas 
} from "./schemas/validation";
import { 
  compressionMiddleware, 
  compressionHeaders 
} from "./middleware/compression";
import { 
  paginationMiddleware, 
  paginationHelpers 
} from "./middleware/pagination";
import { ResponseOptimizer } from "./services/response-optimizer";
import { estimateCompressionRatio } from "./middleware/compression";
import { 
  getMetricsData, 
  getHealthStatus,
  DatabaseQueryMonitor 
} from "./middleware/performance-monitoring";
import { 
  getAnalyticsData, 
  submitUserFeedback, 
  trackUserInteraction 
} from "./middleware/analytics";
import { registerDebugRoutes } from "./routes/debug";

export async function registerRoutes(app: Express): Promise<Server> {
  // Split into tools.routes.ts
  app.get("/api/tools", 
    compressionMiddleware({ threshold: 2048, preferBrotli: true }),
    paginationMiddleware(50, 500),
    paginationHelpers(),
    asyncHandler(async (req, res) => {
      const tools = await withDatabaseErrorHandling(
        () => storage.getToolsWithAllCategories(),
        'fetch tools'
      );
      
      // Apply pagination if requested
      const pagination = (req as any).pagination;
      if (pagination) {
        const startIndex = pagination.offset;
        const endIndex = startIndex + pagination.limit;
        const paginatedTools = tools.slice(startIndex, endIndex);
        
        return (res as any).paginate(paginatedTools, tools.length);
      }
      
      // Optimize response for large datasets
      const optimizedResponse = ResponseOptimizer.createOptimizedResponse(tools, {
        message: 'Tools retrieved successfully',
        meta: { 
          count: tools.length,
          compressed: tools.length > 100 
        },
        serializationOptions: {
          excludeFields: tools.length > 100 ? ['description', 'notes'] : [],
          numberPrecision: 2
        }
      });
      
      res.json(optimizedResponse);
    })
  );

  // Seed database route
  app.post("/api/tools/seed", async (req, res) => {
    try {
      if (storage instanceof DatabaseStorage) {
        const result = await storage.seedDatabase();
        res.json({
          message: "Database seeded successfully",
          ...result
        });
      } else {
        res.json({ message: "Seed not needed for MemStorage" });
      }
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ message: "Failed to seed database", error: String(error) });
    }
  });

  // Get quality tools only - must be before :id route
  app.get("/api/tools/quality", 
    compressionMiddleware({ threshold: 1024, preferBrotli: true }),
    paginationMiddleware(25, 200),
    paginationHelpers(),
    async (req, res) => {
    try {
      const startTime = Date.now();
      const tools = await storage.getToolsWithAllCategories();
      
      // Define patterns for non-tools
      const languageNames = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'PHP', 'Perl', 'Scala', 'Haskell', 'Clojure', 'Elixir', 'Dart', 'R', 'Julia', 'Lua', 'MATLAB'];
      const resourcePatterns = ['awesome-', 'free-', '-books', 'book', 'tutorial', 'course', 'interview', 'roadmap', 'study', 'learning', 'education', 'curriculum', 'algorithms', 'design-patterns', 'cheat-sheet', 'collection', 'list-of', 'resources'];
      
      const qualityTools = tools
        .filter(tool => {
          // Must have meaningful description
          if (!tool.description || tool.description.length < 20) return false;
          
          const nameLower = tool.name.toLowerCase();
          const descLower = tool.description.toLowerCase();
          
          // Exclude programming languages
          if (languageNames.some(lang => tool.name === lang || nameLower === lang.toLowerCase())) {
            return false;
          }
          
          // Exclude resource collections, books, tutorials
          if (resourcePatterns.some(pattern => 
            nameLower.includes(pattern) || 
            (pattern.length > 4 && descLower.includes(pattern))
          )) {
            return false;
          }
          
          // Exclude items that are clearly collections or lists
          if (descLower.includes('collection of') || 
              descLower.includes('list of') || 
              descLower.includes('awesome list') ||
              descLower.includes('freely available') ||
              descLower.includes('all algorithms')) {
            return false;
          }
          
          return true;
        })
        .sort((a, b) => {
          // Prioritize tools with more features and better descriptions
          const scoreA = (a.features?.length || 0) * 2 + (a.description?.length || 0) / 10;
          const scoreB = (b.features?.length || 0) * 2 + (b.description?.length || 0) / 10;
          return scoreB - scoreA;
        }); // Return all quality tools
        
      // Apply pagination if requested
      const pagination = (req as any).pagination;
      if (pagination) {
        const startIndex = pagination.offset;
        const endIndex = startIndex + pagination.limit;
        const paginatedTools = qualityTools.slice(startIndex, endIndex);
        
        return (res as any).paginate(paginatedTools, qualityTools.length);
      }
      
      // Optimize response
      const optimizedResponse = ResponseOptimizer.createOptimizedResponse(qualityTools, {
        message: 'Quality tools retrieved successfully',
        meta: ResponseOptimizer.addPerformanceMetadata(startTime, {
          totalFiltered: qualityTools.length,
          filteringApplied: true
        }),
        serializationOptions: {
          numberPrecision: 1,
          excludeFields: qualityTools.length > 50 ? ['notes'] : []
        }
      });
      
      res.json(optimizedResponse);
    } catch (error) {
      console.error("Get quality tools error:", error);
      res.status(500).json({ message: "Failed to get quality tools" });
    }
  });

  // Export tools as CSV (or template if empty) - must be before :id route
  app.get("/api/tools/export-csv", async (_req, res) => {
    try {
      const csv = await storage.exportToolsAsCSV();
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=tools.csv");
      res.send(csv);
    } catch (error) {
      console.error("Export tools CSV error:", error);
      res.status(500).json({ message: "Failed to export tools CSV" });
    }
  });

  app.get("/api/tools/:id", 
    validateAndSanitizeRequest({ params: paramSchemas.id }),
    asyncHandler(async (req, res) => {
      const tool = await withDatabaseErrorHandling(
        () => storage.getToolWithCategory(req.params.id),
        'fetch tool'
      );
      throwNotFoundIf(!tool, 'Tool', req.params.id);
      sendSuccess(res, tool, 'Tool retrieved successfully');
    })
  );

  app.post("/api/tools", 
    rateLimiters.strict,
    validateAndSanitizeRequest({ body: bodySchemas.createTool }),
    auditMiddleware('CREATE', 'tool', { captureBody: true, captureResponse: true }),
    asyncHandler(async (req, res) => {
      const tool = await withDatabaseErrorHandling(
        () => storage.createTool(req.body),
        'create tool'
      );
      
      // Invalidate relevant caches
      invalidateCache("/api/tools");
      invalidateCache("/api/tools/quality");
      invalidateCache("/api/compatibility-matrix");
      
      logger.info(`Tool created successfully: ${tool.name}`, { toolId: tool.id }, req.requestId);
      sendSuccess(res, tool, 'Tool created successfully', 201);
    })
  );

  app.put("/api/tools/:id", 
    rateLimiters.strict,
    validateAndSanitizeRequest({ 
      params: paramSchemas.id, 
      body: bodySchemas.updateTool 
    }),
    auditMiddleware('UPDATE', 'tool', { 
      captureBody: true, 
      captureResponse: true, 
      resourceIdFromParams: 'id' 
    }),
    asyncHandler(async (req, res) => {
      const tool = await withDatabaseErrorHandling(
        () => storage.updateTool(req.params.id, req.body),
        'update tool'
      );
      throwNotFoundIf(!tool, 'Tool', req.params.id);
      
      // Invalidate relevant caches
      invalidateCache("/api/tools");
      invalidateCache("/api/tools/quality");
      invalidateCache("/api/compatibility-matrix");
      
      logger.info(`Tool updated successfully: ${req.params.id}`, { toolId: req.params.id }, req.requestId);
      sendSuccess(res, tool, 'Tool updated successfully');
    })
  );

  app.delete("/api/tools/:id", 
    rateLimiters.strict,
    validateAndSanitizeRequest({ params: paramSchemas.id }),
    auditMiddleware('DELETE', 'tool', { resourceIdFromParams: 'id' }),
    asyncHandler(async (req, res) => {
      const deleted = await withDatabaseErrorHandling(
        () => storage.deleteTool(req.params.id),
        'delete tool'
      );
      throwNotFoundIf(!deleted, 'Tool', req.params.id);
      
      // Invalidate relevant caches
      invalidateCache("/api/tools");
      invalidateCache("/api/tools/quality");
      invalidateCache("/api/compatibility-matrix");
      
      logger.info(`Tool deleted successfully: ${req.params.id}`, { toolId: req.params.id }, req.requestId);
      res.status(204).send();
    })
  );

  // Clear all tools from database
  app.delete("/api/tools", async (req, res) => {
    try {
      await storage.clearAllTools();
      invalidateCache("/api/tools");
      invalidateCache("/api/tools/quality");
      invalidateCache("/api/categories");
      invalidateCache("/api/compatibility-matrix");
      res.json({ message: "All tools cleared successfully" });
    } catch (error) {
      console.error("Clear tools error:", error);
      res.status(500).json({ message: "Failed to clear tools" });
    }
  });

  // Migrate to multiple categories
  app.post("/api/tools/migrate-categories", async (req, res) => {
    try {
      const { migrateToMultipleCategories } = await import("./services/migrate-categories");
      const result = await migrateToMultipleCategories();
      
      if (result.success) {
        invalidateCache("/api/tools");
        invalidateCache("/api/compatibility-matrix");
        res.json({
          message: "Categories migration successful",
          ...result
        });
      } else {
        res.status(500).json({ 
          message: "Migration failed", 
          error: result.error 
        });
      }
    } catch (error) {
      console.error("Migration error:", error);
      res.status(500).json({ message: "Failed to migrate categories" });
    }
  });

  // Import tools from CSV data
  app.post("/api/tools/import-csv", async (req, res) => {
    try {
      const imported = await storage.importToolsFromCSV();
      invalidateCache("/api/tools");
      invalidateCache("/api/tools/quality");
      invalidateCache("/api/compatibility-matrix");
      res.json({ message: `Successfully imported ${imported} tools from CSV` });
    } catch (error) {
      console.error("Import CSV error:", error);
      res.status(500).json({ message: "Failed to import tools from CSV" });
    }
  });


  // Generate compatibility scores for all tool pairs
  app.post("/api/tools/generate-compatibility", async (req, res) => {
    try {
      const result = await storage.generateCompatibilityScores();
      invalidateCache("/api/compatibility-matrix");
      res.json({ 
        message: "Compatibility scores generated successfully",
        generated: result.generated,
        updated: result.updated,
        total: result.generated + result.updated
      });
    } catch (error) {
      console.error("Generate compatibility error:", error);
      res.status(500).json({ message: "Failed to generate compatibility scores" });
    }
  });

  // Import StackFast tools
  app.post("/api/tools/import-stackfast", async (req, res) => {
    try {
      const { importStackFastTools } = await import('./services/import-stackfast-tools');
      const result = await importStackFastTools();
      invalidateCache("/api/tools");
      invalidateCache("/api/tools/quality");
      invalidateCache("/api/compatibility-matrix");
      res.json({ 
        message: `Successfully imported ${result.imported} StackFast tools`,
        imported: result.imported,
        skipped: result.skipped
      });
    } catch (error) {
      console.error("Import StackFast tools error:", error);
      res.status(500).json({ message: "Failed to import StackFast tools" });
    }
  });

  // ===== STACKFAST INTEGRATION ENDPOINTS =====
  
  // Get tool recommendations for a project idea
  app.post("/api/v1/tools/recommend", 
    rateLimiters.search,
    validateAndSanitizeRequest({ body: bodySchemas.toolRecommendations }),
    async (req, res) => {
    try {
      const { idea, maxResults = 5, avoidTools = [] } = req.body;

      // Analyze idea to determine needed categories
      const ideaLower = idea.toLowerCase();
      const neededCategories: string[] = [];
      
      if (ideaLower.includes('web') || ideaLower.includes('app') || ideaLower.includes('ui')) {
        neededCategories.push('Frontend & Design');
      }
      if (ideaLower.includes('api') || ideaLower.includes('backend') || ideaLower.includes('database')) {
        neededCategories.push('Backend & Infrastructure');
      }
      if (ideaLower.includes('ai') || ideaLower.includes('ml') || ideaLower.includes('chatbot')) {
        neededCategories.push('AI Coding Assistants');
      }
      if (neededCategories.length === 0) {
        neededCategories.push('Development Environments');
      }

      // Get recommendations
      const tools = await storage.getToolsWithCategory();
      const categories = await storage.getToolCategories();
      const recommendations: any[] = [];

      for (const categoryName of neededCategories) {
        const category = categories.find(c => c.name === categoryName);
        if (category) {
          const categoryTools = tools
            .filter(t => t.categoryId === category.id && !avoidTools.includes(t.name))
            .sort((a, b) => (b.popularityScore + b.maturityScore) - (a.popularityScore + a.maturityScore))
            .slice(0, Math.ceil(maxResults / neededCategories.length));
          
          for (const tool of categoryTools) {
            recommendations.push({
              tool: tool.name,
              category: categoryName,
              score: ((tool.popularityScore + tool.maturityScore) / 2).toFixed(1),
              reason: `High-rated ${categoryName.toLowerCase()} tool`
            });
          }
        }
      }

      res.json({
        success: true,
        recommendations: recommendations.slice(0, maxResults),
        basedOn: idea,
        categories: neededCategories
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: "Failed to get recommendations" 
      });
    }
  });

  // Analyze compatibility for a proposed tech stack
  app.post("/api/v1/stack/compatibility-report", 
    rateLimiters.search,
    validateAndSanitizeRequest({ body: bodySchemas.compatibilityReport }),
    async (req, res) => {
    try {
      const { tools } = req.body;

      // Find tool IDs from names
      const allTools = await storage.getToolsWithCategory();
      const toolRecords = tools.map(name => 
        allTools.find(t => t.name.toLowerCase() === name.toLowerCase())
      ).filter(Boolean);

      if (toolRecords.length < 2) {
        return res.status(404).json({ 
          success: false,
          error: "Could not find enough valid tools",
          validTools: toolRecords.map(t => t.name)
        });
      }

      // Get compatibility matrix
      const compatibilityMatrix: any[] = [];
      for (let i = 0; i < toolRecords.length; i++) {
        for (let j = i + 1; j < toolRecords.length; j++) {
          const compat = await storage.getCompatibility(toolRecords[i].id, toolRecords[j].id);
          compatibilityMatrix.push({
            toolA: toolRecords[i].name,
            toolB: toolRecords[j].name,
            score: compat?.compatibilityScore || 50,
            difficulty: compat?.integrationDifficulty || 'unknown',
            notes: compat?.notes || 'No compatibility data available'
          });
        }
      }

      // Calculate overall harmony
      const harmonyResult = await storage.getStackHarmonyScore(toolRecords.map(t => t.id));
      
      // Generate recommendations
      const recommendations: string[] = [];
      if (harmonyResult.harmonyScore < 50) {
        recommendations.push('Consider alternative tools with better compatibility');
        recommendations.push('Plan extra time for integration challenges');
      } else if (harmonyResult.harmonyScore > 80) {
        recommendations.push('Excellent tool synergy - proceed with confidence');
        recommendations.push('Integration should be straightforward');
      } else {
        recommendations.push('Moderate compatibility - standard integration effort expected');
      }

      res.json({
        success: true,
        stack: toolRecords.map(t => t.name),
        overallHarmony: harmonyResult.harmonyScore,
        compatibilityMatrix,
        recommendations,
        summary: {
          totalTools: toolRecords.length,
          avgCompatibility: Math.round(
            compatibilityMatrix.reduce((sum, c) => sum + c.score, 0) / compatibilityMatrix.length
          ),
          highCompatibilityPairs: compatibilityMatrix.filter(c => c.score > 70).length,
          lowCompatibilityPairs: compatibilityMatrix.filter(c => c.score < 40).length
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: "Failed to generate compatibility report" 
      });
    }
  });

  // Compatibility routes
  app.get("/api/compatibilities", async (req, res) => {
    try {
      const compatibilities = await storage.getCompatibilities();
      res.json(compatibilities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch compatibilities" });
    }
  });

  app.get("/api/compatibility-matrix", 
    cacheMiddleware(300),
    compressionMiddleware({ threshold: 4096, preferBrotli: true }),
    paginationMiddleware(100, 1000),
    paginationHelpers(),
    async (req, res) => {
      try {
        const startTime = Date.now();
        const matrix = await storage.getCompatibilityMatrix();
        
        // Apply pagination if requested
        const pagination = (req as any).pagination;
        if (pagination) {
          const startIndex = pagination.offset;
          const endIndex = startIndex + pagination.limit;
          const paginatedMatrix = matrix.slice(startIndex, endIndex);
          
          return (res as any).paginate(paginatedMatrix, matrix.length);
        }
        
        // Optimize response for large compatibility matrix
        const optimizedResponse = ResponseOptimizer.createOptimizedResponse(matrix, {
          message: 'Compatibility matrix retrieved successfully',
          meta: ResponseOptimizer.addPerformanceMetadata(startTime, {
            matrixSize: matrix.length,
            compressed: matrix.length > 500
          }),
          serializationOptions: {
            excludeFields: matrix.length > 500 ? ['notes', 'setupSteps'] : [],
            numberPrecision: 1
          }
        });
        
        res.json(optimizedResponse);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch compatibility matrix" });
      }
    }
  );

  app.get("/api/compatibility/:toolOneId/:toolTwoId", async (req, res) => {
    try {
      const { toolOneId, toolTwoId } = req.params;
      const compatibility = await storage.getCompatibility(toolOneId, toolTwoId);
      if (!compatibility) {
        return res.status(404).json({ message: "Compatibility not found" });
      }
      res.json(compatibility);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch compatibility" });
    }
  });

  app.post("/api/compatibilities", async (req, res) => {
    try {
      const compatibilityData = insertCompatibilitySchema.parse(req.body);
      const compatibility = await storage.createCompatibility(compatibilityData);
      res.status(201).json(compatibility);
    } catch (error) {
      res.status(400).json({ message: "Invalid compatibility data" });
    }
  });

  app.put("/api/compatibilities/:id", 
    rateLimiters.strict,
    validateAndSanitizeRequest({ 
      params: paramSchemas.compatibilityId, 
      body: bodySchemas.updateCompatibility 
    }),
    auditMiddleware('UPDATE', 'compatibility', { 
      captureBody: true, 
      captureResponse: true, 
      resourceIdFromParams: 'id' 
    }),
    asyncHandler(async (req, res) => {
      const compatibility = await withDatabaseErrorHandling(
        () => storage.updateCompatibility(req.params.id, req.body),
        'update compatibility'
      );
      throwNotFoundIf(!compatibility, 'Compatibility', req.params.id);
      
      // Invalidate compatibility matrix cache
      invalidateCache("/api/compatibility-matrix");
      
      logger.info(`Compatibility updated successfully: ${req.params.id}`, { 
        compatibilityId: req.params.id 
      }, req.requestId);
      sendSuccess(res, compatibility, 'Compatibility updated successfully');
    })
  );

  app.delete("/api/compatibilities/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCompatibilityById(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Compatibility not found" });
      }
      invalidateCache("/api/compatibility-matrix");
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete compatibility" });
    }
  });

  // ===== NEW STACKFAST INTEGRATION ENDPOINTS =====
  
  // Stack Templates endpoints
  // (single definition retained below)

  app.get("/api/stack-templates/:id", async (req, res) => {
    try {
      const template = await storage.getStackTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Stack template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stack template" });
    }
  });

  // (duplicate /api/stack/validate removed)

  // Stack Validation - validates tool compatibility in a stack
  app.post("/api/stack/validate", async (req, res) => {
    try {
      const { toolIds } = req.body;
      if (!Array.isArray(toolIds) || toolIds.length < 2) {
        return res.status(400).json({ message: "toolIds must contain at least 2 tools" });
      }
      
      const validation = await storage.validateStack(toolIds);
      res.json(validation);
    } catch (error) {
      res.status(500).json({ message: "Failed to validate stack" });
    }
  });

  // Stack Templates - get pre-built stack configurations (single)
  app.get("/api/stack-templates", async (req, res) => {
    try {
      const templates = await storage.getStackTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stack templates" });
    }
  });

  // Stack Harmony Score - calculates overall compatibility score for a stack
  app.post("/api/stack/harmony-score", async (req, res) => {
    try {
      const { toolIds } = req.body;
      if (!Array.isArray(toolIds) || toolIds.length === 0) {
        return res.status(400).json({ message: "toolIds must be a non-empty array" });
      }
      
      const score = await storage.calculateHarmonyScore(toolIds);
      res.json({ harmonyScore: score, toolIds });
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate harmony score" });
    }
  });

  // Best Compatible Tools - get recommendations based on selected tools
  app.post("/api/stack/recommendations", async (req, res) => {
    try {
      const { toolIds, category } = req.body;
      if (!Array.isArray(toolIds)) {
        return res.status(400).json({ message: "toolIds must be an array" });
      }
      
      const recommendations = await storage.getRecommendations(toolIds, category);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  // Bulk Compatibility Check - check compatibility for multiple tool pairs
  app.post("/api/stack/bulk-compatibility", 
    compressionMiddleware({ threshold: 2048, preferBrotli: true }),
    async (req, res) => {
    try {
      const startTime = Date.now();
      const { toolIds } = req.body;
      if (!Array.isArray(toolIds) || toolIds.length < 2) {
        return res.status(400).json({ message: "toolIds must contain at least 2 tools" });
      }
      
      const matrix = await storage.getBulkCompatibility(toolIds);
      
      // Optimize response for bulk compatibility data
      const optimizedResponse = ResponseOptimizer.createOptimizedResponse(matrix, {
        message: 'Bulk compatibility check completed',
        meta: ResponseOptimizer.addPerformanceMetadata(startTime, {
          toolCount: toolIds.length,
          pairCount: matrix.length,
          compressed: matrix.length > 20
        }),
        serializationOptions: {
          numberPrecision: 1,
          excludeFields: matrix.length > 50 ? ['notes'] : []
        }
      });
      
      res.json(optimizedResponse);
    } catch (error) {
      res.status(500).json({ message: "Failed to check bulk compatibility" });
    }
  });

  // Migration Paths endpoints
  app.get("/api/migration-paths/:fromToolId/:toToolId", async (req, res) => {
    try {
      const { fromToolId, toToolId } = req.params;
      const path = await storage.getMigrationPath(fromToolId, toToolId);
      if (!path) {
        return res.status(404).json({ message: "Migration path not found" });
      }
      res.json(path);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch migration path" });
    }
  });

  // Enhanced migration path with detailed analysis
  app.get("/api/migration-path", async (req, res) => {
    try {
      const { from, to } = req.query;
      if (!from || !to) {
        return res.status(400).json({ message: "Please provide both 'from' and 'to' tool IDs" });
      }

      const fromTool = await storage.getTool(from.toString());
      const toTool = await storage.getTool(to.toString());
      
      if (!fromTool || !toTool) {
        return res.status(404).json({ message: "One or both tools not found" });
      }

      // Get compatibility score
      const compatibility = await storage.getCompatibility(from.toString(), to.toString());
      const compatScore = compatibility?.compatibilityScore || 50;

      // Determine migration difficulty based on tool characteristics
      let difficulty: "easy" | "moderate" | "complex" = "moderate";
      let estimatedTime = "1-2 weeks";
      
      // Same category = easier migration
      if (fromTool.categoryId === toTool.categoryId) {
        difficulty = compatScore >= 70 ? "easy" : "moderate";
        estimatedTime = compatScore >= 70 ? "3-5 days" : "1-2 weeks";
      } else {
        difficulty = compatScore >= 60 ? "moderate" : "complex";
        estimatedTime = compatScore >= 60 ? "2-3 weeks" : "1-2 months";
      }

      // Generate migration steps based on tool types
      const steps = [];
      const considerations = [];
      const benefits = [];

      // Generic migration steps
      steps.push(`Audit current ${fromTool.name} implementation and document dependencies`);
      steps.push(`Set up ${toTool.name} development environment`);
      steps.push(`Create proof of concept with ${toTool.name}`);
      
      if (difficulty === "complex") {
        steps.push("Implement compatibility layer for gradual migration");
        steps.push("Migrate core functionality in phases");
        considerations.push("Consider running both systems in parallel during transition");
      } else {
        steps.push("Migrate configuration and settings");
        steps.push("Port existing code/functionality");
      }
      
      steps.push("Update CI/CD pipelines and deployment scripts");
      steps.push("Conduct thorough testing and performance benchmarking");
      steps.push("Train team on new tool and update documentation");
      steps.push("Plan rollback strategy and execute migration");

      // Add specific considerations based on categories
      if (fromTool.categoryId !== toTool.categoryId) {
        considerations.push("Different paradigms may require architectural changes");
        considerations.push("Team may need additional training for new tool category");
      }

      if (toTool.maturityScore < fromTool.maturityScore) {
        considerations.push(`${toTool.name} is less mature, expect potential stability issues`);
      }

      if (!toTool.pricing?.toLowerCase().includes("free") && fromTool.pricing?.toLowerCase().includes("free")) {
        considerations.push("Migration will introduce licensing costs");
      }

      // Add benefits
      if (toTool.popularityScore > fromTool.popularityScore) {
        benefits.push("Larger community and better support");
      }
      if (toTool.maturityScore > fromTool.maturityScore) {
        benefits.push("More stable and battle-tested solution");
      }
      if ((toTool.integrations?.length || 0) > (fromTool.integrations?.length || 0)) {
        benefits.push("Better integration options with other tools");
      }
      if ((toTool.features?.length || 0) > (fromTool.features?.length || 0)) {
        benefits.push("Access to more features and capabilities");
      }

      res.json({
        fromTool: from,
        toTool: to,
        difficulty,
        estimatedTime,
        steps,
        considerations,
        benefits,
        compatibility: compatScore
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate migration path" });
    }
  });

  // Alternative Tools - get tools that can replace a given tool
  app.get("/api/tools/:id/alternatives", async (req, res) => {
    try {
      const alternatives = await storage.getAlternativeTools(req.params.id);
      res.json(alternatives);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch alternative tools" });
    }
  });

  // ===== STACKFAST INTEGRATION API ENDPOINTS (v1) =====
  // These endpoints are designed for external consumption by the StackFast platform
  
  // Get compatibility score between two specific tools (by name or ID)
  app.get("/api/v1/compatibility/:toolA/:toolB", async (req, res) => {
    try {
      const { toolA, toolB } = req.params;
      
      // Try to find tools by name first, then by ID
      const tools = await storage.getToolsWithCategory();
      const toolARecord = tools.find(t => t.name === toolA || t.id === toolA);
      const toolBRecord = tools.find(t => t.name === toolB || t.id === toolB);
      
      if (!toolARecord || !toolBRecord) {
        return res.status(404).json({ 
          message: "One or both tools not found",
          toolA,
          toolB,
          availableTools: tools.map(t => t.name)
        });
      }
      
      const compatibility = await storage.getCompatibility(toolARecord.id, toolBRecord.id);
      
      if (!compatibility) {
        return res.status(404).json({ 
          message: "No compatibility data found",
          toolA: toolARecord.name,
          toolB: toolBRecord.name,
          score: 50, // Default neutral score
          notes: "No explicit compatibility data available"
        });
      }
      
      res.json({
        toolA: toolARecord.name,
        toolB: toolBRecord.name,
        toolAId: toolARecord.id,
        toolBId: toolBRecord.id,
        score: compatibility.compatibilityScore,
        notes: compatibility.notes,
        verifiedIntegration: compatibility.verifiedIntegration === 1,
        integrationDifficulty: compatibility.integrationDifficulty,
        setupSteps: compatibility.setupSteps,
        dependencies: compatibility.dependencies
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch compatibility data" });
    }
  });
  
  // Analyze a complete stack
  app.post("/api/v1/stack/analyze", async (req, res) => {
    try {
      let { toolIds, toolNames } = req.body;
      
      // Support both toolIds and toolNames for flexibility
      if (toolNames && Array.isArray(toolNames)) {
        const allTools = await storage.getToolsWithCategory();
        toolIds = toolNames.map(name => {
          const tool = allTools.find(t => t.name.toLowerCase() === name.toLowerCase());
          return tool?.id;
        }).filter(Boolean);
      }
      
      if (!Array.isArray(toolIds) || toolIds.length < 2) {
        return res.status(400).json({ message: "Please provide at least 2 tool IDs or tool names" });
      }
      
      const validation = await storage.validateStack(toolIds);
      const harmonyScore = await storage.calculateHarmonyScore(toolIds);
      const compatibilityMatrix = await storage.getBulkCompatibility(toolIds);
      
      res.json({
        toolIds,
        harmonyScore,
        validation,
        compatibilityMatrix,
        summary: {
          isValid: validation.valid,
          totalTools: toolIds.length,
          conflictCount: validation.conflicts.length,
          warningCount: validation.warnings.length,
          avgCompatibility: harmonyScore
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze stack" });
    }
  });
  
  // Search tools with filters - Enhanced with optimization
  app.get("/api/v1/tools/search", 
    rateLimiters.search,
    compressionMiddleware({ threshold: 512, preferBrotli: true }),
    paginationMiddleware(20, 100),
    paginationHelpers(),
    validateAndSanitizeRequest({ query: querySchemas.toolSearch }),
    async (req, res) => {
    try {
      const startTime = performance.now();
      const {
        query,
        q,
        category,
        minPopularity,
        minMaturity,
        min_popularity,
        min_maturity,
        hasFreeTier,
        hasIntegrations,
        frameworks,
        languages,
        sortBy,
        limit = 20,
        summary
      } = req.query as Record<string, any>;

      // Import search optimizer
      const { searchOptimizer } = await import('./services/search-optimizer');

      // Parse parameters
      const searchOptions = {
        query: (query || q)?.toString(),
        category: category?.toString(),
        minPopularity: parseFloat((minPopularity || min_popularity || "0").toString()) || undefined,
        minMaturity: parseFloat((minMaturity || min_maturity || "0").toString()) || undefined,
        hasFreeTier: (hasFreeTier || "").toString() === "true",
        hasIntegrations: (hasIntegrations || "").toString() === "true",
        frameworks: frameworks ? frameworks.toString().split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
        languages: languages ? languages.toString().split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
        sortBy: sortBy?.toString() as 'popularity' | 'maturity' | 'name' | 'recent' || 'popularity',
        limit: parseInt(limit.toString(), 10),
        offset: (req as any).pagination?.offset || 0,
      };

      // Perform optimized search
      const searchResult = await searchOptimizer.searchTools(searchOptions);
      
      const wantSummary = (summary || "").toString().toLowerCase() === "true";
      
      const summarize = (t: any) => ({
        id: t.id,
        name: t.name,
        category: t.category?.name || null,
        description: t.description,
        url: t.url,
        maturityScore: t.maturityScore,
        popularityScore: t.popularityScore
      });

      let finalResults = wantSummary ? searchResult.tools.map(summarize) : searchResult.tools;
      
      // Apply pagination if requested
      const pagination = (req as any).pagination;
      if (pagination) {
        return (res as any).paginate(finalResults, searchResult.totalCount);
      }

      // Optimize response for search results
      const optimizedResponse = ResponseOptimizer.createOptimizedResponse({
        results: finalResults,
        count: finalResults.length,
        filters: { 
          query: searchTerm, 
          category, 
          minPopularity: minPop, 
          minMaturity: minMat, 
          hasFreeTier, 
          frameworks: frameworksList, 
          languages: languagesList, 
          summary: wantSummary 
        }
      }, {
        message: 'Search completed successfully',
        serializationOptions: {
          numberPrecision: 1,
          excludeFields: wantSummary ? ['integrations', 'performanceImpact'] : []
        }
      });

      res.json({
        success: true,
        data: finalResults,
        totalCount: searchResult.totalCount,
        searchTime: searchResult.searchTime,
        cached: searchResult.cached,
        appliedFilters: searchResult.appliedFilters,
        message: `Found ${searchResult.totalCount} tools`,
        meta: ResponseOptimizer.addPerformanceMetadata(startTime, {
          searchOptimized: true,
          cacheHit: searchResult.cached,
          filterCount: searchResult.appliedFilters.length,
        }),
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to search tools",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Search suggestions endpoint for autocomplete
  app.get("/api/v1/tools/suggestions", 
    rateLimiters.search,
    validateAndSanitizeRequest({ query: z.object({ q: z.string().min(1).max(50) }) }),
    async (req, res) => {
    try {
      const { q } = req.query as { q: string };
      
      // Import search optimizer
      const { searchOptimizer } = await import('./services/search-optimizer');
      
      const suggestions = await searchOptimizer.getSearchSuggestions(q, 8);
      
      res.json({
        success: true,
        data: suggestions,
        query: q,
        message: `Found ${suggestions.length} suggestions`
      });
    } catch (error) {
      console.error("Suggestions error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get suggestions",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Search analytics endpoint
  app.get("/api/v1/tools/search/analytics", 
    rateLimiters.search,
    async (req, res) => {
    try {
      // Import search optimizer
      const { searchOptimizer } = await import('./services/search-optimizer');
      
      const analytics = {
        popularTerms: searchOptimizer.getPopularSearchTerms(10),
        cacheStats: searchOptimizer.getCacheStats(),
      };
      
      res.json({
        success: true,
        data: analytics,
        message: "Search analytics retrieved successfully"
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get search analytics",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Get AI-powered recommendations
  app.post("/api/v1/recommendations", async (req, res) => {
    try {
      const { 
        currentTools = [], 
        targetCategory,
        maxResults = 5,
        excludeTools = []
      } = req.body;
      
      let recommendations = await storage.getRecommendations(currentTools, targetCategory);
      
      // Filter out excluded tools
      if (excludeTools.length > 0) {
        recommendations = recommendations.filter(r => !excludeTools.includes(r.id));
      }
      
      // Limit results
      recommendations = recommendations.slice(0, maxResults);
      
      // Add compatibility scores with current tools
      const enhancedRecommendations = await Promise.all(
        recommendations.map(async (tool) => {
          const compatibilityScores = await Promise.all(
            currentTools.map(async (currentToolId: string) => {
              const compat = await storage.getCompatibility(tool.id, currentToolId);
              return {
                toolId: currentToolId,
                score: compat?.compatibilityScore || 50
              };
            })
          );
          
          return {
            ...tool,
            compatibilityWithCurrent: compatibilityScores,
            avgCompatibility: compatibilityScores.length > 0
              ? Math.round(compatibilityScores.reduce((sum, c) => sum + c.score, 0) / compatibilityScores.length)
              : null
          };
        })
      );
      
      res.json({
        recommendations: enhancedRecommendations,
        count: enhancedRecommendations.length,
        basedOn: currentTools,
        category: targetCategory
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });
  
  // Get all available categories
  app.get("/api/v1/categories", async (req, res) => {
    try {
      const categories = await storage.getToolCategories();
      const categoriesWithCounts = await Promise.all(
        categories.map(async (cat) => {
          const tools = await storage.getToolsByCategory(cat.id);
          return {
            ...cat,
            toolCount: tools.length
          };
        })
      );
      
      res.json({
        categories: categoriesWithCounts,
        total: categoriesWithCounts.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Python API-compatible aliases
  app.get("/api/tools/search", async (req, res) => {
    // Delegate to v1 search to keep a single implementation
    (req as any).query = { ...req.query, q: req.query.q || req.query.query };
    // Reuse handler logic by calling the same function body
    // Not easily re-entrant without refactor; forward by calling storage directly
    try {
      const forwardReq = { ...req, query: { ...req.query, q: (req.query as any).q || (req.query as any).query } } as any;
      const { q, category, min_maturity, min_popularity, frameworks, languages, per_page, summary } = forwardReq.query as any;
      const limit = per_page || forwardReq.query.limit || 20;
      const url = new URL(`http://localhost/dummy?limit=${limit}`);
      // Build params compatible with /api/v1/tools/search
      const mapped = {
        q,
        category,
        min_maturity,
        min_popularity,
        frameworks,
        languages,
        limit,
        summary
      } as any;
      forwardReq.query = mapped;
      // Inline invoke the v1 logic by duplicating the minimal path: use storage and mapping
      const resp: any = await (async () => {
        const queryHandler = async () => {
          const {
            q,
            category,
            min_popularity,
            min_maturity,
            frameworks,
            languages,
            limit,
            summary
          } = forwardReq.query as Record<string, any>;

          const searchTerm = (q || "").toString().toLowerCase();
          const frameworksList = (frameworks ? frameworks.toString().split(",") : []).map((s: string) => s.trim().toLowerCase()).filter(Boolean);
          const languagesList = (languages ? languages.toString().split(",") : []).map((s: string) => s.trim().toLowerCase()).filter(Boolean);
          const minPop = parseFloat((min_popularity || "").toString());
          const minMat = parseFloat((min_maturity || "").toString());
          const limitNum = parseInt((limit || 20).toString(), 10);
          const wantSummary = (summary || "").toString().toLowerCase() === "true";

          let tools = await storage.getToolsWithCategory();

          if (searchTerm) {
            tools = tools.filter((t: any) =>
              t.name?.toLowerCase().includes(searchTerm) ||
              t.description?.toLowerCase().includes(searchTerm) ||
              (Array.isArray(t.features) && t.features.some((f: string) => f.toLowerCase().includes(searchTerm)))
            );
          }
          if (category) {
            const cat = category.toString().toLowerCase();
            tools = tools.filter((t: any) => t.category?.name?.toLowerCase().includes(cat));
          }
          if (!isNaN(minPop)) tools = tools.filter((t: any) => t.popularityScore >= minPop);
          if (!isNaN(minMat)) tools = tools.filter((t: any) => t.maturityScore >= minMat);
          if ((forwardReq.query.hasFreeTier || "").toString() === "true") {
            tools = tools.filter((t: any) => t.pricing?.toLowerCase().includes("free"));
          }
          if (frameworksList.length > 0) {
            tools = tools.filter((t: any) => Array.isArray(t.frameworks) && frameworksList.some((f: string) =>
              t.frameworks.some((tf: string) => tf.toLowerCase().includes(f))
            ));
          }
          if (languagesList.length > 0) {
            tools = tools.filter((t: any) => Array.isArray(t.languages) && languagesList.some((l: string) =>
              t.languages.some((tl: string) => tl.toLowerCase().includes(l))
            ));
          }

          tools = tools.sort((a: any, b: any) => (b.popularityScore + b.maturityScore) - (a.popularityScore + a.maturityScore));
          const limited = tools.slice(0, limitNum);
          const summarize = (t: any) => ({ id: t.id, name: t.name, category: t.category?.name || null, description: t.description, url: t.url, maturityScore: t.maturityScore, popularityScore: t.popularityScore });
          return { results: wantSummary ? limited.map(summarize) : limited, count: limited.length };
        };
        return await queryHandler();
      })();
      res.json(resp);
    } catch (error) {
      res.status(500).json({ message: "Failed to search tools" });
    }
  });

  app.get("/api/tools/categories", async (_req, res) => {
    try {
      const categories = await storage.getToolCategories();
      res.json({ categories: categories.map((c) => c.name) });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Streaming endpoint for very large datasets
  app.get("/api/tools/stream", 
    compressionMiddleware({ threshold: 0, preferBrotli: true }),
    async (req, res) => {
    try {
      const tools = await storage.getToolsWithAllCategories();
      
      // Use streaming for large responses
      if (tools.length > 1000) {
        ResponseOptimizer.streamResponse(res, tools, 100);
      } else {
        const optimizedResponse = ResponseOptimizer.createOptimizedResponse(tools, {
          message: 'Tools streamed successfully',
          serializationOptions: {
            excludeFields: ['notes', 'performanceImpact'],
            numberPrecision: 1
          }
        });
        res.json(optimizedResponse);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to stream tools" });
    }
  });

  // API optimization statistics endpoint
  app.get("/api/optimization/stats", 
    compressionHeaders(),
    async (req, res) => {
    try {
      const tools = await storage.getToolsWithAllCategories();
      const sampleData = JSON.stringify(tools.slice(0, 10));
      
      // Calculate compression ratios
      const gzipRatio = await estimateCompressionRatio(sampleData, 'gzip');
      const brotliRatio = await estimateCompressionRatio(sampleData, 'brotli');
      
      const stats = {
        datasetSize: tools.length,
        sampleSize: sampleData.length,
        compressionRatios: {
          gzip: Math.round((1 - gzipRatio) * 100) + '%',
          brotli: Math.round((1 - brotliRatio) * 100) + '%'
        },
        optimizations: {
          indexesApplied: true,
          compressionEnabled: true,
          paginationAvailable: true,
          responseOptimization: true
        },
        recommendations: [
          'Use pagination for large datasets',
          'Enable compression for responses > 1KB',
          'Use summary mode for mobile clients',
          'Consider streaming for datasets > 1000 items'
        ]
      };
      
      res.json({
        success: true,
        data: stats,
        message: 'API optimization statistics retrieved'
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get optimization stats" });
    }
  });

  app.get("/api/v1/tools/stats", async (_req, res) => {
    try {
      const tools = await storage.getTools();
      const categories = await storage.getToolCategories();
      const byCategory: Record<string, number> = {};
      for (const cat of categories) byCategory[cat.name] = 0;
      for (const t of tools) {
        const cat = categories.find((c) => c.id === t.categoryId);
        if (cat) byCategory[cat.name] = (byCategory[cat.name] || 0) + 1;
      }
      res.json({
        total_tools: tools.length,
        total_categories: categories.length,
        category_breakdown: byCategory
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  
  // (duplicate /api/v1/migration/:fromTool/:toTool removed; canonical earlier)
  
  // ===== END OF STACKFAST API ENDPOINTS =====

  // Compatibility Generation routes
  app.post("/api/compatibility/generate", async (req, res) => {
    try {
      // Set a timeout of 120 seconds for the generation process
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Generation timeout")), 120000)
      );
      
      const { CompatibilityGenerator } = await import("./services/compatibility-generator");
      const generator = new CompatibilityGenerator();
      
      const result = await Promise.race([
        generator.generateCompatibilities(),
        timeoutPromise
      ]);
      
      res.json(result);
    } catch (error) {
      console.error("Generate compatibilities error:", error);
      const message = error instanceof Error && error.message === "Generation timeout" 
        ? "Compatibility generation timed out. Please try again with fewer tools."
        : "Failed to generate compatibilities";
      res.status(500).json({ message });
    }
  });

  app.post("/api/tools/cleanup", async (req, res) => {
    try {
      const { CompatibilityGenerator } = await import("./services/compatibility-generator");
      const generator = new CompatibilityGenerator();
      const deleted = await generator.cleanupLowQualityTools();
      res.json({ deleted });
    } catch (error) {
      console.error("Cleanup tools error:", error);
      res.status(500).json({ message: "Failed to cleanup tools" });
    }
  });

  // External Data Sources Routes
  app.get("/api/external-sources/available", async (req, res) => {
    try {
      const { getAvailableDataSources } = await import("./services/external-data-sources");
      const sources = getAvailableDataSources();
      res.json(sources);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available data sources" });
    }
  });

  app.post("/api/external-sources/import", async (req, res) => {
    try {
      const { batchImportTools } = await import("./services/external-data-sources");
      const { sources, apiKeys, dryRun } = req.body;
      
      const results = await batchImportTools({
        sources,
        apiKeys,
        dryRun: dryRun || false
      });
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to import tools from external sources" });
    }
  });

  app.post("/api/external-sources/sync", async (req, res) => {
    try {
      const { syncExternalDataSources } = await import("./services/external-data-sources");
      const { sources, apiKeys, updateExisting } = req.body;
      
      const results = await syncExternalDataSources(sources, {
        apiKeys,
        updateExisting: updateExisting !== false
      });
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to sync external data sources" });
    }
  });

  // API Integration Routes
  app.get("/api/integrations/available", async (req, res) => {
    try {
      const { getAvailableIntegrations } = await import("./services/api-integrations");
      const integrations = getAvailableIntegrations();
      res.json(integrations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available integrations" });
    }
  });

  app.get("/api/integrations/status/:toolName", async (req, res) => {
    try {
      const { getIntegrationStatus } = await import("./services/api-integrations");
      const status = await getIntegrationStatus(req.params.toolName);
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch integration status" });
    }
  });

  app.post("/api/integrations/sync/:toolId", async (req, res) => {
    try {
      const { fetchToolData, updateToolWithAPIData } = await import("./services/api-integrations");
      const { toolName, apiKey } = req.body;
      
      if (!toolName) {
        return res.status(400).json({ message: "Tool name is required" });
      }
      
      const data = await fetchToolData(toolName, apiKey);
      if (!data) {
        return res.status(404).json({ message: "Unable to fetch data for this tool" });
      }
      
      const success = await updateToolWithAPIData(req.params.toolId, data);
      if (success) {
        res.json({ message: "Tool updated successfully", data });
      } else {
        res.status(500).json({ message: "Failed to update tool" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to sync tool data" });
    }
  });

  app.post("/api/integrations/batch-sync", async (req, res) => {
    try {
      const { batchUpdateTools } = await import("./services/api-integrations");
      const { toolNames } = req.body;
      const results = await batchUpdateTools(toolNames);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to batch sync tools" });
    }
  });

  // ===== BLUEPRINT GENERATION ENDPOINT =====
  app.post("/api/v1/blueprint", async (req, res) => {
    try {
      const { blueprintGenerator } = await import("./services/blueprint-generator");
      const blueprint = await blueprintGenerator.generateBlueprint(req.body);
      res.json({ blueprint });
    } catch (error) {
      console.error("Blueprint generation error:", error);
      res.status(500).json({ message: "Failed to generate blueprint" });
    }
  });

  // ===== PAGINATION SUPPORT FOR TOOLS =====
  app.get("/api/tools/paginated", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const summary = ((req.query.summary as string) || '').toLowerCase() === 'true';
      const offset = (page - 1) * limit;
      
      const allTools = await storage.getToolsWithAllCategories();
      const totalCount = allTools.length;
      const tools = allTools.slice(offset, offset + limit);
      const summarize = (t: any) => ({
        id: t.id,
        name: t.name,
        category: t.category?.name || null,
        description: t.description,
        url: t.url,
        maturityScore: t.maturityScore,
        popularityScore: t.popularityScore
      });
      
      res.json({
        tools: summary ? tools.map(summarize) : tools,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: offset + limit < totalCount,
          hasPrevious: page > 1
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch paginated tools" });
    }
  });

  // ===== SECURITY AND MONITORING ENDPOINTS =====
  
  // Get audit logs (admin only)
  app.get("/api/admin/audit-logs", 
    rateLimiters.sensitive,
    validateAndSanitizeRequest({ query: querySchemas.pagination }),
    asyncHandler(async (req: Request, res: Response) => {
      const { getAuditLogs } = await import('./middleware/audit');
      
      const { page = 1, limit = 50 } = req.query as any;
      const offset = (page - 1) * limit;
      
      const { logs, total } = getAuditLogs({
        limit,
        offset
      });
      
      res.json({
        success: true,
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    })
  );
  
  // Export audit logs (admin only)
  app.get("/api/admin/audit-logs/export", 
    rateLimiters.sensitive,
    asyncHandler(async (req: Request, res: Response) => {
      const { exportAuditLogs } = await import('./middleware/audit');
      const format = req.query.format as 'json' | 'csv' || 'json';
      
      const exportData = exportAuditLogs(format);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.json');
      }
      
      res.send(exportData);
    })
  );
  
  // Get rate limit status
  app.get("/api/admin/rate-limit-status", 
    rateLimiters.general,
    asyncHandler(async (req: Request, res: Response) => {
      const { getRateLimitStatus } = await import('./middleware/rate-limiting');
      
      const status = await getRateLimitStatus(req);
      
      res.json({
        success: true,
        data: status
      });
    })
  );
  


  // ===== PERFORMANCE MONITORING ENDPOINTS =====
  
  // Get performance metrics
  app.get("/api/metrics", 
    rateLimiters.moderate,
    asyncHandler(async (req, res) => {
      const metrics = getMetricsData();
      sendSuccess(res, metrics, 'Performance metrics retrieved successfully');
    })
  );



  // Get aggregated performance metrics
  app.get("/api/metrics/performance", 
    rateLimiters.moderate,
    asyncHandler(async (req, res) => {
      const timeWindow = parseInt(req.query.timeWindow as string) || 300000; // 5 minutes default
      const metrics = getMetricsData();
      sendSuccess(res, {
        performance: metrics.performance,
        aggregated: metrics.aggregated,
        timeWindow: timeWindow / 1000
      }, 'Performance metrics retrieved successfully');
    })
  );

  // Get database performance metrics
  app.get("/api/metrics/database", 
    rateLimiters.moderate,
    asyncHandler(async (req, res) => {
      const metrics = getMetricsData();
      sendSuccess(res, {
        database: metrics.database,
        summary: {
          totalQueries: metrics.database.length,
          averageDuration: metrics.database.length > 0 
            ? metrics.database.reduce((sum, m) => sum + m.duration, 0) / metrics.database.length 
            : 0,
          slowQueries: metrics.database.filter(m => m.duration > 100).length,
          failedQueries: metrics.database.filter(m => !m.success).length
        }
      }, 'Database metrics retrieved successfully');
    })
  );

  // Get system metrics
  app.get("/api/metrics/system", 
    rateLimiters.moderate,
    asyncHandler(async (req, res) => {
      const metrics = getMetricsData();
      sendSuccess(res, {
        system: metrics.system,
        latest: metrics.system[metrics.system.length - 1] || null
      }, 'System metrics retrieved successfully');
    })
  );

  // ===== ANALYTICS AND USER TRACKING ENDPOINTS =====
  
  // Get analytics data
  app.get("/api/analytics", 
    rateLimiters.moderate,
    asyncHandler(async (req, res) => {
      const analytics = getAnalyticsData();
      sendSuccess(res, analytics, 'Analytics data retrieved successfully');
    })
  );

  // Get usage insights
  app.get("/api/analytics/insights", 
    rateLimiters.moderate,
    asyncHandler(async (req, res) => {
      const analytics = getAnalyticsData();
      sendSuccess(res, analytics.insights, 'Usage insights retrieved successfully');
    })
  );

  // Get analytics dashboard data
  app.get("/api/analytics/dashboard", 
    rateLimiters.moderate,
    asyncHandler(async (req, res) => {
      const analytics = getAnalyticsData();
      const dashboardData = {
        overview: {
          totalUsers: analytics.insights.totalUsers,
          activeUsers: analytics.insights.activeUsers,
          totalSessions: analytics.insights.totalSessions,
          averageSessionDuration: analytics.insights.averageSessionDuration
        },
        activity: {
          recentEvents: analytics.events.slice(-50),
          topFeatures: analytics.insights.topFeatures,
          topTools: analytics.insights.topTools
        },
        performance: {
          aggregated: analytics.aggregated,
          errorRate: analytics.aggregated.errorRate,
          averageDuration: analytics.aggregated.averageDuration
        },
        feedback: analytics.insights.userFeedbackSummary,
        search: {
          topSearchTerms: analytics.insights.searchTerms
        }
      };
      sendSuccess(res, dashboardData, 'Analytics dashboard data retrieved successfully');
    })
  );

  // Submit user feedback
  app.post("/api/feedback", 
    rateLimiters.moderate,
    validateAndSanitizeRequest({ body: bodySchemas.userFeedback }),
    asyncHandler(async (req, res) => {
      const { type, message, rating, metadata } = req.body;
      
      const feedback = submitUserFeedback(type, message, rating, metadata, req);
      
      logger.info(`User feedback submitted: ${type}`, { 
        feedbackId: feedback.id,
        rating: feedback.rating 
      }, req.requestId);
      
      sendSuccess(res, { feedbackId: feedback.id }, 'Feedback submitted successfully', 201);
    })
  );

  // Track user interaction
  app.post("/api/analytics/interaction", 
    rateLimiters.lenient,
    validateAndSanitizeRequest({ body: bodySchemas.userInteraction }),
    asyncHandler(async (req, res) => {
      const { action, target, metadata } = req.body;
      
      trackUserInteraction(action, target, metadata, req);
      
      sendSuccess(res, { tracked: true }, 'Interaction tracked successfully');
    })
  );

  // Get user feedback
  app.get("/api/feedback", 
    rateLimiters.moderate,
    asyncHandler(async (req, res) => {
      const analytics = getAnalyticsData();
      const limit = parseInt(req.query.limit as string) || 100;
      const type = req.query.type as string;
      
      let feedback = analytics.feedback.slice(-limit);
      
      if (type) {
        feedback = feedback.filter(f => f.type === type);
      }
      
      sendSuccess(res, {
        feedback,
        summary: analytics.insights.userFeedbackSummary
      }, 'User feedback retrieved successfully');
    })
  );

  // Register debug and health check routes
  registerDebugRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}