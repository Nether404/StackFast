/**
 * Unit tests for type utility functions
 * Tests data validation and transformation functions
 */

import { describe, it, expect } from 'vitest';
import {
  isNotNull,
  hasItems,
  safeArray,
  safeString,
  safeNumber,
  isToolWithCategory,
  isCompatibilityMatrix,
  isToolCategory,
  safeAccess,
  safeNestedAccess,
  filterWithTypeGuard,
  safeMap,
  safeFind,
  safeFilter,
  safeSort,
  safeSlice,
  safeJoin,
  safeLength,
  isNonEmptyString,
  isValidNumber,
  clamp,
  formatPercentage,
  safeTruncate
} from '../../client/src/lib/type-utils';
import type { ToolWithCategory, CompatibilityMatrix, ToolCategory } from '@shared/schema';

describe('Type Utils - Data Validation and Transformation', () => {
  describe('Type Guards', () => {
    describe('isNotNull', () => {
      it('should return true for valid values', () => {
        expect(isNotNull('string')).toBe(true);
        expect(isNotNull(0)).toBe(true);
        expect(isNotNull(false)).toBe(true);
        expect(isNotNull([])).toBe(true);
        expect(isNotNull({})).toBe(true);
      });

      it('should return false for null and undefined', () => {
        expect(isNotNull(null)).toBe(false);
        expect(isNotNull(undefined)).toBe(false);
      });
    });

    describe('hasItems', () => {
      it('should return true for non-empty arrays', () => {
        expect(hasItems([1, 2, 3])).toBe(true);
        expect(hasItems(['a'])).toBe(true);
      });

      it('should return false for empty arrays', () => {
        expect(hasItems([])).toBe(false);
      });

      it('should return false for null and undefined', () => {
        expect(hasItems(null)).toBe(false);
        expect(hasItems(undefined)).toBe(false);
      });

      it('should return false for non-arrays', () => {
        expect(hasItems('string' as any)).toBe(false);
        expect(hasItems(123 as any)).toBe(false);
        expect(hasItems({} as any)).toBe(false);
      });
    });

    describe('isNonEmptyString', () => {
      it('should return true for non-empty strings', () => {
        expect(isNonEmptyString('hello')).toBe(true);
        expect(isNonEmptyString('a')).toBe(true);
        expect(isNonEmptyString('  text  ')).toBe(true);
      });

      it('should return false for empty or whitespace strings', () => {
        expect(isNonEmptyString('')).toBe(false);
        expect(isNonEmptyString('   ')).toBe(false);
        expect(isNonEmptyString('\t\n')).toBe(false);
      });

      it('should return false for null and undefined', () => {
        expect(isNonEmptyString(null)).toBe(false);
        expect(isNonEmptyString(undefined)).toBe(false);
      });

      it('should return false for non-strings', () => {
        expect(isNonEmptyString(123 as any)).toBe(false);
        expect(isNonEmptyString([] as any)).toBe(false);
        expect(isNonEmptyString({} as any)).toBe(false);
      });
    });

    describe('isValidNumber', () => {
      it('should return true for valid numbers', () => {
        expect(isValidNumber(0)).toBe(true);
        expect(isValidNumber(42)).toBe(true);
        expect(isValidNumber(-10)).toBe(true);
        expect(isValidNumber(3.14)).toBe(true);
        expect(isValidNumber(Infinity)).toBe(true);
        expect(isValidNumber(-Infinity)).toBe(true);
      });

      it('should return false for NaN', () => {
        expect(isValidNumber(NaN)).toBe(false);
      });

      it('should return false for null and undefined', () => {
        expect(isValidNumber(null)).toBe(false);
        expect(isValidNumber(undefined)).toBe(false);
      });

      it('should return false for non-numbers', () => {
        expect(isValidNumber('123' as any)).toBe(false);
        expect(isValidNumber([] as any)).toBe(false);
        expect(isValidNumber({} as any)).toBe(false);
      });
    });
  });

  describe('Safe Access Functions', () => {
    describe('safeArray', () => {
      it('should return the array if valid', () => {
        const arr = [1, 2, 3];
        expect(safeArray(arr)).toBe(arr);
      });

      it('should return empty array for null and undefined', () => {
        expect(safeArray(null)).toEqual([]);
        expect(safeArray(undefined)).toEqual([]);
      });
    });

    describe('safeString', () => {
      it('should return the string if valid', () => {
        expect(safeString('hello')).toBe('hello');
        expect(safeString('')).toBe('');
      });

      it('should return empty string for null and undefined', () => {
        expect(safeString(null)).toBe('');
        expect(safeString(undefined)).toBe('');
      });
    });

    describe('safeNumber', () => {
      it('should return the number if valid', () => {
        expect(safeNumber(42)).toBe(42);
        expect(safeNumber(0)).toBe(0);
        expect(safeNumber(-10)).toBe(-10);
      });

      it('should return default value for null and undefined', () => {
        expect(safeNumber(null)).toBe(0);
        expect(safeNumber(undefined)).toBe(0);
        expect(safeNumber(null, 100)).toBe(100);
        expect(safeNumber(undefined, -5)).toBe(-5);
      });
    });

    describe('safeAccess', () => {
      it('should return property value if object exists', () => {
        const obj = { name: 'test', value: 42 };
        expect(safeAccess(obj, 'name')).toBe('test');
        expect(safeAccess(obj, 'value')).toBe(42);
      });

      it('should return undefined for null/undefined objects', () => {
        expect(safeAccess(null, 'name')).toBeUndefined();
        expect(safeAccess(undefined, 'name')).toBeUndefined();
      });

      it('should return undefined for non-existent properties', () => {
        const obj = { name: 'test' };
        expect(safeAccess(obj, 'nonexistent' as any)).toBeUndefined();
      });
    });

    describe('safeNestedAccess', () => {
      it('should return nested property value if path exists', () => {
        const obj = { user: { profile: { name: 'John' } } };
        expect(safeNestedAccess(obj, 'user', 'profile')).toEqual({ name: 'John' });
      });

      it('should return undefined for broken chains', () => {
        const obj = { user: null };
        expect(safeNestedAccess(obj, 'user', 'profile' as any)).toBeUndefined();
      });

      it('should return undefined for null/undefined objects', () => {
        expect(safeNestedAccess(null, 'user', 'profile')).toBeUndefined();
        expect(safeNestedAccess(undefined, 'user', 'profile')).toBeUndefined();
      });
    });
  });

  describe('Array Utility Functions', () => {
    describe('safeMap', () => {
      it('should map array if valid', () => {
        const arr = [1, 2, 3];
        const result = safeMap(arr, x => x * 2);
        expect(result).toEqual([2, 4, 6]);
      });

      it('should return empty array for null/undefined', () => {
        const result = safeMap(null, x => x * 2);
        expect(result).toEqual([]);
      });

      it('should pass index to mapper function', () => {
        const arr = ['a', 'b'];
        const result = safeMap(arr, (item, index) => `${item}${index}`);
        expect(result).toEqual(['a0', 'b1']);
      });
    });

    describe('safeFind', () => {
      it('should find item if exists', () => {
        const arr = [1, 2, 3, 4];
        const result = safeFind(arr, x => x > 2);
        expect(result).toBe(3);
      });

      it('should return undefined if not found', () => {
        const arr = [1, 2, 3];
        const result = safeFind(arr, x => x > 10);
        expect(result).toBeUndefined();
      });

      it('should return undefined for null/undefined arrays', () => {
        const result = safeFind(null, x => x > 2);
        expect(result).toBeUndefined();
      });
    });

    describe('safeFilter', () => {
      it('should filter array if valid', () => {
        const arr = [1, 2, 3, 4, 5];
        const result = safeFilter(arr, x => x % 2 === 0);
        expect(result).toEqual([2, 4]);
      });

      it('should return empty array for null/undefined', () => {
        const result = safeFilter(null, x => x % 2 === 0);
        expect(result).toEqual([]);
      });
    });

    describe('safeSort', () => {
      it('should sort array if valid', () => {
        const arr = [3, 1, 4, 1, 5];
        const result = safeSort(arr);
        expect(result).toEqual([1, 1, 3, 4, 5]);
      });

      it('should sort with custom compare function', () => {
        const arr = [3, 1, 4, 1, 5];
        const result = safeSort(arr, (a, b) => b - a);
        expect(result).toEqual([5, 4, 3, 1, 1]);
      });

      it('should return empty array for null/undefined', () => {
        const result = safeSort(null);
        expect(result).toEqual([]);
      });
    });

    describe('safeSlice', () => {
      it('should slice array if valid', () => {
        const arr = [1, 2, 3, 4, 5];
        const result = safeSlice(arr, 1, 4);
        expect(result).toEqual([2, 3, 4]);
      });

      it('should handle start parameter only', () => {
        const arr = [1, 2, 3, 4, 5];
        const result = safeSlice(arr, 2);
        expect(result).toEqual([3, 4, 5]);
      });

      it('should return empty array for null/undefined', () => {
        const result = safeSlice(null, 1, 3);
        expect(result).toEqual([]);
      });
    });

    describe('safeJoin', () => {
      it('should join array with default separator', () => {
        const arr = ['a', 'b', 'c'];
        const result = safeJoin(arr);
        expect(result).toBe('a, b, c');
      });

      it('should join array with custom separator', () => {
        const arr = ['a', 'b', 'c'];
        const result = safeJoin(arr, ' | ');
        expect(result).toBe('a | b | c');
      });

      it('should return empty string for null/undefined', () => {
        const result = safeJoin(null);
        expect(result).toBe('');
      });

      it('should handle empty array', () => {
        const result = safeJoin([]);
        expect(result).toBe('');
      });
    });

    describe('safeLength', () => {
      it('should return array length if valid', () => {
        expect(safeLength([1, 2, 3])).toBe(3);
        expect(safeLength([])).toBe(0);
      });

      it('should return 0 for null/undefined', () => {
        expect(safeLength(null)).toBe(0);
        expect(safeLength(undefined)).toBe(0);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('clamp', () => {
      it('should clamp value within bounds', () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-5, 0, 10)).toBe(0);
        expect(clamp(15, 0, 10)).toBe(10);
      });

      it('should handle edge cases', () => {
        expect(clamp(0, 0, 10)).toBe(0);
        expect(clamp(10, 0, 10)).toBe(10);
        expect(clamp(5, 5, 5)).toBe(5);
      });

      it('should work with negative ranges', () => {
        expect(clamp(-5, -10, -1)).toBe(-5);
        expect(clamp(-15, -10, -1)).toBe(-10);
        expect(clamp(5, -10, -1)).toBe(-1);
      });
    });

    describe('formatPercentage', () => {
      it('should format valid numbers as percentages', () => {
        expect(formatPercentage(85.5)).toBe('85.5%');
        expect(formatPercentage(100)).toBe('100.0%');
        expect(formatPercentage(0)).toBe('0.0%');
      });

      it('should handle custom decimal places', () => {
        expect(formatPercentage(85.567, 2)).toBe('85.57%');
        expect(formatPercentage(85.567, 0)).toBe('86%');
      });

      it('should handle null/undefined values', () => {
        expect(formatPercentage(null)).toBe('0.0%');
        expect(formatPercentage(undefined)).toBe('0.0%');
      });
    });

    describe('safeTruncate', () => {
      it('should truncate long text', () => {
        const text = 'This is a very long text that should be truncated';
        const result = safeTruncate(text, 20);
        expect(result).toBe('This is a very lo...');
        expect(result.length).toBe(20);
      });

      it('should not truncate short text', () => {
        const text = 'Short';
        const result = safeTruncate(text, 20);
        expect(result).toBe('Short');
      });

      it('should handle custom suffix', () => {
        const text = 'This is a long text';
        const result = safeTruncate(text, 10, ' [more]');
        expect(result).toBe('Thi [more]');
      });

      it('should handle null/undefined text', () => {
        expect(safeTruncate(null, 10)).toBe('');
        expect(safeTruncate(undefined, 10)).toBe('');
      });

      it('should handle edge cases', () => {
        expect(safeTruncate('test', 0)).toBe('...');
        expect(safeTruncate('test', 3)).toBe('...');
        expect(safeTruncate('test', 4)).toBe('test');
      });
    });
  });

  describe('Complex Type Guards', () => {
    const mockCategory: ToolCategory = {
      id: 'cat1',
      name: 'Frontend',
      description: 'Frontend tools',
      color: '#FF0000'
    };

    const mockTool: ToolWithCategory = {
      id: 'tool1',
      name: 'React',
      description: 'A JavaScript library',
      categoryId: 'cat1',
      url: 'https://reactjs.org',
      frameworks: ['React'],
      languages: ['JavaScript'],
      features: ['Components'],
      integrations: ['Redux'],
      maturityScore: 95,
      popularityScore: 90,
      setupComplexity: 'medium',
      costTier: 'free',
      performanceImpact: null,
      pricing: null,
      notes: null,
      apiLastSync: new Date(),
      category: mockCategory
    };

    describe('isToolCategory', () => {
      it('should return true for valid ToolCategory', () => {
        expect(isToolCategory(mockCategory)).toBe(true);
      });

      it('should return false for invalid objects', () => {
        expect(isToolCategory({})).toBe(false);
        expect(isToolCategory({ id: 'test' })).toBe(false);
        expect(isToolCategory({ name: 'test' })).toBe(false);
        expect(isToolCategory(null)).toBeFalsy();
        expect(isToolCategory(undefined)).toBeFalsy();
      });
    });

    describe('isToolWithCategory', () => {
      it('should return true for valid ToolWithCategory', () => {
        expect(isToolWithCategory(mockTool)).toBe(true);
      });

      it('should return false for invalid objects', () => {
        expect(isToolWithCategory({})).toBeFalsy();
        expect(isToolWithCategory({ id: 'test' })).toBeFalsy();
        expect(isToolWithCategory({ id: 'test', name: 'test' })).toBeFalsy();
        expect(isToolWithCategory({ 
          id: 'test', 
          name: 'test', 
          category: {} 
        })).toBeFalsy();
        expect(isToolWithCategory(null)).toBeFalsy();
      });
    });

    describe('isCompatibilityMatrix', () => {
      const mockCompatibility: CompatibilityMatrix = {
        toolOne: mockTool,
        toolTwo: { ...mockTool, id: 'tool2', name: 'Vue' },
        compatibility: {
          id: 'comp1',
          toolOneId: 'tool1',
          toolTwoId: 'tool2',
          compatibilityScore: 85,
          notes: 'Good compatibility',
          verifiedIntegration: 1,
          integrationDifficulty: 'medium',
          setupSteps: ['Step 1'],
          codeExample: 'code',
          dependencies: ['dep1']
        }
      };

      it('should return true for valid CompatibilityMatrix', () => {
        expect(isCompatibilityMatrix(mockCompatibility)).toBe(true);
      });

      it('should return false for invalid objects', () => {
        expect(isCompatibilityMatrix({})).toBeFalsy();
        expect(isCompatibilityMatrix({ toolOne: mockTool })).toBeFalsy();
        expect(isCompatibilityMatrix({ 
          toolOne: mockTool, 
          toolTwo: mockTool 
        })).toBeFalsy();
        expect(isCompatibilityMatrix({
          toolOne: mockTool,
          toolTwo: mockTool,
          compatibility: {}
        })).toBeFalsy();
        expect(isCompatibilityMatrix(null)).toBeFalsy();
      });
    });

    describe('filterWithTypeGuard', () => {
      it('should filter array with type guard', () => {
        const mixed = [
          mockTool,
          { id: 'invalid' },
          { ...mockTool, id: 'tool2', name: 'Vue' },
          null,
          'string'
        ];

        const result = filterWithTypeGuard(mixed, isToolWithCategory);
        expect(result).toHaveLength(2);
        expect(result.every(item => isToolWithCategory(item))).toBe(true);
      });

      it('should return empty array when no items match', () => {
        const mixed = [null, undefined, 'string', 123];
        const result = filterWithTypeGuard(mixed, isToolWithCategory);
        expect(result).toEqual([]);
      });
    });
  });
});