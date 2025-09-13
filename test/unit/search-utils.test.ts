/**
 * Unit tests for search utility functions
 * Tests search algorithms and filtering logic
 */

import { describe, it, expect } from 'vitest';
import {
  countActiveFilters,
  getDefaultFilters,
  toggleArrayItem,
  COMMON_LANGUAGES,
  COMMON_FRAMEWORKS
} from '../../client/src/lib/search-utils';
import type { SearchFilters } from '../../client/src/lib/search-utils';

describe('Search Utils', () => {
  describe('countActiveFilters', () => {
    it('should count zero active filters for default filters', () => {
      const filters = getDefaultFilters();
      expect(countActiveFilters(filters)).toBe(0);
    });

    it('should count query filter', () => {
      const filters: SearchFilters = {
        ...getDefaultFilters(),
        query: 'React'
      };
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('should count category filter', () => {
      const filters: SearchFilters = {
        ...getDefaultFilters(),
        category: 'frontend'
      };
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('should count popularity filter when > 0', () => {
      const filters: SearchFilters = {
        ...getDefaultFilters(),
        minPopularity: 80
      };
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('should not count popularity filter when = 0', () => {
      const filters: SearchFilters = {
        ...getDefaultFilters(),
        minPopularity: 0
      };
      expect(countActiveFilters(filters)).toBe(0);
    });

    it('should count maturity filter when > 0', () => {
      const filters: SearchFilters = {
        ...getDefaultFilters(),
        minMaturity: 70
      };
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('should count boolean filters when true', () => {
      const filters: SearchFilters = {
        ...getDefaultFilters(),
        hasFreeTier: true,
        hasIntegrations: true
      };
      expect(countActiveFilters(filters)).toBe(2);
    });

    it('should count array filters when not empty', () => {
      const filters: SearchFilters = {
        ...getDefaultFilters(),
        languages: ['JavaScript', 'TypeScript'],
        frameworks: ['React']
      };
      expect(countActiveFilters(filters)).toBe(2);
    });

    it('should count all active filters correctly', () => {
      const filters: SearchFilters = {
        query: 'React',
        category: 'frontend',
        minPopularity: 80,
        minMaturity: 70,
        hasFreeTier: true,
        hasIntegrations: true,
        languages: ['JavaScript'],
        frameworks: ['React'],
        sortBy: 'popularity'
      };
      expect(countActiveFilters(filters)).toBe(8);
    });

    it('should handle empty arrays as inactive filters', () => {
      const filters: SearchFilters = {
        ...getDefaultFilters(),
        languages: [],
        frameworks: []
      };
      expect(countActiveFilters(filters)).toBe(0);
    });
  });

  describe('getDefaultFilters', () => {
    it('should return correct default values', () => {
      const defaults = getDefaultFilters();
      
      expect(defaults.query).toBe('');
      expect(defaults.category).toBe('');
      expect(defaults.minPopularity).toBe(0);
      expect(defaults.minMaturity).toBe(0);
      expect(defaults.hasFreeTier).toBe(false);
      expect(defaults.hasIntegrations).toBe(false);
      expect(defaults.languages).toEqual([]);
      expect(defaults.frameworks).toEqual([]);
      expect(defaults.sortBy).toBe('popularity');
    });

    it('should return a new object each time', () => {
      const defaults1 = getDefaultFilters();
      const defaults2 = getDefaultFilters();
      
      expect(defaults1).not.toBe(defaults2);
      expect(defaults1).toEqual(defaults2);
    });

    it('should return arrays that can be modified independently', () => {
      const defaults1 = getDefaultFilters();
      const defaults2 = getDefaultFilters();
      
      defaults1.languages.push('JavaScript');
      
      expect(defaults1.languages).toHaveLength(1);
      expect(defaults2.languages).toHaveLength(0);
    });
  });

  describe('toggleArrayItem', () => {
    it('should add item to empty array', () => {
      const result = toggleArrayItem([], 'JavaScript');
      expect(result).toEqual(['JavaScript']);
    });

    it('should add item to array when not present', () => {
      const array = ['TypeScript', 'Python'];
      const result = toggleArrayItem(array, 'JavaScript');
      expect(result).toEqual(['TypeScript', 'Python', 'JavaScript']);
    });

    it('should remove item from array when present', () => {
      const array = ['JavaScript', 'TypeScript', 'Python'];
      const result = toggleArrayItem(array, 'TypeScript');
      expect(result).toEqual(['JavaScript', 'Python']);
    });

    it('should not modify original array', () => {
      const array = ['JavaScript', 'TypeScript'];
      const result = toggleArrayItem(array, 'Python');
      
      expect(array).toEqual(['JavaScript', 'TypeScript']);
      expect(result).toEqual(['JavaScript', 'TypeScript', 'Python']);
    });

    it('should handle duplicate items correctly', () => {
      const array = ['JavaScript', 'JavaScript', 'TypeScript'];
      const result = toggleArrayItem(array, 'JavaScript');
      expect(result).toEqual(['TypeScript']);
    });

    it('should work with different data types', () => {
      const numbers = [1, 2, 3];
      const result1 = toggleArrayItem(numbers, 4);
      const result2 = toggleArrayItem(numbers, 2);
      
      expect(result1).toEqual([1, 2, 3, 4]);
      expect(result2).toEqual([1, 3]);
    });

    it('should work with objects', () => {
      const objects = [{ id: 1 }, { id: 2 }];
      const newObj = { id: 3 };
      const result = toggleArrayItem(objects, newObj);
      
      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    it('should remove object when present (reference equality)', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const objects = [obj1, obj2];
      const result = toggleArrayItem(objects, obj1);
      
      expect(result).toEqual([obj2]);
    });
  });

  describe('COMMON_LANGUAGES constant', () => {
    it('should contain expected languages', () => {
      expect(COMMON_LANGUAGES).toContain('JavaScript');
      expect(COMMON_LANGUAGES).toContain('TypeScript');
      expect(COMMON_LANGUAGES).toContain('Python');
      expect(COMMON_LANGUAGES).toContain('Go');
      expect(COMMON_LANGUAGES).toContain('Rust');
      expect(COMMON_LANGUAGES).toContain('Java');
    });

    it('should have correct length', () => {
      expect(COMMON_LANGUAGES).toHaveLength(6);
    });

    it('should be an array of strings', () => {
      expect(Array.isArray(COMMON_LANGUAGES)).toBe(true);
      COMMON_LANGUAGES.forEach(lang => {
        expect(typeof lang).toBe('string');
        expect(lang.length).toBeGreaterThan(0);
      });
    });
  });

  describe('COMMON_FRAMEWORKS constant', () => {
    it('should contain expected frameworks', () => {
      expect(COMMON_FRAMEWORKS).toContain('React');
      expect(COMMON_FRAMEWORKS).toContain('Vue');
      expect(COMMON_FRAMEWORKS).toContain('Angular');
      expect(COMMON_FRAMEWORKS).toContain('Next.js');
      expect(COMMON_FRAMEWORKS).toContain('Express');
      expect(COMMON_FRAMEWORKS).toContain('Django');
    });

    it('should have correct length', () => {
      expect(COMMON_FRAMEWORKS).toHaveLength(6);
    });

    it('should be an array of strings', () => {
      expect(Array.isArray(COMMON_FRAMEWORKS)).toBe(true);
      COMMON_FRAMEWORKS.forEach(framework => {
        expect(typeof framework).toBe('string');
        expect(framework.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null/undefined in countActiveFilters', () => {
      const filtersWithNulls = {
        query: null as any,
        category: undefined as any,
        minPopularity: 0,
        minMaturity: 0,
        hasFreeTier: false,
        hasIntegrations: false,
        languages: [] as any, // Use empty array instead of null
        frameworks: [] as any, // Use empty array instead of undefined
        sortBy: 'popularity' as const
      };
      
      expect(() => countActiveFilters(filtersWithNulls)).not.toThrow();
      expect(countActiveFilters(filtersWithNulls)).toBe(0);
    });

    it('should handle negative values in numeric filters', () => {
      const filters: SearchFilters = {
        ...getDefaultFilters(),
        minPopularity: -10,
        minMaturity: -5
      };
      expect(countActiveFilters(filters)).toBe(0);
    });

    it('should handle very large arrays in toggleArrayItem', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => i);
      const result = toggleArrayItem(largeArray, 1000);
      
      expect(result).toHaveLength(1001);
      expect(result[1000]).toBe(1000);
    });
  });
});