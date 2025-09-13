import { describe, it, expect, vi } from 'vitest';
import { mockApiResponse, mockFetch, createMockTool } from './utils';
import { mockTools, mockApiResponses } from './fixtures';

describe('Testing Framework Examples', () => {
  describe('Mock Utilities', () => {
    it('should create mock API responses with delay', async () => {
      const data = { message: 'test' };
      const response = mockApiResponse(data, 10);
      
      const start = Date.now();
      const result = await response;
      const duration = Date.now() - start;
      
      expect(result).toEqual(data);
      expect(duration).toBeGreaterThanOrEqual(10);
    });

    it('should create mock fetch responses', () => {
      const mockData = { success: true };
      const fetchMock = mockFetch(mockData);
      
      expect(fetchMock).toBeDefined();
      expect(vi.isMockFunction(fetchMock)).toBe(true);
    });

    it('should create mock tools with overrides', () => {
      const customTool = createMockTool({ 
        name: 'Custom Tool',
        maturityScore: 95 
      });
      
      expect(customTool.name).toBe('Custom Tool');
      expect(customTool.maturityScore).toBe(95);
      expect(customTool.id).toBe('1'); // default value
    });
  });

  describe('Test Fixtures', () => {
    it('should provide mock tools data', () => {
      expect(mockTools).toHaveLength(3);
      expect(mockTools[0].name).toBe('React');
      expect(mockTools[1].name).toBe('TypeScript');
      expect(mockTools[2].name).toBe('Node.js');
    });

    it('should provide mock API responses', () => {
      expect(mockApiResponses.tools.success.success).toBe(true);
      expect(mockApiResponses.tools.success.data).toEqual(mockTools);
      expect(mockApiResponses.tools.error.success).toBe(false);
    });
  });

  describe('Async Operations', () => {
    it('should handle async operations', async () => {
      const asyncOperation = () => 
        new Promise(resolve => setTimeout(() => resolve('done'), 1));
      
      const result = await asyncOperation();
      expect(result).toBe('done');
    });

    it('should handle rejected promises', async () => {
      const failingOperation = () => 
        Promise.reject(new Error('Operation failed'));
      
      await expect(failingOperation()).rejects.toThrow('Operation failed');
    });
  });

  describe('Mocking and Spies', () => {
    it('should create and use spies', () => {
      const mockFn = vi.fn();
      mockFn('test', 123);
      
      expect(mockFn).toHaveBeenCalledWith('test', 123);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should mock return values', () => {
      const mockFn = vi.fn().mockReturnValue('mocked result');
      
      expect(mockFn()).toBe('mocked result');
    });

    it('should mock implementations', () => {
      const mockFn = vi.fn().mockImplementation((x: number) => x * 2);
      
      expect(mockFn(5)).toBe(10);
    });
  });
});