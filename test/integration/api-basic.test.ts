import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { storage } from '../../server/storage';
import type { Tool, Compatibility, ToolCategory } from '@shared/schema';

describe('Basic API Integration Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    // Basic error handling middleware
    app.use((err: any, req: any, res: any, next: any) => {
      console.error('Test error:', err);
      res.status(500).json({ 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: err.message || 'Internal server error' 
        } 
      });
    });

    // Simple routes for testing CRUD operations
    app.get('/api/tools', async (req, res) => {
      try {
        const tools = await storage.getTools();
        res.json({ success: true, data: tools });
      } catch (error: any) {
        res.status(500).json({ 
          success: false, 
          error: { code: 'FETCH_ERROR', message: error.message } 
        });
      }
    });

    app.post('/api/tools', async (req, res) => {
      try {
        const tool = await storage.createTool(req.body);
        res.status(201).json({ success: true, data: tool });
      } catch (error: any) {
        res.status(400).json({ 
          success: false, 
          error: { code: 'CREATE_ERROR', message: error.message } 
        });
      }
    });

    app.get('/api/tools/:id', async (req, res) => {
      try {
        const tool = await storage.getTool(req.params.id);
        if (!tool) {
          return res.status(404).json({ 
            success: false, 
            error: { code: 'NOT_FOUND', message: 'Tool not found' } 
          });
        }
        res.json({ success: true, data: tool });
      } catch (error: any) {
        res.status(500).json({ 
          success: false, 
          error: { code: 'FETCH_ERROR', message: error.message } 
        });
      }
    });

    app.put('/api/tools/:id', async (req, res) => {
      try {
        const tool = await storage.updateTool(req.params.id, req.body);
        if (!tool) {
          return res.status(404).json({ 
            success: false, 
            error: { code: 'NOT_FOUND', message: 'Tool not found' } 
          });
        }
        res.json({ success: true, data: tool });
      } catch (error: any) {
        res.status(400).json({ 
          success: false, 
          error: { code: 'UPDATE_ERROR', message: error.message } 
        });
      }
    });

    app.delete('/api/tools/:id', async (req, res) => {
      try {
        const deleted = await storage.deleteTool(req.params.id);
        if (!deleted) {
          return res.status(404).json({ 
            success: false, 
            error: { code: 'NOT_FOUND', message: 'Tool not found' } 
          });
        }
        res.status(204).send();
      } catch (error: any) {
        res.status(500).json({ 
          success: false, 
          error: { code: 'DELETE_ERROR', message: error.message } 
        });
      }
    });

    // Categories endpoints
    app.get('/api/categories', async (req, res) => {
      try {
        const categories = await storage.getToolCategories();
        res.json({ success: true, data: categories });
      } catch (error: any) {
        res.status(500).json({ 
          success: false, 
          error: { code: 'FETCH_ERROR', message: error.message } 
        });
      }
    });

    app.post('/api/categories', async (req, res) => {
      try {
        const category = await storage.createToolCategory(req.body);
        res.status(201).json({ success: true, data: category });
      } catch (error: any) {
        res.status(400).json({ 
          success: false, 
          error: { code: 'CREATE_ERROR', message: error.message } 
        });
      }
    });

    // Compatibilities endpoints
    app.get('/api/compatibilities', async (req, res) => {
      try {
        const compatibilities = await storage.getCompatibilities();
        res.json({ success: true, data: compatibilities });
      } catch (error: any) {
        res.status(500).json({ 
          success: false, 
          error: { code: 'FETCH_ERROR', message: error.message } 
        });
      }
    });

    app.post('/api/compatibilities', async (req, res) => {
      try {
        const compatibility = await storage.createCompatibility(req.body);
        res.status(201).json({ success: true, data: compatibility });
      } catch (error: any) {
        res.status(400).json({ 
          success: false, 
          error: { code: 'CREATE_ERROR', message: error.message } 
        });
      }
    });

    app.get('/api/compatibility-matrix', async (req, res) => {
      try {
        const matrix = await storage.getCompatibilityMatrix();
        res.json({ success: true, data: matrix });
      } catch (error: any) {
        res.status(500).json({ 
          success: false, 
          error: { code: 'FETCH_ERROR', message: error.message } 
        });
      }
    });

    // Stack validation endpoint
    app.post('/api/stack/validate', async (req, res) => {
      try {
        const { toolIds } = req.body;
        if (!Array.isArray(toolIds) || toolIds.length < 2) {
          return res.status(400).json({ 
            success: false, 
            error: { code: 'VALIDATION_ERROR', message: 'toolIds must contain at least 2 tools' } 
          });
        }
        
        const validation = await storage.validateStack(toolIds);
        res.json({ success: true, data: validation });
      } catch (error: any) {
        res.status(500).json({ 
          success: false, 
          error: { code: 'VALIDATION_ERROR', message: error.message } 
        });
      }
    });
  });

  beforeEach(async () => {
    // Clean up before each test - but only clear what we create
    try {
      await storage.clearAllCompatibilities();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Tools CRUD Operations', () => {
    let testCategoryId: string;

    beforeEach(async () => {
      // Create a test category for tools
      const category = await storage.createToolCategory({
        name: 'Test Category ' + Date.now(),
        description: 'Test category for integration tests',
        color: '#FF0000'
      });
      testCategoryId = category.id;
    });

    it('should get all tools', async () => {
      const response = await request(app)
        .get('/api/tools')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should create a new tool', async () => {
      const toolData = {
        name: 'Test Tool',
        description: 'A test tool for integration testing',
        categoryId: testCategoryId,
        url: 'https://example.com',
        frameworks: ['React'],
        languages: ['JavaScript'],
        features: ['Testing'],
        integrations: ['Jest'],
        maturityScore: 80,
        popularityScore: 75,
        pricing: 'Free',
        setupComplexity: 'easy',
        costTier: 'free',
        performanceImpact: { buildTime: 'low', bundleSize: 'small' }
      };

      const response = await request(app)
        .post('/api/tools')
        .send(toolData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: toolData.name,
        description: toolData.description,
        categoryId: testCategoryId
      });
      expect(response.body.data.id).toBeDefined();
    });

    it('should get a specific tool by ID', async () => {
      // First create a tool
      const tool = await storage.createTool({
        name: 'Specific Tool',
        description: 'Tool for ID testing',
        categoryId: testCategoryId,
        maturityScore: 80,
        popularityScore: 75
      });

      const response = await request(app)
        .get(`/api/tools/${tool.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(tool.id);
      expect(response.body.data.name).toBe('Specific Tool');
    });

    it('should return 404 for non-existent tool', async () => {
      const response = await request(app)
        .get('/api/tools/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should update an existing tool', async () => {
      // First create a tool
      const tool = await storage.createTool({
        name: 'Original Tool',
        description: 'Original description',
        categoryId: testCategoryId,
        maturityScore: 70,
        popularityScore: 65
      });

      const updateData = {
        name: 'Updated Tool',
        description: 'Updated description',
        maturityScore: 85
      };

      const response = await request(app)
        .put(`/api/tools/${tool.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Tool');
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.data.maturityScore).toBe(85);
    });

    it('should delete an existing tool', async () => {
      // First create a tool
      const tool = await storage.createTool({
        name: 'Tool to Delete',
        description: 'This tool will be deleted',
        categoryId: testCategoryId,
        maturityScore: 60,
        popularityScore: 55
      });

      await request(app)
        .delete(`/api/tools/${tool.id}`)
        .expect(204);

      // Verify tool is deleted
      const getResponse = await request(app)
        .get(`/api/tools/${tool.id}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);
      expect(getResponse.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Categories CRUD Operations', () => {
    it('should get all categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should create a new category', async () => {
      const categoryData = {
        name: 'Integration Test Category',
        description: 'Category created during integration testing',
        color: '#00FF00'
      };

      const response = await request(app)
        .post('/api/categories')
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(categoryData);
      expect(response.body.data.id).toBeDefined();
    });
  });

  describe('Compatibility Operations', () => {
    let toolOne: Tool;
    let toolTwo: Tool;
    let testCategoryId: string;

    beforeEach(async () => {
      // Create test category and tools
      const category = await storage.createToolCategory({
        name: 'Compatibility Test Category ' + Date.now(),
        description: 'Category for compatibility testing',
        color: '#0000FF'
      });
      testCategoryId = category.id;

      toolOne = await storage.createTool({
        name: 'Tool One',
        description: 'First tool for compatibility testing',
        categoryId: testCategoryId,
        maturityScore: 80,
        popularityScore: 75
      });

      toolTwo = await storage.createTool({
        name: 'Tool Two',
        description: 'Second tool for compatibility testing',
        categoryId: testCategoryId,
        maturityScore: 85,
        popularityScore: 80
      });
    });

    it('should get all compatibilities', async () => {
      const response = await request(app)
        .get('/api/compatibilities')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should create a new compatibility', async () => {
      const compatibilityData = {
        toolOneId: toolOne.id,
        toolTwoId: toolTwo.id,
        compatibilityScore: 90,
        notes: 'These tools work great together',
        verifiedIntegration: 1,
        integrationDifficulty: 'easy',
        setupSteps: ['Install both tools', 'Configure integration'],
        codeExample: 'const integration = require("both-tools");',
        dependencies: ['shared-lib']
      };

      const response = await request(app)
        .post('/api/compatibilities')
        .send(compatibilityData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        toolOneId: toolOne.id,
        toolTwoId: toolTwo.id,
        compatibilityScore: 90,
        notes: 'These tools work great together'
      });
      expect(response.body.data.id).toBeDefined();
    });

    it('should get compatibility matrix', async () => {
      // First create a compatibility
      await storage.createCompatibility({
        toolOneId: toolOne.id,
        toolTwoId: toolTwo.id,
        compatibilityScore: 85,
        verifiedIntegration: 1
      });

      const response = await request(app)
        .get('/api/compatibility-matrix')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Should have at least one compatibility entry
      const hasOurCompatibility = response.body.data.some((item: any) => 
        item.toolOne?.id === toolOne.id && item.toolTwo?.id === toolTwo.id
      );
      expect(hasOurCompatibility).toBe(true);
    });
  });

  describe('Stack Validation', () => {
    let toolIds: string[];

    beforeEach(async () => {
      // Create test category and tools
      const category = await storage.createToolCategory({
        name: 'Stack Test Category ' + Date.now(),
        description: 'Category for stack testing',
        color: '#FF00FF'
      });

      const tools = [];
      for (let i = 0; i < 3; i++) {
        const tool = await storage.createTool({
          name: `Stack Tool ${i}`,
          description: `Tool ${i} for stack testing`,
          categoryId: category.id,
          maturityScore: 80 + i,
          popularityScore: 75 + i
        });
        tools.push(tool);
      }
      toolIds = tools.map(t => t.id);
    });

    it('should validate a stack of tools', async () => {
      const response = await request(app)
        .post('/api/stack/validate')
        .send({ toolIds: [toolIds[0], toolIds[1]] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('valid');
      expect(response.body.data).toHaveProperty('conflicts');
      expect(response.body.data).toHaveProperty('dependencies');
      expect(response.body.data).toHaveProperty('warnings');
      expect(response.body.data).toHaveProperty('recommendations');
    });

    it('should return 400 for insufficient tools in stack validation', async () => {
      const response = await request(app)
        .post('/api/stack/validate')
        .send({ toolIds: [toolIds[0]] }) // Only one tool
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('at least 2 tools');
    });

    it('should return 400 for invalid input format', async () => {
      const response = await request(app)
        .post('/api/stack/validate')
        .send({ toolIds: 'not-an-array' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/tools')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      // Express should handle malformed JSON and return 400
      expect(response.status).toBe(400);
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/tools')
        .send({
          name: 'Incomplete Tool'
          // Missing required categoryId
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CREATE_ERROR');
    });

    it('should handle database errors gracefully', async () => {
      // Try to create tool with non-existent category
      const response = await request(app)
        .post('/api/tools')
        .send({
          name: 'Tool with Bad Category',
          description: 'This should fail',
          categoryId: 'non-existent-category-id',
          maturityScore: 80,
          popularityScore: 75
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CREATE_ERROR');
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity between tools and categories', async () => {
      // Create category
      const category = await storage.createToolCategory({
        name: 'Integrity Test Category',
        description: 'Testing referential integrity',
        color: '#FFFF00'
      });

      // Create tool with this category
      const tool = await storage.createTool({
        name: 'Integrity Test Tool',
        description: 'Tool for testing integrity',
        categoryId: category.id,
        maturityScore: 80,
        popularityScore: 75
      });

      // Verify tool was created with correct category
      const response = await request(app)
        .get(`/api/tools/${tool.id}`)
        .expect(200);

      expect(response.body.data.categoryId).toBe(category.id);
    });

    it('should handle concurrent operations safely', async () => {
      const category = await storage.createToolCategory({
        name: 'Concurrent Test Category',
        description: 'Testing concurrent operations',
        color: '#00FFFF'
      });

      // Create multiple tools concurrently
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/tools')
          .send({
            name: `Concurrent Tool ${i}`,
            description: `Tool ${i} created concurrently`,
            categoryId: category.id,
            maturityScore: 80,
            popularityScore: 75
          })
      );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach((response, i) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(`Concurrent Tool ${i}`);
      });
    });
  });
});