/**
 * Unit tests for response optimizer service
 * Tests response optimization and serialization algorithms
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResponseOptimizer } from '../../server/services/response-optimizer';
import type { Response } from 'express';

describe('ResponseOptimizer', () => {
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockResponse = {
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn()
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('optimizeData', () => {
    it('should return data unchanged when no options provided', () => {
      const data = { name: 'React', version: '18.0.0' };
      const result = ResponseOptimizer.optimizeData(data);
      expect(result).toEqual(data);
    });

    it('should exclude specified fields', () => {
      const data = {
        id: '1',
        name: 'React',
        description: 'A JavaScript library',
        internalNotes: 'Internal use only'
      };
      
      const result = ResponseOptimizer.optimizeData(data, {
        excludeFields: ['internalNotes', 'description']
      });
      
      expect(result).toEqual({
        id: '1',
        name: 'React'
      });
    });

    it('should include only specified fields when includeFields is provided', () => {
      const data = {
        id: '1',
        name: 'React',
        description: 'A JavaScript library',
        version: '18.0.0'
      };
      
      const result = ResponseOptimizer.optimizeData(data, {
        includeFields: ['id', 'name']
      });
      
      expect(result).toEqual({
        id: '1',
        name: 'React'
      });
    });

    it('should format dates according to dateFormat option', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const data = { createdAt: date };
      
      // ISO format (default)
      const isoResult = ResponseOptimizer.optimizeData(data, { dateFormat: 'iso' });
      expect(isoResult.createdAt).toBe('2024-01-15T10:30:00.000Z');
      
      // Timestamp format
      const timestampResult = ResponseOptimizer.optimizeData(data, { dateFormat: 'timestamp' });
      expect(timestampResult.createdAt).toBe('2024-01-15T10:30:00.000Z');
      
      // Unix format
      const unixResult = ResponseOptimizer.optimizeData(data, { dateFormat: 'unix' });
      expect(unixResult.createdAt).toBe(Math.floor(date.getTime() / 1000));
    });

    it('should apply number precision', () => {
      const data = {
        score: 85.6789,
        rating: 4.2345
      };
      
      const result = ResponseOptimizer.optimizeData(data, {
        numberPrecision: 2
      });
      
      expect(result.score).toBe(85.68);
      expect(result.rating).toBe(4.23);
    });

    it('should handle arrays correctly', () => {
      const data = [
        { id: 1, name: 'Item 1', secret: 'hidden' },
        { id: 2, name: 'Item 2', secret: 'hidden' }
      ];
      
      const result = ResponseOptimizer.optimizeData(data, {
        excludeFields: ['secret']
      });
      
      expect(result).toEqual([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]);
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          id: 1,
          profile: {
            name: 'John',
            email: 'john@example.com',
            password: 'secret'
          }
        }
      };
      
      const result = ResponseOptimizer.optimizeData(data, {
        excludeFields: ['password']
      });
      
      expect(result.user.profile.password).toBeUndefined();
      expect(result.user.profile.name).toBe('John');
    });

    it('should respect maxDepth limit', () => {
      const deepData = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'too deep'
              }
            }
          }
        }
      };
      
      const result = ResponseOptimizer.optimizeData(deepData, { maxDepth: 3 });
      
      expect(result.level1.level2.level3.level4).toBe('[Max depth reached]');
    });

    it('should handle null and undefined values', () => {
      const data = {
        name: 'Test',
        nullValue: null,
        undefinedValue: undefined
      };
      
      const result = ResponseOptimizer.optimizeData(data);
      
      expect(result.name).toBe('Test');
      expect(result.nullValue).toBeNull();
      expect(result.undefinedValue).toBeUndefined();
    });

    it('should handle primitive values', () => {
      expect(ResponseOptimizer.optimizeData('string')).toBe('string');
      expect(ResponseOptimizer.optimizeData(123)).toBe(123);
      expect(ResponseOptimizer.optimizeData(true)).toBe(true);
      expect(ResponseOptimizer.optimizeData(null)).toBeNull();
    });
  });

  describe('createOptimizedResponse', () => {
    it('should create basic optimized response', () => {
      const data = { name: 'React', version: '18.0.0' };
      const result = ResponseOptimizer.createOptimizedResponse(data);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.meta.timestamp).toBeDefined();
      expect(result.meta.dataSize).toBeDefined();
    });

    it('should include message when provided', () => {
      const data = { name: 'React' };
      const result = ResponseOptimizer.createOptimizedResponse(data, {
        message: 'Data retrieved successfully'
      });
      
      expect(result.message).toBe('Data retrieved successfully');
    });

    it('should include custom metadata', () => {
      const data = { name: 'React' };
      const customMeta = { requestId: 'req-123', userId: 'user-456' };
      
      const result = ResponseOptimizer.createOptimizedResponse(data, {
        meta: customMeta
      });
      
      expect(result.meta.requestId).toBe('req-123');
      expect(result.meta.userId).toBe('user-456');
      expect(result.meta.timestamp).toBeDefined();
    });

    it('should apply serialization options', () => {
      const data = {
        name: 'React',
        secret: 'hidden',
        score: 85.6789
      };
      
      const result = ResponseOptimizer.createOptimizedResponse(data, {
        serializationOptions: {
          excludeFields: ['secret'],
          numberPrecision: 2
        }
      });
      
      expect(result.data.secret).toBeUndefined();
      expect(result.data.score).toBe(85.68);
    });

    it('should calculate data size correctly', () => {
      const data = { name: 'React' };
      const result = ResponseOptimizer.createOptimizedResponse(data);
      
      const expectedSize = JSON.stringify(data).length;
      expect(result.meta.dataSize).toBe(expectedSize);
    });
  });

  describe('streamResponse', () => {
    it('should stream response in chunks', () => {
      const data = Array.from({ length: 2500 }, (_, i) => ({ id: i, name: `Item ${i}` }));
      
      ResponseOptimizer.streamResponse(mockResponse as Response, data, 1000);
      
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Transfer-Encoding', 'chunked');
      expect(mockResponse.write).toHaveBeenCalledWith('{"success":true,"data":[');
      expect(mockResponse.write).toHaveBeenCalledTimes(7); // Header + 3 chunks + separators + footer
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should handle empty data array', () => {
      ResponseOptimizer.streamResponse(mockResponse as Response, [], 1000);
      
      expect(mockResponse.write).toHaveBeenCalledWith('{"success":true,"data":[');
      expect(mockResponse.write).toHaveBeenCalledWith(']}');
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should use default chunk size when not provided', () => {
      const data = [{ id: 1 }];
      
      ResponseOptimizer.streamResponse(mockResponse as Response, data);
      
      expect(mockResponse.write).toHaveBeenCalled();
      expect(mockResponse.end).toHaveBeenCalled();
    });
  });

  describe('compressResponseData', () => {
    it('should return original data for non-arrays', () => {
      const data = { name: 'React' };
      const result = ResponseOptimizer.compressResponseData(data as any);
      expect(result).toBe(data);
    });

    it('should return original data for empty arrays', () => {
      const data: any[] = [];
      const result = ResponseOptimizer.compressResponseData(data);
      expect(result).toBe(data);
    });

    it('should return original data when no common fields found', () => {
      const data = [
        { id: 1, name: 'React' },
        { id: 2, description: 'Vue' }
      ];
      const result = ResponseOptimizer.compressResponseData(data);
      expect(result).toBe(data);
    });

    it('should compress data with common fields', () => {
      const data = [
        { id: 1, name: 'React', category: 'frontend', type: 'library' },
        { id: 2, name: 'Vue', category: 'frontend', type: 'library' },
        { id: 3, name: 'Angular', category: 'frontend', type: 'library' }
      ];
      
      const result = ResponseOptimizer.compressResponseData(data) as any;
      
      expect(result._compressed).toBe(true);
      expect(result._common).toEqual({
        category: 'frontend',
        type: 'library'
      });
      expect(result._data).toEqual([
        { id: 1, name: 'React' },
        { id: 2, name: 'Vue' },
        { id: 3, name: 'Angular' }
      ]);
    });

    it('should handle objects with null values', () => {
      const data = [
        { id: 1, name: 'React', description: null },
        { id: 2, name: 'Vue', description: null }
      ];
      
      const result = ResponseOptimizer.compressResponseData(data);
      
      // Should not compress because null values are objects in the algorithm
      expect(result).toBe(data);
    });

    it('should not compress object fields', () => {
      const data = [
        { id: 1, name: 'React', meta: { version: '18' } },
        { id: 2, name: 'Vue', meta: { version: '18' } }
      ];
      
      const result = ResponseOptimizer.compressResponseData(data);
      expect(result).toBe(data); // Should not compress because meta is an object
    });
  });

  describe('addPerformanceMetadata', () => {
    it('should calculate response time correctly', () => {
      const startTime = Date.now() - 100; // 100ms ago
      const result = ResponseOptimizer.addPerformanceMetadata(startTime);
      
      expect(result.performance.responseTime).toMatch(/^\d+ms$/);
      expect(result.performance.timestamp).toBeDefined();
      expect(result.performance.memoryUsage).toBeDefined();
    });

    it('should include additional metadata', () => {
      const startTime = Date.now();
      const additionalMeta = { requestId: 'req-123' };
      
      const result = ResponseOptimizer.addPerformanceMetadata(startTime, additionalMeta);
      
      expect(result.requestId).toBe('req-123');
      expect(result.performance).toBeDefined();
    });

    it('should include memory usage information', () => {
      const startTime = Date.now();
      const result = ResponseOptimizer.addPerformanceMetadata(startTime);
      
      expect(result.performance.memoryUsage).toHaveProperty('rss');
      expect(result.performance.memoryUsage).toHaveProperty('heapTotal');
      expect(result.performance.memoryUsage).toHaveProperty('heapUsed');
      expect(result.performance.memoryUsage).toHaveProperty('external');
    });
  });

  describe('createDTO', () => {
    it('should map single object according to mapping', () => {
      const data = {
        id: '1',
        fullName: 'John Doe',
        emailAddress: 'john@example.com',
        internalId: 'internal-123'
      };
      
      const mapping = {
        id: 'userId',
        fullName: 'name',
        emailAddress: 'email'
      };
      
      const result = ResponseOptimizer.createDTO(data, mapping);
      
      expect(result).toEqual({
        userId: '1',
        name: 'John Doe',
        email: 'john@example.com'
      });
    });

    it('should map array of objects', () => {
      const data = [
        { id: '1', name: 'John' },
        { id: '2', name: 'Jane' }
      ];
      
      const mapping = {
        id: 'userId',
        name: 'fullName'
      };
      
      const result = ResponseOptimizer.createDTO(data, mapping);
      
      expect(result).toEqual([
        { userId: '1', fullName: 'John' },
        { userId: '2', fullName: 'Jane' }
      ]);
    });

    it('should apply function transformations', () => {
      const data = {
        score: 85.6789,
        createdAt: '2024-01-15T10:30:00Z'
      };
      
      const mapping = {
        score: (value: number) => Math.round(value),
        createdAt: (value: string) => new Date(value).getTime()
      };
      
      const result = ResponseOptimizer.createDTO(data, mapping);
      
      expect(result.score).toBe(86);
      expect(result.createdAt).toBe(new Date('2024-01-15T10:30:00Z').getTime());
    });

    it('should handle primitive values', () => {
      const result = ResponseOptimizer.createDTO('string', {});
      expect(result).toBe('string');
      
      const result2 = ResponseOptimizer.createDTO(null, {});
      expect(result2).toBeNull();
    });
  });

  describe('createLazyResponse', () => {
    it('should create lazy response with loader methods', () => {
      const data = { id: '1', name: 'React' };
      const lazyFields = {
        details: vi.fn().mockResolvedValue({ description: 'A JavaScript library' }),
        stats: vi.fn().mockResolvedValue({ downloads: 1000000 })
      };
      
      const result = ResponseOptimizer.createLazyResponse(data, lazyFields);
      
      expect(result.id).toBe('1');
      expect(result.name).toBe('React');
      expect(result._lazy).toEqual(['details', 'stats']);
      expect(typeof result.loadDetails).toBe('function');
      expect(typeof result.loadStats).toBe('function');
    });

    it('should create proper loader method names', () => {
      const data = { id: '1' };
      const lazyFields = {
        userProfile: vi.fn(),
        orderHistory: vi.fn()
      };
      
      const result = ResponseOptimizer.createLazyResponse(data, lazyFields);
      
      expect(typeof result.loadUserProfile).toBe('function');
      expect(typeof result.loadOrderHistory).toBe('function');
    });
  });

  describe('optimizeForMobile', () => {
    it('should apply mobile optimizations', () => {
      const data = {
        id: '1',
        name: 'React',
        description: 'A JavaScript library for building user interfaces',
        notes: 'Internal notes',
        metadata: { internal: true },
        score: 85.6789,
        nested: {
          deep: {
            veryDeep: {
              tooDeep: 'value'
            }
          }
        }
      };
      
      const result = ResponseOptimizer.optimizeForMobile(data);
      
      expect(result.description).toBeUndefined();
      expect(result.notes).toBeUndefined();
      expect(result.metadata).toBeUndefined();
      expect(result.score).toBe(85.68);
      expect(result.nested.deep.veryDeep.tooDeep).toBe('[Max depth reached]');
    });
  });

  describe('createSummaryResponse', () => {
    it('should create summary with default fields', () => {
      const data = [
        { id: '1', name: 'React', description: 'Library', version: '18.0.0' },
        { id: '2', name: 'Vue', description: 'Framework', version: '3.0.0' }
      ];
      
      const result = ResponseOptimizer.createSummaryResponse(data);
      
      expect(result.summary).toEqual([
        { id: '1', name: 'React' },
        { id: '2', name: 'Vue' }
      ]);
      expect(result._isSummary).toBe(true);
      expect(result.totalCount).toBe(2);
    });

    it('should create summary with custom fields', () => {
      const data = [
        { id: '1', name: 'React', version: '18.0.0' },
        { id: '2', name: 'Vue', version: '3.0.0' }
      ];
      
      const result = ResponseOptimizer.createSummaryResponse(data, ['id', 'version']);
      
      expect(result.summary).toEqual([
        { id: '1', version: '18.0.0' },
        { id: '2', version: '3.0.0' }
      ]);
    });

    it('should exclude count when requested', () => {
      const data = [{ id: '1', name: 'React' }];
      const result = ResponseOptimizer.createSummaryResponse(data, ['id', 'name'], false);
      
      expect(result.totalCount).toBeUndefined();
      expect(result._isSummary).toBe(true);
    });

    it('should handle non-object items', () => {
      const data = ['string1', 'string2'];
      const result = ResponseOptimizer.createSummaryResponse(data);
      
      expect(result.summary).toEqual(['string1', 'string2']);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle circular references gracefully', () => {
      const obj: any = { name: 'test' };
      obj.self = obj; // Create circular reference
      
      // Should not throw, but may truncate at max depth
      expect(() => {
        ResponseOptimizer.optimizeData(obj, { maxDepth: 2 });
      }).not.toThrow();
    });

    it('should handle very large numbers', () => {
      const data = {
        largeNumber: Number.MAX_SAFE_INTEGER,
        veryLargeNumber: Number.MAX_VALUE
      };
      
      const result = ResponseOptimizer.optimizeData(data, { numberPrecision: 2 });
      
      expect(typeof result.largeNumber).toBe('number');
      expect(typeof result.veryLargeNumber).toBe('number');
    });

    it('should handle special number values', () => {
      const data = {
        infinity: Infinity,
        negativeInfinity: -Infinity,
        notANumber: NaN
      };
      
      const result = ResponseOptimizer.optimizeData(data);
      
      expect(result.infinity).toBe(Infinity);
      expect(result.negativeInfinity).toBe(-Infinity);
      expect(Number.isNaN(result.notANumber)).toBe(true);
    });

    it('should handle empty objects and arrays', () => {
      const data = {
        emptyObject: {},
        emptyArray: [],
        nullValue: null,
        undefinedValue: undefined
      };
      
      const result = ResponseOptimizer.optimizeData(data);
      
      expect(result.emptyObject).toEqual({});
      expect(result.emptyArray).toEqual([]);
      expect(result.nullValue).toBeNull();
      expect(result.undefinedValue).toBeUndefined();
    });
  });
});