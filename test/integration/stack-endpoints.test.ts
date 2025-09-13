import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';
import { storage } from '../../server/storage';
import type { Tool, ToolCategory } from '@shared/schema';

describe('Stack Management Endpoints Integration Tests', () => {
  let app: express.Application;
  let server: any;
  let tools: Tool[];
  let category: ToolCategory;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Clean up and set up test data
    await storage.clearAllTools();
    await storage.clearAllCompatibilities();

    // Create test category
    category = await storage.createToolCategory({
      name: 'Web Development',
      description: 'Web development tools and frameworks',
      color: '#FF4500'
    });

    // Create test tools
    tools = [];
    const toolNames = ['React', 'TypeScript', 'Node.js', 'Express', 'MongoDB'];
    
    for (const name of toolNames) {
      const tool = await storage.createTool({
        name,
        description: `${name} is a popular development tool`,
        categoryId: category.id,
        url: `https://${name.toLowerCase()}.org`,
        frameworks: name === 'React' ? ['React'] : [],
        languages: name === 'TypeScript' ? ['TypeScript'] : ['JavaScript'],
        features: [`${name} Features`],
        integrations: [],
        maturityScore: 85 + Math.random() * 10,
        popularityScore: 80 + Math.random() * 15,
        pricing: 'Free',
        setupComplexity: 'medium',
        costTier: 'free',
        performanceImpact: { buildTime: 'medium', bundleSize: 'medium' },
        apiLastSync: new Date()
      });
      tools.push(tool);
    }

    // Create some compatibility relationships
    await storage.createCompatibility({
      toolOneId: tools[0].id, // React
      toolTwoId: tools[1].id, // TypeScript
      compatibilityScore: 95,
      notes: 'React and TypeScript work excellently together',
      verifiedIntegration: 1,
      integrationDifficulty: 'easy',
      setupSteps: ['Install TypeScript', 'Configure tsconfig.json'],
      codeExample: 'const Component: React.FC = () => <div>Hello</div>;',
      dependencies: ['@types/react']
    });

    await storage.createCompatibility({
      toolOneId: tools[1].id, // TypeScript
      toolTwoId: tools[2].id, // Node.js
      compatibilityScore: 90,
      notes: 'TypeScript provides excellent Node.js support',
      verifiedIntegration: 1,
      integrationDifficulty: 'easy',
      setupSteps: ['Install @types/node', 'Configure for Node.js'],
      codeExample: 'import express from "express";',
      dependencies: ['@types/node']
    });
  });

  describe('GET /api/stack-templates', () => {
    it('should return empty array when no templates exist', async () => {
      const response = await request(app)
        .get('/api/stack-templates')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all stack templates', async () => {
      // Create a stack template
      await storage.createStackTemplate({
        name: 'MERN Stack',
        description: 'MongoDB, Express, React, Node.js stack',
        category: 'Full Stack Web',
        toolIds: [tools[0].id, tools[2].id, tools[3].id, tools[4].id],
        useCase: 'Modern web applications',
        setupComplexity: 'medium',
        estimatedCost: '$0-50/month',
        pros: ['Popular', 'JavaScript everywhere', 'Large community'],
        cons: ['Learning curve', 'Rapid changes'],
        harmonyScore: 85,
        popularityRank: 1
      });

      const response = await request(app)
        .get('/api/stack-templates')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        name: 'MERN Stack',
        category: 'Full Stack Web',
        harmonyScore: 85
      });
    });
  });

  describe('GET /api/stack-templates/:id', () => {
    let templateId: string;

    beforeEach(async () => {
      const template = await storage.createStackTemplate({
        name: 'Test Stack',
        description: 'Test stack template',
        category: 'Testing',
        toolIds: [tools[0].id, tools[1].id],
        useCase: 'Testing purposes',
        setupComplexity: 'easy',
        harmonyScore: 80
      });
      templateId = template.id;
    });

    it('should return specific stack template', async () => {
      const response = await request(app)
        .get(`/api/stack-templates/${templateId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        name: 'Test Stack',
        category: 'Testing',
        harmonyScore: 80
      });
    });

    it('should return 404 for non-existent template', async () => {
      const response = await request(app)
        .get('/api/stack-templates/non-existent-id')
        .expect(404);

      expect(response.body.message).toBe('Stack template not found');
    });
  });

  describe('POST /api/stack/validate', () => {
    it('should validate a compatible stack', async () => {
      const response = await request(app)
        .post('/api/stack/validate')
        .send({
          toolIds: [tools[0].id, tools[1].id] // React + TypeScript (high compatibility)
        })
        .expect(200);

      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('conflicts');
      expect(response.body).toHaveProperty('dependencies');
      expect(response.body).toHaveProperty('warnings');
      expect(response.body).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.conflicts)).toBe(true);
      expect(Array.isArray(response.body.dependencies)).toBe(true);
      expect(Array.isArray(response.body.warnings)).toBe(true);
      expect(Array.isArray(response.body.recommendations)).toBe(true);
    });

    it('should return validation errors for incompatible tools', async () => {
      // Create an incompatible tool pair
      const incompatibleTool = await storage.createTool({
        name: 'Incompatible Tool',
        description: 'A tool that conflicts with others',
        categoryId: category.id,
        maturityScore: 50,
        popularityScore: 30,
        setupComplexity: 'hard',
        costTier: 'paid',
        performanceImpact: { buildTime: 'high', bundleSize: 'large' }
      });

      await storage.createCompatibility({
        toolOneId: tools[0].id,
        toolTwoId: incompatibleTool.id,
        compatibilityScore: 20, // Low compatibility
        notes: 'These tools conflict with each other',
        verifiedIntegration: 0,
        integrationDifficulty: 'hard'
      });

      const response = await request(app)
        .post('/api/stack/validate')
        .send({
          toolIds: [tools[0].id, incompatibleTool.id]
        })
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.conflicts.length).toBeGreaterThan(0);
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/stack/validate')
        .send({
          toolIds: [tools[0].id] // Only one tool
        })
        .expect(400);

      expect(response.body.message).toBe('toolIds must contain at least 2 tools');
    });

    it('should return 400 for non-array input', async () => {
      const response = await request(app)
        .post('/api/stack/validate')
        .send({
          toolIds: 'not-an-array'
        })
        .expect(400);

      expect(response.body.message).toBe('toolIds must contain at least 2 tools');
    });

    it('should handle empty array', async () => {
      const response = await request(app)
        .post('/api/stack/validate')
        .send({
          toolIds: []
        })
        .expect(400);

      expect(response.body.message).toBe('toolIds must contain at least 2 tools');
    });
  });

  describe('POST /api/stack/harmony-score', () => {
    it('should calculate harmony score for compatible tools', async () => {
      const response = await request(app)
        .post('/api/stack/harmony-score')
        .send({
          toolIds: [tools[0].id, tools[1].id, tools[2].id]
        })
        .expect(200);

      expect(response.body).toHaveProperty('harmonyScore');
      expect(response.body).toHaveProperty('toolIds');
      expect(typeof response.body.harmonyScore).toBe('number');
      expect(response.body.harmonyScore).toBeGreaterThanOrEqual(0);
      expect(response.body.harmonyScore).toBeLessThanOrEqual(100);
      expect(response.body.toolIds).toEqual([tools[0].id, tools[1].id, tools[2].id]);
    });

    it('should return lower score for incompatible tools', async () => {
      // Create incompatible tools
      const incompatibleTool1 = await storage.createTool({
        name: 'Conflict Tool 1',
        description: 'First conflicting tool',
        categoryId: category.id,
        maturityScore: 40,
        popularityScore: 30,
        setupComplexity: 'hard',
        costTier: 'enterprise',
        performanceImpact: { buildTime: 'high', bundleSize: 'large' }
      });

      const incompatibleTool2 = await storage.createTool({
        name: 'Conflict Tool 2',
        description: 'Second conflicting tool',
        categoryId: category.id,
        maturityScore: 35,
        popularityScore: 25,
        setupComplexity: 'hard',
        costTier: 'enterprise',
        performanceImpact: { buildTime: 'high', bundleSize: 'large' }
      });

      // Create low compatibility
      await storage.createCompatibility({
        toolOneId: incompatibleTool1.id,
        toolTwoId: incompatibleTool2.id,
        compatibilityScore: 15,
        notes: 'These tools have major conflicts',
        verifiedIntegration: 0,
        integrationDifficulty: 'hard'
      });

      const response = await request(app)
        .post('/api/stack/harmony-score')
        .send({
          toolIds: [incompatibleTool1.id, incompatibleTool2.id]
        })
        .expect(200);

      expect(response.body.harmonyScore).toBeLessThan(50);
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

    it('should return 400 for non-array input', async () => {
      const response = await request(app)
        .post('/api/stack/harmony-score')
        .send({
          toolIds: 'not-an-array'
        })
        .expect(400);

      expect(response.body.message).toBe('toolIds must be a non-empty array');
    });

    it('should handle single tool gracefully', async () => {
      const response = await request(app)
        .post('/api/stack/harmony-score')
        .send({
          toolIds: [tools[0].id]
        })
        .expect(200);

      expect(response.body.harmonyScore).toBeDefined();
      expect(typeof response.body.harmonyScore).toBe('number');
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
      // Should recommend compatible tools
      response.body.forEach((tool: any) => {
        expect(tool).toHaveProperty('id');
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
      });
    });

    it('should filter recommendations by category', async () => {
      const response = await request(app)
        .post('/api/stack/recommendations')
        .send({
          toolIds: [tools[0].id],
          category: category.id
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // All recommendations should be from the specified category
      response.body.forEach((tool: any) => {
        expect(tool.categoryId).toBe(category.id);
      });
    });

    it('should return empty array for non-existent tools', async () => {
      const response = await request(app)
        .post('/api/stack/recommendations')
        .send({
          toolIds: ['non-existent-tool-id']
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

    it('should handle empty toolIds array', async () => {
      const response = await request(app)
        .post('/api/stack/recommendations')
        .send({
          toolIds: []
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/stack/bulk-compatibility', () => {
    it('should return compatibility matrix for multiple tools', async () => {
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
      expect(response.body.meta.toolCount).toBe(3);
      expect(response.body.meta.pairCount).toBeDefined();

      // Check structure of compatibility data
      response.body.data.forEach((item: any) => {
        expect(item).toHaveProperty('toolOneId');
        expect(item).toHaveProperty('toolTwoId');
        expect(item).toHaveProperty('score');
        expect(typeof item.score).toBe('number');
      });
    });

    it('should handle large tool sets efficiently', async () => {
      // Create additional tools for bulk testing
      const additionalTools = [];
      for (let i = 0; i < 10; i++) {
        const tool = await storage.createTool({
          name: `Bulk Tool ${i}`,
          description: `Tool for bulk compatibility testing ${i}`,
          categoryId: category.id,
          maturityScore: 70 + Math.random() * 20,
          popularityScore: 60 + Math.random() * 30,
          setupComplexity: 'medium',
          costTier: 'free',
          performanceImpact: { buildTime: 'medium', bundleSize: 'medium' }
        });
        additionalTools.push(tool);
      }

      const allToolIds = [...tools.slice(0, 3), ...additionalTools.slice(0, 7)].map(t => t.id);

      const response = await request(app)
        .post('/api/stack/bulk-compatibility')
        .send({
          toolIds: allToolIds
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.meta.toolCount).toBe(10);
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

    it('should return 400 for empty array', async () => {
      const response = await request(app)
        .post('/api/stack/bulk-compatibility')
        .send({
          toolIds: []
        })
        .expect(400);

      expect(response.body.message).toBe('toolIds must contain at least 2 tools');
    });

    it('should return 400 for non-array input', async () => {
      const response = await request(app)
        .post('/api/stack/bulk-compatibility')
        .send({
          toolIds: 'not-an-array'
        })
        .expect(400);

      expect(response.body.message).toBe('toolIds must contain at least 2 tools');
    });

    it('should handle duplicate tool IDs gracefully', async () => {
      const response = await request(app)
        .post('/api/stack/bulk-compatibility')
        .send({
          toolIds: [tools[0].id, tools[1].id, tools[0].id] // Duplicate
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Migration Path Endpoints', () => {
    describe('GET /api/migration-paths/:fromToolId/:toToolId', () => {
      let migrationPathId: string;

      beforeEach(async () => {
        const migrationPath = await storage.createMigrationPath({
          fromToolId: tools[0].id,
          toToolId: tools[1].id,
          difficulty: 'easy',
          estimatedTime: '1-2 days',
          steps: [
            'Install TypeScript',
            'Rename .js files to .ts',
            'Add type annotations',
            'Configure tsconfig.json'
          ],
          considerations: [
            'Existing JavaScript code needs type annotations',
            'Build process may need updates'
          ],
          dataPortability: 95
        });
        migrationPathId = migrationPath.id;
      });

      it('should return migration path between two tools', async () => {
        const response = await request(app)
          .get(`/api/migration-paths/${tools[0].id}/${tools[1].id}`)
          .expect(200);

        expect(response.body).toMatchObject({
          fromToolId: tools[0].id,
          toToolId: tools[1].id,
          difficulty: 'easy',
          estimatedTime: '1-2 days',
          dataPortability: 95
        });
        expect(Array.isArray(response.body.steps)).toBe(true);
        expect(Array.isArray(response.body.considerations)).toBe(true);
      });

      it('should return 404 for non-existent migration path', async () => {
        const response = await request(app)
          .get(`/api/migration-paths/${tools[2].id}/${tools[3].id}`)
          .expect(404);

        expect(response.body.message).toBe('Migration path not found');
      });
    });

    describe('GET /api/migration-path', () => {
      it('should return enhanced migration analysis', async () => {
        const response = await request(app)
          .get(`/api/migration-path?from=${tools[0].id}&to=${tools[1].id}`)
          .expect(200);

        expect(response.body).toHaveProperty('difficulty');
        expect(response.body).toHaveProperty('estimatedTime');
        expect(response.body).toHaveProperty('steps');
        expect(response.body).toHaveProperty('considerations');
        expect(response.body).toHaveProperty('benefits');
        expect(Array.isArray(response.body.steps)).toBe(true);
        expect(Array.isArray(response.body.considerations)).toBe(true);
        expect(Array.isArray(response.body.benefits)).toBe(true);
      });

      it('should return 400 for missing parameters', async () => {
        const response = await request(app)
          .get('/api/migration-path?from=' + tools[0].id)
          .expect(400);

        expect(response.body.message).toBe("Please provide both 'from' and 'to' tool IDs");
      });

      it('should return 404 for non-existent tools', async () => {
        const response = await request(app)
          .get('/api/migration-path?from=non-existent&to=also-non-existent')
          .expect(404);

        expect(response.body.message).toBe('One or both tools not found');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON in stack validation', async () => {
      const response = await request(app)
        .post('/api/stack/validate')
        .set('Content-Type', 'application/json')
        .send('{"toolIds": [invalid json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle extremely large tool arrays', async () => {
      // Create many tools
      const manyToolIds = [];
      for (let i = 0; i < 100; i++) {
        const tool = await storage.createTool({
          name: `Mass Tool ${i}`,
          description: `Tool ${i} for mass testing`,
          categoryId: category.id,
          maturityScore: 50 + Math.random() * 40,
          popularityScore: 40 + Math.random() * 50,
          setupComplexity: 'medium',
          costTier: 'free',
          performanceImpact: { buildTime: 'medium', bundleSize: 'medium' }
        });
        manyToolIds.push(tool.id);
      }

      const response = await request(app)
        .post('/api/stack/harmony-score')
        .send({
          toolIds: manyToolIds
        })
        .expect(200);

      expect(response.body.harmonyScore).toBeDefined();
      expect(typeof response.body.harmonyScore).toBe('number');
    });

    it('should handle non-existent tool IDs in stack operations', async () => {
      const response = await request(app)
        .post('/api/stack/validate')
        .send({
          toolIds: ['non-existent-1', 'non-existent-2']
        })
        .expect(200);

      // Should still return a validation result, even if tools don't exist
      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('conflicts');
      expect(response.body).toHaveProperty('warnings');
    });

    it('should handle mixed valid and invalid tool IDs', async () => {
      const response = await request(app)
        .post('/api/stack/harmony-score')
        .send({
          toolIds: [tools[0].id, 'non-existent-tool', tools[1].id]
        })
        .expect(200);

      expect(response.body.harmonyScore).toBeDefined();
      expect(typeof response.body.harmonyScore).toBe('number');
    });
  });
});