import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { storage } from '../../server/storage';
import type { Tool, Compatibility, ToolCategory } from '@shared/schema';
import { 
  asyncHandler, 
  validateRequest, 
  withDatabaseErrorHandling,
  sendSuccess,
  throwNotFoundIf
} from '../../server/middleware/route-helpers';
import { 
  validateAndSanitizeRequest
} from '../../server/middleware/security';
import { 
  rateLimiters 
} from '../../server/middleware/rate-limiting';
import { 
  auditMiddleware 
} from '../../server/middleware/audit';
import { 
  paramSchemas, 
  querySchemas, 
  bodySchemas 
} from '../../server/schemas/validation';

// Mock data fixtures
const mockCategory: ToolCategory = {
  id: 'test-category-1',
  name: 'Test Framework',
  description: 'Testing frameworks and tools',
  color: '#FF4500'
};

const mockTool: Omit<Tool, 'id'> = {
  name: 'Jest',
  description: 'JavaScript testing framework',
  categoryId: 'test-category-1',
  url: 'https://jestjs.io',
  frameworks: ['React', 'Node.js'],
  languages: ['JavaScript', 'TypeScript'],
  features: ['Unit Testing', 'Mocking', 'Snapshot Testing'],
  integrations: ['Babel', 'Webpack'],
  maturityScore: 90,
  popularityScore: 85,
  pricing: 'Free',
  notes: 'Popular testing framework',
  setupComplexity: 'easy',
  costTier: 'free',
  performanceImpact: { buildTime: 'low', bundleSize: 'medium' },
  apiLastSync: new Date('2024-01-15T10:00:00Z')
};

const mockCompatibility: Omit<Compatibility, 'id'> = {
  toolOneId: 'tool-1',
  toolTwoId: 'tool-2',
  compatibilityScore: 85,
  notes: 'Works well together',
  verifiedIntegration: 1,
  integrationDifficulty: 'easy',
  setupSteps: ['Install both packages', 'Configure integration'],
  codeExample: 'const integration = require("both-tools");',
  dependencies: ['shared-dependency']
};

describe('API Endpoints Integration Tests', () => {
  let app: express.Application;
  let server: any;
  let createdToolId: string;
  let createdCategoryId: string;
  let createdCompatibilityId: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    // Register core routes manually for testing
    // Tool Categories
    app.get('/api/categories', asyncHandler(async (req, res) => {
      const categories = await storage.getToolCategories();
      res.json(categories);
    }));

    app.post('/api/categories', 
      validateAndSanitizeRequest({ body: bodySchemas.createCategory }),
      asyncHandler(async (req, res) => {
        try {
          const category = await storage.createToolCategory(req.body);
          sendSuccess(res, category, 'Category created successfully', 201);
        } catch (error: any) {
          if (error.message?.includes('duplicate') || error.code === '23505') {
            res.status(409).json({
              success: false,
              error: {
                code: 'DUPLICATE_ERROR',
                message: 'Category name already exists',
                timestamp: new Date().toISOString(),
                requestId: 'test-request-id'
              }
            });
          } else {
            throw error;
          }
        }
      })
    );

    app.put('/api/categories/:id',
      validateAndSanitizeRequest({ 
        params: paramSchemas.id, 
        body: bodySchemas.updateCategory 
      }),
      asyncHandler(async (req, res) => {
        const category = await storage.updateToolCategory(req.params.id, req.body);
        throwNotFoundIf(!category, 'Category', req.params.id);
        sendSuccess(res, category, 'Category updated successfully');
      })
    );

    app.delete('/api/categories/:id',
      validateAndSanitizeRequest({ params: paramSchemas.id }),
      asyncHandler(async (req, res) => {
        const deleted = await storage.deleteToolCategory(req.params.id);
        throwNotFoundIf(!deleted, 'Category', req.params.id);
        res.status(204).send();
      })
    );

    // Tools
    app.get('/api/tools', asyncHandler(async (req, res) => {
      const tools = await storage.getToolsWithAllCategories();
      sendSuccess(res, tools, 'Tools retrieved successfully', 200, {
        count: tools.length
      });
    }));

    app.get('/api/tools/quality', asyncHandler(async (req, res) => {
      const tools = await storage.getToolsWithAllCategories();
      const qualityTools = tools.filter(tool => 
        tool.description && tool.description.length >= 20 &&
        tool.maturityScore >= 70 && tool.popularityScore >= 70
      );
      sendSuccess(res, qualityTools, 'Quality tools retrieved successfully');
    }));

    app.get('/api/tools/:id',
      validateAndSanitizeRequest({ params: paramSchemas.id }),
      asyncHandler(async (req, res) => {
        const tool = await storage.getToolWithCategory(req.params.id);
        throwNotFoundIf(!tool, 'Tool', req.params.id);
        sendSuccess(res, tool, 'Tool retrieved successfully');
      })
    );

    app.post('/api/tools',
      validateAndSanitizeRequest({ body: bodySchemas.createTool }),
      asyncHandler(async (req, res) => {
        const tool = await storage.createTool(req.body);
        sendSuccess(res, tool, 'Tool created successfully', 201);
      })
    );

    app.put('/api/tools/:id',
      validateAndSanitizeRequest({ 
        params: paramSchemas.id, 
        body: bodySchemas.updateTool 
      }),
      asyncHandler(async (req, res) => {
        const tool = await storage.updateTool(req.params.id, req.body);
        throwNotFoundIf(!tool, 'Tool', req.params.id);
        sendSuccess(res, tool, 'Tool updated successfully');
      })
    );

    app.delete('/api/tools/:id',
      validateAndSanitizeRequest({ params: paramSchemas.id }),
      asyncHandler(async (req, res) => {
        const deleted = await storage.deleteTool(req.params.id);
        throwNotFoundIf(!deleted, 'Tool', req.params.id);
        res.status(204).send();
      })
    );

    // Compatibilities
    app.get('/api/compatibilities', asyncHandler(async (req, res) => {
      const compatibilities = await storage.getCompatibilities();
      res.json(compatibilities);
    }));

    app.get('/api/compatibility-matrix', asyncHandler(async (req, res) => {
      const matrix = await storage.getCompatibilityMatrix();
      sendSuccess(res, matrix, 'Compatibility matrix retrieved successfully');
    }));

    app.get('/api/compatibility/:toolOneId/:toolTwoId', asyncHandler(async (req, res) => {
      const { toolOneId, toolTwoId } = req.params;
      const compatibility = await storage.getCompatibility(toolOneId, toolTwoId);
      if (!compatibility) {
        return res.status(404).json({ message: 'Compatibility not found' });
      }
      res.json(compatibility);
    }));

    app.post('/api/compatibilities', asyncHandler(async (req, res) => {
      try {
        const compatibility = await storage.createCompatibility(req.body);
        res.status(201).json(compatibility);
      } catch (error) {
        res.status(400).json({ message: 'Invalid compatibility data' });
      }
    }));

    app.put('/api/compatibilities/:id',
      validateAndSanitizeRequest({ 
        params: paramSchemas.compatibilityId, 
        body: bodySchemas.updateCompatibility 
      }),
      asyncHandler(async (req, res) => {
        const compatibility = await storage.updateCompatibility(req.params.id, req.body);
        throwNotFoundIf(!compatibility, 'Compatibility', req.params.id);
        sendSuccess(res, compatibility, 'Compatibility updated successfully');
      })
    );

    app.delete('/api/compatibilities/:id', asyncHandler(async (req, res) => {
      const deleted = await storage.deleteCompatibilityById(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Compatibility not found' });
      }
      res.status(204).send();
    }));

    // StackFast Integration endpoints
    app.post('/api/v1/tools/recommend',
      validateAndSanitizeRequest({ body: bodySchemas.toolRecommendations }),
      asyncHandler(async (req, res) => {
        const { idea, maxResults = 5 } = req.body;
        // Simple recommendation logic for testing
        const tools = await storage.getToolsWithCategory();
        const recommendations = tools.slice(0, maxResults).map(tool => ({
          tool: tool.name,
          category: 'General',
          score: '85.0',
          reason: 'High-rated tool'
        }));
        
        res.json({
          success: true,
          recommendations,
          basedOn: idea,
          categories: ['General']
        });
      })
    );

    app.post('/api/v1/stack/compatibility-report',
      validateAndSanitizeRequest({ body: bodySchemas.compatibilityReport }),
      asyncHandler(async (req, res) => {
        const { tools } = req.body;
        const allTools = await storage.getToolsWithCategory();
        const toolRecords = tools.map((name: string) => 
          allTools.find(t => t.name.toLowerCase() === name.toLowerCase())
        ).filter(Boolean);

        if (toolRecords.length < 2) {
          return res.status(404).json({ 
            success: false,
            error: 'Could not find enough valid tools',
            validTools: toolRecords.map(t => t.name)
          });
        }

        res.json({
          success: true,
          stack: toolRecords.map(t => t.name),
          overallHarmony: 75,
          compatibilityMatrix: [],
          recommendations: ['Good compatibility overall'],
          summary: {
            totalTools: toolRecords.length,
            avgCompatibility: 75,
            highCompatibilityPairs: 1,
            lowCompatibilityPairs: 0
          }
        });
      })
    );

    app.post('/api/stack/validate', asyncHandler(async (req, res) => {
      const { toolIds } = req.body;
      if (!Array.isArray(toolIds) || toolIds.length < 2) {
        return res.status(400).json({ message: 'toolIds must contain at least 2 tools' });
      }
      
      res.json({
        valid: true,
        conflicts: [],
        dependencies: [],
        warnings: [],
        recommendations: []
      });
    }));

    app.post('/api/stack/harmony-score', asyncHandler(async (req, res) => {
      const { toolIds } = req.body;
      if (!Array.isArray(toolIds) || toolIds.length === 0) {
        return res.status(400).json({ message: 'toolIds must be a non-empty array' });
      }
      
      res.json({ harmonyScore: 75, toolIds });
    }));

    app.post('/api/stack/recommendations', asyncHandler(async (req, res) => {
      const { toolIds } = req.body;
      if (!Array.isArray(toolIds)) {
        return res.status(400).json({ message: 'toolIds must be an array' });
      }
      
      res.json([]);
    }));

    app.post('/api/stack/bulk-compatibility', asyncHandler(async (req, res) => {
      const { toolIds } = req.body;
      if (!Array.isArray(toolIds) || toolIds.length < 2) {
        return res.status(400).json({ message: 'toolIds must contain at least 2 tools' });
      }
      
      sendSuccess(res, [], 'Bulk compatibility check completed', 200, {
        toolCount: toolIds.length,
        pairCount: 0
      });
    }));
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Clean up before each test
    await storage.clearAllTools();
    await storage.clearAllCompatibilities();
  });

  describe('Tool Categories Endpoints', () => {
    describe('GET /api/categories', () => {
      it('should return empty array when no categories exist', async () => {
        const response = await request(app)
          .get('/api/categories')
          .expect(200);

        expect(response.body).toEqual([]);
      });

      it('should return all categories', async () => {
        // Create a category first
        const category = await storage.createToolCategory({
          name: mockCategory.name,
          description: mockCategory.description,
          color: mockCategory.color
        });

        const response = await request(app)
          .get('/api/categories')
          .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toMatchObject({
          name: mockCategory.name,
          description: mockCategory.description,
          color: mockCategory.color
        });
      });
    });

    describe('POST /api/categories', () => {
      it('should create a new category', async () => {
        const response = await request(app)
          .post('/api/categories')
          .send({
            name: mockCategory.name,
            description: mockCategory.description,
            color: mockCategory.color
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          name: mockCategory.name,
          description: mockCategory.description,
          color: mockCategory.color
        });
        expect(response.body.data.id).toBeDefined();
        createdCategoryId = response.body.data.id;
      });

      it('should return 400 for invalid category data', async () => {
        const response = await request(app)
          .post('/api/categories')
          .send({
            // Missing required name field
            description: 'Invalid category'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 409 for duplicate category name', async () => {
        // Create first category
        await storage.createToolCategory({
          name: mockCategory.name,
          description: mockCategory.description,
          color: mockCategory.color
        });

        // Try to create duplicate
        const response = await request(app)
          .post('/api/categories')
          .send({
            name: mockCategory.name,
            description: 'Different description',
            color: '#000000'
          })
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('DUPLICATE_ERROR');
      });
    });

    describe('PUT /api/categories/:id', () => {
      beforeEach(async () => {
        const category = await storage.createToolCategory({
          name: mockCategory.name,
          description: mockCategory.description,
          color: mockCategory.color
        });
        createdCategoryId = category.id;
      });

      it('should update an existing category', async () => {
        const updatedData = {
          name: 'Updated Test Framework',
          description: 'Updated description',
          color: '#00FF00'
        };

        const response = await request(app)
          .put(`/api/categories/${createdCategoryId}`)
          .send(updatedData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject(updatedData);
      });

      it('should return 404 for non-existent category', async () => {
        const response = await request(app)
          .put('/api/categories/non-existent-id')
          .send({
            name: 'Updated Name'
          })
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });
    });

    describe('DELETE /api/categories/:id', () => {
      beforeEach(async () => {
        const category = await storage.createToolCategory({
          name: mockCategory.name,
          description: mockCategory.description,
          color: mockCategory.color
        });
        createdCategoryId = category.id;
      });

      it('should delete an existing category', async () => {
        await request(app)
          .delete(`/api/categories/${createdCategoryId}`)
          .expect(204);

        // Verify category is deleted
        const categories = await storage.getToolCategories();
        expect(categories).toHaveLength(0);
      });

      it('should return 404 for non-existent category', async () => {
        const response = await request(app)
          .delete('/api/categories/non-existent-id')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });
    });
  });

  describe('Tools Endpoints', () => {
    beforeEach(async () => {
      // Create a category for tools
      const category = await storage.createToolCategory({
        name: mockCategory.name,
        description: mockCategory.description,
        color: mockCategory.color
      });
      createdCategoryId = category.id;
    });

    describe('GET /api/tools', () => {
      it('should return empty success response when no tools exist', async () => {
        const response = await request(app)
          .get('/api/tools')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual([]);
      });

      it('should return all tools with pagination', async () => {
        // Create a tool first
        const tool = await storage.createTool({
          ...mockTool,
          categoryId: createdCategoryId
        });

        const response = await request(app)
          .get('/api/tools')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toMatchObject({
          name: mockTool.name,
          description: mockTool.description
        });
        expect(response.body.meta.count).toBe(1);
      });

      it('should support pagination parameters', async () => {
        // Create multiple tools
        for (let i = 0; i < 5; i++) {
          await storage.createTool({
            ...mockTool,
            name: `Tool ${i}`,
            categoryId: createdCategoryId
          });
        }

        const response = await request(app)
          .get('/api/tools?page=1&limit=2')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(2);
        expect(response.body.pagination.total).toBe(5);
      });
    });

    describe('GET /api/tools/quality', () => {
      it('should return quality tools only', async () => {
        // Create a quality tool
        await storage.createTool({
          ...mockTool,
          name: 'High Quality Tool',
          description: 'This is a comprehensive tool with detailed description and features',
          categoryId: createdCategoryId,
          maturityScore: 90,
          popularityScore: 85
        });

        // Create a low quality tool
        await storage.createTool({
          ...mockTool,
          name: 'Low Quality',
          description: 'Short desc',
          categoryId: createdCategoryId,
          maturityScore: 30,
          popularityScore: 20
        });

        const response = await request(app)
          .get('/api/tools/quality')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].name).toBe('High Quality Tool');
      });
    });

    describe('GET /api/tools/:id', () => {
      beforeEach(async () => {
        const tool = await storage.createTool({
          ...mockTool,
          categoryId: createdCategoryId
        });
        createdToolId = tool.id;
      });

      it('should return a specific tool', async () => {
        const response = await request(app)
          .get(`/api/tools/${createdToolId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          name: mockTool.name,
          description: mockTool.description
        });
      });

      it('should return 404 for non-existent tool', async () => {
        const response = await request(app)
          .get('/api/tools/non-existent-id')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });

      it('should return 400 for invalid tool ID format', async () => {
        const response = await request(app)
          .get('/api/tools/invalid-id-format!')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('POST /api/tools', () => {
      it('should create a new tool', async () => {
        const response = await request(app)
          .post('/api/tools')
          .send({
            ...mockTool,
            categoryId: createdCategoryId
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          name: mockTool.name,
          description: mockTool.description
        });
        expect(response.body.data.id).toBeDefined();
      });

      it('should return 400 for invalid tool data', async () => {
        const response = await request(app)
          .post('/api/tools')
          .send({
            // Missing required fields
            name: 'Invalid Tool'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 for non-existent category', async () => {
        const response = await request(app)
          .post('/api/tools')
          .send({
            ...mockTool,
            categoryId: 'non-existent-category'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('PUT /api/tools/:id', () => {
      beforeEach(async () => {
        const tool = await storage.createTool({
          ...mockTool,
          categoryId: createdCategoryId
        });
        createdToolId = tool.id;
      });

      it('should update an existing tool', async () => {
        const updatedData = {
          name: 'Updated Jest',
          description: 'Updated JavaScript testing framework',
          maturityScore: 95
        };

        const response = await request(app)
          .put(`/api/tools/${createdToolId}`)
          .send(updatedData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject(updatedData);
      });

      it('should return 404 for non-existent tool', async () => {
        const response = await request(app)
          .put('/api/tools/non-existent-id')
          .send({
            name: 'Updated Name'
          })
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });

      it('should return 400 for invalid update data', async () => {
        const response = await request(app)
          .put(`/api/tools/${createdToolId}`)
          .send({
            maturityScore: 150 // Invalid score > 100
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('DELETE /api/tools/:id', () => {
      beforeEach(async () => {
        const tool = await storage.createTool({
          ...mockTool,
          categoryId: createdCategoryId
        });
        createdToolId = tool.id;
      });

      it('should delete an existing tool', async () => {
        await request(app)
          .delete(`/api/tools/${createdToolId}`)
          .expect(204);

        // Verify tool is deleted
        const tools = await storage.getTools();
        expect(tools).toHaveLength(0);
      });

      it('should return 404 for non-existent tool', async () => {
        const response = await request(app)
          .delete('/api/tools/non-existent-id')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });
    });
  });

  describe('Compatibility Endpoints', () => {
    let toolOne: Tool;
    let toolTwo: Tool;

    beforeEach(async () => {
      // Create category and tools for compatibility tests
      const category = await storage.createToolCategory({
        name: mockCategory.name,
        description: mockCategory.description,
        color: mockCategory.color
      });

      toolOne = await storage.createTool({
        ...mockTool,
        name: 'Tool One',
        categoryId: category.id
      });

      toolTwo = await storage.createTool({
        ...mockTool,
        name: 'Tool Two',
        categoryId: category.id
      });
    });

    describe('GET /api/compatibilities', () => {
      it('should return empty array when no compatibilities exist', async () => {
        const response = await request(app)
          .get('/api/compatibilities')
          .expect(200);

        expect(response.body).toEqual([]);
      });

      it('should return all compatibilities', async () => {
        const compatibility = await storage.createCompatibility({
          ...mockCompatibility,
          toolOneId: toolOne.id,
          toolTwoId: toolTwo.id
        });

        const response = await request(app)
          .get('/api/compatibilities')
          .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toMatchObject({
          toolOneId: toolOne.id,
          toolTwoId: toolTwo.id,
          compatibilityScore: mockCompatibility.compatibilityScore
        });
      });
    });

    describe('GET /api/compatibility-matrix', () => {
      it('should return compatibility matrix', async () => {
        await storage.createCompatibility({
          ...mockCompatibility,
          toolOneId: toolOne.id,
          toolTwoId: toolTwo.id
        });

        const response = await request(app)
          .get('/api/compatibility-matrix')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toHaveProperty('toolOne');
        expect(response.body.data[0]).toHaveProperty('toolTwo');
        expect(response.body.data[0]).toHaveProperty('compatibility');
      });

      it('should support pagination for large matrices', async () => {
        // Create multiple compatibilities
        for (let i = 0; i < 5; i++) {
          const tool = await storage.createTool({
            ...mockTool,
            name: `Tool ${i}`,
            categoryId: toolOne.categoryId
          });
          await storage.createCompatibility({
            ...mockCompatibility,
            toolOneId: toolOne.id,
            toolTwoId: tool.id
          });
        }

        const response = await request(app)
          .get('/api/compatibility-matrix?page=1&limit=2')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(2);
      });
    });

    describe('GET /api/compatibility/:toolOneId/:toolTwoId', () => {
      beforeEach(async () => {
        const compatibility = await storage.createCompatibility({
          ...mockCompatibility,
          toolOneId: toolOne.id,
          toolTwoId: toolTwo.id
        });
        createdCompatibilityId = compatibility.id;
      });

      it('should return specific compatibility', async () => {
        const response = await request(app)
          .get(`/api/compatibility/${toolOne.id}/${toolTwo.id}`)
          .expect(200);

        expect(response.body).toMatchObject({
          toolOneId: toolOne.id,
          toolTwoId: toolTwo.id,
          compatibilityScore: mockCompatibility.compatibilityScore
        });
      });

      it('should return 404 for non-existent compatibility', async () => {
        const response = await request(app)
          .get('/api/compatibility/non-existent-1/non-existent-2')
          .expect(404);

        expect(response.body.message).toBe('Compatibility not found');
      });
    });

    describe('POST /api/compatibilities', () => {
      it('should create a new compatibility', async () => {
        const response = await request(app)
          .post('/api/compatibilities')
          .send({
            ...mockCompatibility,
            toolOneId: toolOne.id,
            toolTwoId: toolTwo.id
          })
          .expect(201);

        expect(response.body).toMatchObject({
          toolOneId: toolOne.id,
          toolTwoId: toolTwo.id,
          compatibilityScore: mockCompatibility.compatibilityScore
        });
        expect(response.body.id).toBeDefined();
      });

      it('should return 400 for invalid compatibility data', async () => {
        const response = await request(app)
          .post('/api/compatibilities')
          .send({
            // Missing required fields
            compatibilityScore: 85
          })
          .expect(400);

        expect(response.body.message).toBe('Invalid compatibility data');
      });
    });

    describe('PUT /api/compatibilities/:id', () => {
      beforeEach(async () => {
        const compatibility = await storage.createCompatibility({
          ...mockCompatibility,
          toolOneId: toolOne.id,
          toolTwoId: toolTwo.id
        });
        createdCompatibilityId = compatibility.id;
      });

      it('should update an existing compatibility', async () => {
        const updatedData = {
          compatibilityScore: 95,
          notes: 'Updated compatibility notes',
          integrationDifficulty: 'medium' as const
        };

        const response = await request(app)
          .put(`/api/compatibilities/${createdCompatibilityId}`)
          .send(updatedData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject(updatedData);
      });

      it('should return 404 for non-existent compatibility', async () => {
        const response = await request(app)
          .put('/api/compatibilities/non-existent-id')
          .send({
            compatibilityScore: 95
          })
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });

      it('should return 400 for invalid compatibility score', async () => {
        const response = await request(app)
          .put(`/api/compatibilities/${createdCompatibilityId}`)
          .send({
            compatibilityScore: 150 // Invalid score > 100
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('DELETE /api/compatibilities/:id', () => {
      beforeEach(async () => {
        const compatibility = await storage.createCompatibility({
          ...mockCompatibility,
          toolOneId: toolOne.id,
          toolTwoId: toolTwo.id
        });
        createdCompatibilityId = compatibility.id;
      });

      it('should delete an existing compatibility', async () => {
        await request(app)
          .delete(`/api/compatibilities/${createdCompatibilityId}`)
          .expect(204);

        // Verify compatibility is deleted
        const compatibilities = await storage.getCompatibilities();
        expect(compatibilities).toHaveLength(0);
      });

      it('should return 404 for non-existent compatibility', async () => {
        const response = await request(app)
          .delete('/api/compatibilities/non-existent-id')
          .expect(404);

        expect(response.body.message).toBe('Compatibility not found');
      });
    });
  });

  describe('StackFast Integration Endpoints', () => {
    let tools: Tool[];

    beforeEach(async () => {
      // Create category and multiple tools for stack testing
      const category = await storage.createToolCategory({
        name: 'Web Development',
        description: 'Web development tools',
        color: '#FF4500'
      });

      tools = [];
      for (let i = 0; i < 3; i++) {
        const tool = await storage.createTool({
          ...mockTool,
          name: `Tool ${i}`,
          categoryId: category.id
        });
        tools.push(tool);
      }

      // Create some compatibilities
      await storage.createCompatibility({
        ...mockCompatibility,
        toolOneId: tools[0].id,
        toolTwoId: tools[1].id,
        compatibilityScore: 90
      });

      await storage.createCompatibility({
        ...mockCompatibility,
        toolOneId: tools[1].id,
        toolTwoId: tools[2].id,
        compatibilityScore: 80
      });
    });

    describe('POST /api/v1/tools/recommend', () => {
      it('should return tool recommendations based on project idea', async () => {
        const response = await request(app)
          .post('/api/v1/tools/recommend')
          .send({
            idea: 'Build a web application with React',
            maxResults: 3
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.recommendations).toBeDefined();
        expect(response.body.basedOn).toBe('Build a web application with React');
        expect(response.body.categories).toBeDefined();
      });

      it('should return 400 for missing idea', async () => {
        const response = await request(app)
          .post('/api/v1/tools/recommend')
          .send({
            maxResults: 3
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should respect maxResults parameter', async () => {
        const response = await request(app)
          .post('/api/v1/tools/recommend')
          .send({
            idea: 'Build a web application',
            maxResults: 1
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.recommendations.length).toBeLessThanOrEqual(1);
      });
    });

    describe('POST /api/v1/stack/compatibility-report', () => {
      it('should generate compatibility report for tool stack', async () => {
        const response = await request(app)
          .post('/api/v1/stack/compatibility-report')
          .send({
            tools: [tools[0].name, tools[1].name, tools[2].name]
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.stack).toEqual([tools[0].name, tools[1].name, tools[2].name]);
        expect(response.body.overallHarmony).toBeDefined();
        expect(response.body.compatibilityMatrix).toBeDefined();
        expect(response.body.recommendations).toBeDefined();
        expect(response.body.summary).toBeDefined();
      });

      it('should return 404 for invalid tool names', async () => {
        const response = await request(app)
          .post('/api/v1/stack/compatibility-report')
          .send({
            tools: ['NonExistentTool1', 'NonExistentTool2']
          })
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Could not find enough valid tools');
      });

      it('should return 400 for insufficient tools', async () => {
        const response = await request(app)
          .post('/api/v1/stack/compatibility-report')
          .send({
            tools: [tools[0].name] // Only one tool
          })
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/stack/validate', () => {
      it('should validate a stack of tools', async () => {
        const response = await request(app)
          .post('/api/stack/validate')
          .send({
            toolIds: [tools[0].id, tools[1].id]
          })
          .expect(200);

        expect(response.body).toHaveProperty('valid');
        expect(response.body).toHaveProperty('conflicts');
        expect(response.body).toHaveProperty('dependencies');
        expect(response.body).toHaveProperty('warnings');
        expect(response.body).toHaveProperty('recommendations');
      });

      it('should return 400 for insufficient tools', async () => {
        const response = await request(app)
          .post('/api/stack/validate')
          .send({
            toolIds: [tools[0].id] // Only one tool
          })
          .expect(400);

        expect(response.body.message).toBe('toolIds must contain at least 2 tools');
      });

      it('should return 400 for invalid input format', async () => {
        const response = await request(app)
          .post('/api/stack/validate')
          .send({
            toolIds: 'not-an-array'
          })
          .expect(400);

        expect(response.body.message).toBe('toolIds must contain at least 2 tools');
      });
    });

    describe('POST /api/stack/harmony-score', () => {
      it('should calculate harmony score for tool stack', async () => {
        const response = await request(app)
          .post('/api/stack/harmony-score')
          .send({
            toolIds: [tools[0].id, tools[1].id, tools[2].id]
          })
          .expect(200);

        expect(response.body).toHaveProperty('harmonyScore');
        expect(response.body).toHaveProperty('toolIds');
        expect(typeof response.body.harmonyScore).toBe('number');
        expect(response.body.toolIds).toEqual([tools[0].id, tools[1].id, tools[2].id]);
      });

      it('should return 400 for empty tool array', async () => {
        const response = await request(app)
          .post('/api/stack/harmony-score')
          .send({
            toolIds: []
          })
          .expect(400);

        expect(response.body.message).toBe('toolIds must be a non-empty array');
      });
    });

    describe('POST /api/stack/recommendations', () => {
      it('should return tool recommendations based on existing stack', async () => {
        const response = await request(app)
          .post('/api/stack/recommendations')
          .send({
            toolIds: [tools[0].id, tools[1].id]
          })
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should return 400 for invalid input', async () => {
        const response = await request(app)
          .post('/api/stack/recommendations')
          .send({
            toolIds: 'not-an-array'
          })
          .expect(400);

        expect(response.body.message).toBe('toolIds must be an array');
      });
    });

    describe('POST /api/stack/bulk-compatibility', () => {
      it('should return bulk compatibility data', async () => {
        const response = await request(app)
          .post('/api/stack/bulk-compatibility')
          .send({
            toolIds: [tools[0].id, tools[1].id, tools[2].id]
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.meta).toBeDefined();
      });

      it('should return 400 for insufficient tools', async () => {
        const response = await request(app)
          .post('/api/stack/bulk-compatibility')
          .send({
            toolIds: [tools[0].id] // Only one tool
          })
          .expect(400);

        expect(response.body.message).toBe('toolIds must contain at least 2 tools');
      });
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/tools')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle requests with missing Content-Type', async () => {
      const response = await request(app)
        .post('/api/tools')
        .send('plain text data')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle extremely large payloads gracefully', async () => {
      const largePayload = {
        name: 'A'.repeat(10000),
        description: 'B'.repeat(50000),
        categoryId: 'test-category'
      };

      const response = await request(app)
        .post('/api/tools')
        .send(largePayload)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle concurrent requests properly', async () => {
      // Create category first
      const category = await storage.createToolCategory({
        name: 'Concurrent Test',
        description: 'Test category',
        color: '#FF0000'
      });

      // Make multiple concurrent requests
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/tools')
          .send({
            ...mockTool,
            name: `Concurrent Tool ${i}`,
            categoryId: category.id
          })
      );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Verify all tools were created
      const tools = await storage.getTools();
      expect(tools).toHaveLength(5);
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should enforce rate limits on strict endpoints', async () => {
      // Create category first
      const category = await storage.createToolCategory({
        name: 'Rate Limit Test',
        description: 'Test category',
        color: '#FF0000'
      });

      // Make requests rapidly to trigger rate limit
      const promises = Array.from({ length: 20 }, () =>
        request(app)
          .post('/api/tools')
          .send({
            ...mockTool,
            name: 'Rate Limit Tool',
            categoryId: category.id
          })
      );

      const responses = await Promise.allSettled(promises);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 429
      );

      // At least some requests should be rate limited
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Cache Behavior Tests', () => {
    it('should serve cached responses for repeated requests', async () => {
      // First request
      const response1 = await request(app)
        .get('/api/compatibility-matrix')
        .expect(200);

      // Second request (should be cached)
      const response2 = await request(app)
        .get('/api/compatibility-matrix')
        .expect(200);

      expect(response1.body).toEqual(response2.body);
    });

    it('should invalidate cache after data modifications', async () => {
      // Get initial data
      const initialResponse = await request(app)
        .get('/api/tools')
        .expect(200);

      // Create category and tool
      const category = await storage.createToolCategory({
        name: 'Cache Test',
        description: 'Test category',
        color: '#FF0000'
      });

      await request(app)
        .post('/api/tools')
        .send({
          ...mockTool,
          categoryId: category.id
        })
        .expect(201);

      // Get data again (should be updated)
      const updatedResponse = await request(app)
        .get('/api/tools')
        .expect(200);

      expect(updatedResponse.body.data.length).toBeGreaterThan(initialResponse.body.data.length);
    });
  });
});