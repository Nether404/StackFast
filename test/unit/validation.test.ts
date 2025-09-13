/**
 * Unit tests for validation schemas
 * Tests data validation and transformation functions
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  paramSchemas,
  querySchemas,
  bodySchemas,
  fileSchemas,
  securitySchemas
} from '../../server/schemas/validation';

describe('Validation Schemas', () => {
  describe('Parameter Schemas', () => {
    describe('paramSchemas.id', () => {
      it('should validate valid UUID', () => {
        const validId = { id: '123e4567-e89b-12d3-a456-426614174000' };
        expect(() => paramSchemas.id.parse(validId)).not.toThrow();
      });

      it('should reject invalid UUID format', () => {
        const invalidId = { id: 'not-a-uuid' };
        expect(() => paramSchemas.id.parse(invalidId)).toThrow();
      });

      it('should reject missing id', () => {
        expect(() => paramSchemas.id.parse({})).toThrow();
      });

      it('should reject non-string id', () => {
        const invalidId = { id: 123 };
        expect(() => paramSchemas.id.parse(invalidId)).toThrow();
      });
    });

    describe('paramSchemas.compatibilityIds', () => {
      it('should validate valid compatibility IDs', () => {
        const validIds = {
          toolOneId: '123e4567-e89b-12d3-a456-426614174000',
          toolTwoId: '987fcdeb-51a2-43d7-8f9e-123456789abc'
        };
        expect(() => paramSchemas.compatibilityIds.parse(validIds)).not.toThrow();
      });

      it('should reject invalid UUIDs', () => {
        const invalidIds = {
          toolOneId: 'invalid-uuid',
          toolTwoId: '987fcdeb-51a2-43d7-8f9e-123456789abc'
        };
        expect(() => paramSchemas.compatibilityIds.parse(invalidIds)).toThrow();
      });

      it('should reject missing IDs', () => {
        const missingIds = { toolOneId: '123e4567-e89b-12d3-a456-426614174000' };
        expect(() => paramSchemas.compatibilityIds.parse(missingIds)).toThrow();
      });
    });
  });

  describe('Query Schemas', () => {
    describe('querySchemas.pagination', () => {
      it('should validate valid pagination parameters', () => {
        const validPagination = { page: '1', limit: '10', offset: '0' };
        const result = querySchemas.pagination.parse(validPagination);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(10);
        expect(result.offset).toBe(0);
      });

      it('should handle optional parameters', () => {
        const minimalPagination = {};
        expect(() => querySchemas.pagination.parse(minimalPagination)).not.toThrow();
      });

      it('should reject non-numeric strings', () => {
        const invalidPagination = { page: 'not-a-number' };
        expect(() => querySchemas.pagination.parse(invalidPagination)).toThrow();
      });

      it('should transform string numbers to numbers', () => {
        const stringNumbers = { page: '5', limit: '20' };
        const result = querySchemas.pagination.parse(stringNumbers);
        expect(typeof result.page).toBe('number');
        expect(typeof result.limit).toBe('number');
        expect(result.page).toBe(5);
        expect(result.limit).toBe(20);
      });
    });

    describe('querySchemas.search', () => {
      it('should validate search parameters', () => {
        const validSearch = {
          q: 'React',
          category: 'frontend',
          limit: '10'
        };
        const result = querySchemas.search.parse(validSearch);
        expect(result.q).toBe('React');
        expect(result.category).toBe('frontend');
        expect(result.limit).toBe(10);
      });

      it('should reject empty query strings', () => {
        const emptyQuery = { q: '' };
        expect(() => querySchemas.search.parse(emptyQuery)).toThrow();
      });

      it('should reject overly long queries', () => {
        const longQuery = { q: 'a'.repeat(101) };
        expect(() => querySchemas.search.parse(longQuery)).toThrow();
      });

      it('should handle both q and query parameters', () => {
        const withQuery = { query: 'Vue' };
        expect(() => querySchemas.search.parse(withQuery)).not.toThrow();
      });
    });

    describe('querySchemas.toolSearch', () => {
      it('should validate tool search parameters', () => {
        const validToolSearch = {
          query: 'React',
          minPopularity: '80.5',
          minMaturity: '90',
          hasFreeTier: 'true',
          frameworks: 'React,Vue',
          languages: 'JavaScript,TypeScript'
        };
        const result = querySchemas.toolSearch.parse(validToolSearch);
        expect(result.query).toBe('React');
        expect(result.minPopularity).toBe(80.5);
        expect(result.minMaturity).toBe(90);
      });

      it('should handle decimal numbers in score fields', () => {
        const decimalScores = {
          minPopularity: '85.7',
          min_maturity: '92.3'
        };
        const result = querySchemas.toolSearch.parse(decimalScores);
        expect(result.minPopularity).toBe(85.7);
        expect(result.min_maturity).toBe(92.3);
      });

      it('should reject invalid numeric formats', () => {
        const invalidNumbers = { minPopularity: 'not-a-number' };
        expect(() => querySchemas.toolSearch.parse(invalidNumbers)).toThrow();
      });
    });
  });

  describe('Body Schemas', () => {
    describe('bodySchemas.createTool', () => {
      it('should validate valid tool creation data', () => {
        const validTool = {
          name: 'React',
          description: 'A JavaScript library for building user interfaces',
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          url: 'https://reactjs.org',
          frameworks: ['React'],
          languages: ['JavaScript', 'TypeScript'],
          features: ['Component-based', 'Virtual DOM'],
          integrations: ['Redux', 'Router'],
          maturityScore: 95,
          popularityScore: 90,
          setupComplexity: 'medium',
          costTier: 'free'
        };
        expect(() => bodySchemas.createTool.parse(validTool)).not.toThrow();
      });

      it('should require tool name', () => {
        const toolWithoutName = {
          description: 'A tool without a name',
          categoryId: '123e4567-e89b-12d3-a456-426614174000'
        };
        expect(() => bodySchemas.createTool.parse(toolWithoutName)).toThrow();
      });

      it('should reject empty tool name', () => {
        const toolWithEmptyName = {
          name: '',
          categoryId: '123e4567-e89b-12d3-a456-426614174000'
        };
        expect(() => bodySchemas.createTool.parse(toolWithEmptyName)).toThrow();
      });

      it('should reject overly long tool name', () => {
        const toolWithLongName = {
          name: 'a'.repeat(101),
          categoryId: '123e4567-e89b-12d3-a456-426614174000'
        };
        expect(() => bodySchemas.createTool.parse(toolWithLongName)).toThrow();
      });

      it('should validate URL format', () => {
        const toolWithInvalidUrl = {
          name: 'Test Tool',
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          url: 'not-a-valid-url'
        };
        expect(() => bodySchemas.createTool.parse(toolWithInvalidUrl)).toThrow();
      });

      it('should allow empty string for URL', () => {
        const toolWithEmptyUrl = {
          name: 'Test Tool',
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          url: ''
        };
        expect(() => bodySchemas.createTool.parse(toolWithEmptyUrl)).not.toThrow();
      });

      it('should validate score ranges', () => {
        const toolWithInvalidScore = {
          name: 'Test Tool',
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          maturityScore: 150 // Invalid: > 100
        };
        expect(() => bodySchemas.createTool.parse(toolWithInvalidScore)).toThrow();

        const toolWithNegativeScore = {
          name: 'Test Tool',
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          popularityScore: -10 // Invalid: < 0
        };
        expect(() => bodySchemas.createTool.parse(toolWithNegativeScore)).toThrow();
      });

      it('should validate array length limits', () => {
        const toolWithTooManyFrameworks = {
          name: 'Test Tool',
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          frameworks: Array(25).fill('Framework') // Invalid: > 20
        };
        expect(() => bodySchemas.createTool.parse(toolWithTooManyFrameworks)).toThrow();
      });
    });

    describe('bodySchemas.createCompatibility', () => {
      it('should validate valid compatibility data', () => {
        const validCompatibility = {
          toolOneId: '123e4567-e89b-12d3-a456-426614174000',
          toolTwoId: '987fcdeb-51a2-43d7-8f9e-123456789abc',
          compatibilityScore: 85,
          notes: 'Works well together',
          verifiedIntegration: 1,
          integrationDifficulty: 'medium',
          setupSteps: ['Install both tools', 'Configure integration'],
          codeExample: 'const integration = setup();',
          dependencies: ['shared-lib']
        };
        expect(() => bodySchemas.createCompatibility.parse(validCompatibility)).not.toThrow();
      });

      it('should validate compatibility score range', () => {
        const invalidScore = {
          toolOneId: '123e4567-e89b-12d3-a456-426614174000',
          toolTwoId: '987fcdeb-51a2-43d7-8f9e-123456789abc',
          compatibilityScore: 150 // Invalid: > 100
        };
        expect(() => bodySchemas.createCompatibility.parse(invalidScore)).toThrow();

        const negativeScore = {
          toolOneId: '123e4567-e89b-12d3-a456-426614174000',
          toolTwoId: '987fcdeb-51a2-43d7-8f9e-123456789abc',
          compatibilityScore: -10 // Invalid: < 0
        };
        expect(() => bodySchemas.createCompatibility.parse(negativeScore)).toThrow();
      });

      it('should validate integration difficulty enum', () => {
        const invalidDifficulty = {
          toolOneId: '123e4567-e89b-12d3-a456-426614174000',
          toolTwoId: '987fcdeb-51a2-43d7-8f9e-123456789abc',
          compatibilityScore: 85,
          integrationDifficulty: 'impossible' // Invalid: not in enum
        };
        expect(() => bodySchemas.createCompatibility.parse(invalidDifficulty)).toThrow();
      });

      it('should validate array length limits', () => {
        const tooManySteps = {
          toolOneId: '123e4567-e89b-12d3-a456-426614174000',
          toolTwoId: '987fcdeb-51a2-43d7-8f9e-123456789abc',
          compatibilityScore: 85,
          setupSteps: Array(25).fill('Step') // Invalid: > 20
        };
        expect(() => bodySchemas.createCompatibility.parse(tooManySteps)).toThrow();
      });

      it('should validate string length limits', () => {
        const longCodeExample = {
          toolOneId: '123e4567-e89b-12d3-a456-426614174000',
          toolTwoId: '987fcdeb-51a2-43d7-8f9e-123456789abc',
          compatibilityScore: 85,
          codeExample: 'a'.repeat(2001) // Invalid: > 2000
        };
        expect(() => bodySchemas.createCompatibility.parse(longCodeExample)).toThrow();
      });
    });

    describe('bodySchemas.userFeedback', () => {
      it('should validate valid feedback data', () => {
        const validFeedback = {
          type: 'bug_report',
          message: 'Found a bug in the compatibility matrix',
          rating: 4,
          metadata: { page: 'compatibility', browser: 'Chrome' }
        };
        expect(() => bodySchemas.userFeedback.parse(validFeedback)).not.toThrow();
      });

      it('should validate feedback type enum', () => {
        const invalidType = {
          type: 'invalid_type',
          message: 'Test message'
        };
        expect(() => bodySchemas.userFeedback.parse(invalidType)).toThrow();
      });

      it('should validate rating range', () => {
        const invalidRating = {
          type: 'rating',
          rating: 6 // Invalid: > 5
        };
        expect(() => bodySchemas.userFeedback.parse(invalidRating)).toThrow();

        const zeroRating = {
          type: 'rating',
          rating: 0 // Invalid: < 1
        };
        expect(() => bodySchemas.userFeedback.parse(zeroRating)).toThrow();
      });

      it('should validate message length', () => {
        const longMessage = {
          type: 'general_feedback',
          message: 'a'.repeat(2001) // Invalid: > 2000
        };
        expect(() => bodySchemas.userFeedback.parse(longMessage)).toThrow();
      });
    });
  });

  describe('Security Schemas', () => {
    describe('securitySchemas.safeString', () => {
      it('should accept safe strings', () => {
        const safeStrings = [
          'Hello world',
          'This is a normal string',
          'Numbers 123 and symbols !@#',
          ''
        ];
        
        safeStrings.forEach(str => {
          expect(() => securitySchemas.safeString.parse(str)).not.toThrow();
        });
      });

      it('should reject strings with script tags', () => {
        const dangerousStrings = [
          '<script>alert("xss")</script>',
          'Hello <script>malicious()</script> world',
          '<SCRIPT>alert(1)</SCRIPT>'
        ];
        
        dangerousStrings.forEach(str => {
          expect(() => securitySchemas.safeString.parse(str)).toThrow();
        });
      });

      it('should reject strings with javascript: protocol', () => {
        const dangerousStrings = [
          'javascript:alert(1)',
          'JAVASCRIPT:void(0)',
          'Click javascript:malicious()'
        ];
        
        dangerousStrings.forEach(str => {
          expect(() => securitySchemas.safeString.parse(str)).toThrow();
        });
      });

      it('should reject strings with data: protocol', () => {
        const dangerousStrings = [
          'data:text/html,<script>alert(1)</script>',
          'DATA:application/javascript,alert(1)'
        ];
        
        dangerousStrings.forEach(str => {
          expect(() => securitySchemas.safeString.parse(str)).toThrow();
        });
      });

      it('should reject strings with vbscript: protocol', () => {
        const dangerousStrings = [
          'vbscript:msgbox(1)',
          'VBSCRIPT:Execute("malicious")'
        ];
        
        dangerousStrings.forEach(str => {
          expect(() => securitySchemas.safeString.parse(str)).toThrow();
        });
      });
    });

    describe('securitySchemas.safeUrl', () => {
      it('should accept safe HTTP/HTTPS URLs', () => {
        const safeUrls = [
          'https://example.com',
          'http://localhost:3000',
          'https://api.github.com/repos',
          'https://www.google.com/search?q=test'
        ];
        
        safeUrls.forEach(url => {
          expect(() => securitySchemas.safeUrl.parse(url)).not.toThrow();
        });
      });

      it('should reject non-HTTP protocols', () => {
        const dangerousUrls = [
          'javascript:alert(1)',
          'data:text/html,<script>alert(1)</script>',
          'ftp://example.com',
          'file:///etc/passwd'
        ];
        
        dangerousUrls.forEach(url => {
          expect(() => securitySchemas.safeUrl.parse(url)).toThrow();
        });
      });

      it('should reject invalid URL formats', () => {
        const invalidUrls = [
          'not-a-url',
          'http://',
          'https://',
          'just-text'
        ];
        
        invalidUrls.forEach(url => {
          expect(() => securitySchemas.safeUrl.parse(url)).toThrow();
        });
      });
    });

    describe('securitySchemas.safeJson', () => {
      it('should accept safe JSON objects', () => {
        const safeObjects = [
          { name: 'test', value: 123 },
          { items: ['a', 'b', 'c'] },
          { nested: { data: 'safe' } },
          []
        ];
        
        safeObjects.forEach(obj => {
          expect(() => securitySchemas.safeJson.parse(obj)).not.toThrow();
        });
      });

      it('should reject JSON with dangerous content', () => {
        const dangerousObjects = [
          { script: '<script>alert(1)</script>' },
          { url: 'javascript:alert(1)' },
          { data: 'data:text/html,<script>alert(1)</script>' },
          { nested: { dangerous: 'vbscript:msgbox(1)' } }
        ];
        
        dangerousObjects.forEach(obj => {
          expect(() => securitySchemas.safeJson.parse(obj)).toThrow();
        });
      });
    });
  });

  describe('File Schemas', () => {
    describe('fileSchemas.csvUpload', () => {
      it('should validate CSV file uploads', () => {
        const validCsvFile = {
          file: {
            mimetype: 'text/csv',
            size: 1024 * 1024 // 1MB
          }
        };
        expect(() => fileSchemas.csvUpload.parse(validCsvFile)).not.toThrow();
      });

      it('should accept alternative CSV mimetypes', () => {
        const csvMimetypes = ['text/csv', 'application/csv', 'text/plain'];
        
        csvMimetypes.forEach(mimetype => {
          const file = {
            file: { mimetype, size: 1024 }
          };
          expect(() => fileSchemas.csvUpload.parse(file)).not.toThrow();
        });
      });

      it('should reject non-CSV files', () => {
        const invalidFile = {
          file: {
            mimetype: 'application/json',
            size: 1024
          }
        };
        expect(() => fileSchemas.csvUpload.parse(invalidFile)).toThrow();
      });

      it('should reject files that are too large', () => {
        const largeFile = {
          file: {
            mimetype: 'text/csv',
            size: 11 * 1024 * 1024 // 11MB (> 10MB limit)
          }
        };
        expect(() => fileSchemas.csvUpload.parse(largeFile)).toThrow();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined and null values appropriately', () => {
      expect(() => paramSchemas.id.parse({ id: null })).toThrow();
      expect(() => paramSchemas.id.parse({ id: undefined })).toThrow();
    });

    it('should provide meaningful error messages', () => {
      try {
        paramSchemas.id.parse({ id: 'invalid-uuid' });
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        const zodError = error as z.ZodError;
        expect(zodError.issues[0].message).toContain('Invalid ID format');
      }
    });

    it('should handle nested validation errors', () => {
      const invalidTool = {
        name: '', // Invalid: empty string
        categoryId: 'invalid-uuid', // Invalid: not a UUID
        maturityScore: 150 // Invalid: > 100
      };
      
      try {
        bodySchemas.createTool.parse(invalidTool);
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        const zodError = error as z.ZodError;
        expect(zodError.issues.length).toBeGreaterThan(1);
      }
    });
  });
});