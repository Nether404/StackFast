/**
 * Tests for enhanced search functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { searchService } from '../../client/src/services/search-service';
import type { SearchFilters } from '../../client/src/hooks/use-debounced-search';

// Mock fetch
global.fetch = vi.fn();

describe('Enhanced Search Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchService.clearCache();
  });

  describe('searchTools', () => {
    it('should perform basic search', async () => {
      const mockResponse = {
        success: true,
        data: [
          { id: '1', name: 'React', description: 'JavaScript library' },
          { id: '2', name: 'Vue', description: 'Progressive framework' },
        ],
        totalCount: 2,
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const filters: SearchFilters = {
        query: 'react',
        category: '',
        minPopularity: 0,
        minMaturity: 0,
        hasFreeTier: false,
        hasIntegrations: false,
        languages: [],
        frameworks: [],
        sortBy: 'popularity',
      };

      const result = await searchService.searchTools(filters);

      expect(result.data).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.cached).toBe(false);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/tools/search?query=react')
      );
    });

    it('should cache search results', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: '1', name: 'React' }],
        totalCount: 1,
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const filters: SearchFilters = {
        query: 'react',
        category: '',
        minPopularity: 0,
        minMaturity: 0,
        hasFreeTier: false,
        hasIntegrations: false,
        languages: [],
        frameworks: [],
        sortBy: 'popularity',
      };

      // First call
      const result1 = await searchService.searchTools(filters);
      expect(result1.cached).toBe(false);

      // Second call should be cached
      const result2 = await searchService.searchTools(filters);
      expect(result2.cached).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle search with multiple filters', async () => {
      const mockResponse = {
        success: true,
        data: [],
        totalCount: 0,
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const filters: SearchFilters = {
        query: 'react',
        category: 'frontend',
        minPopularity: 5,
        minMaturity: 7,
        hasFreeTier: true,
        hasIntegrations: false,
        languages: ['JavaScript', 'TypeScript'],
        frameworks: ['React'],
        sortBy: 'maturity',
      };

      await searchService.searchTools(filters);

      const expectedUrl = new URL('/api/v1/tools/search', 'http://localhost');
      expectedUrl.searchParams.set('query', 'react');
      expectedUrl.searchParams.set('category', 'frontend');
      expectedUrl.searchParams.set('minPopularity', '5');
      expectedUrl.searchParams.set('minMaturity', '7');
      expectedUrl.searchParams.set('hasFreeTier', 'true');
      expectedUrl.searchParams.set('languages', 'JavaScript,TypeScript');
      expectedUrl.searchParams.set('frameworks', 'React');
      expectedUrl.searchParams.set('sortBy', 'maturity');
      expectedUrl.searchParams.set('limit', '100');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('query=react&category=frontend&minPopularity=5&minMaturity=7&hasFreeTier=true&languages=JavaScript%2CTypeScript&frameworks=React&sortBy=maturity&limit=100')
      );
    });

    it('should handle search errors gracefully', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const filters: SearchFilters = {
        query: 'react',
        category: '',
        minPopularity: 0,
        minMaturity: 0,
        hasFreeTier: false,
        hasIntegrations: false,
        languages: [],
        frameworks: [],
        sortBy: 'popularity',
      };

      await expect(searchService.searchTools(filters)).rejects.toThrow('Network error');
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return empty array for short queries', async () => {
      const suggestions = await searchService.getSearchSuggestions('a');
      expect(suggestions).toEqual([]);
    });

    it('should fetch and cache suggestions', async () => {
      const mockToolsResponse = {
        data: [{ name: 'React' }, { name: 'Redux' }],
      };
      const mockCategoriesResponse = {
        categories: [{ name: 'Frontend' }],
      };

      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockToolsResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCategoriesResponse),
        });

      const suggestions = await searchService.getSearchSuggestions('re');

      expect(suggestions).toContain('React');
      expect(suggestions).toContain('Redux');
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('analytics', () => {
    it('should track popular search terms', async () => {
      const mockResponse = {
        success: true,
        data: [],
        totalCount: 0,
      };

      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const filters: SearchFilters = {
        query: 'react',
        category: '',
        minPopularity: 0,
        minMaturity: 0,
        hasFreeTier: false,
        hasIntegrations: false,
        languages: [],
        frameworks: [],
        sortBy: 'popularity',
      };

      // Search multiple times
      await searchService.searchTools(filters);
      await searchService.searchTools(filters);

      const popularTerms = searchService.getPopularSearchTerms(5);
      expect(popularTerms.some(term => term.term === 'react' && term.count >= 2)).toBe(true);
    });

    it('should provide cache statistics', () => {
      const stats = searchService.getCacheStats();
      expect(stats).toHaveProperty('searchCacheSize');
      expect(stats).toHaveProperty('suggestionCacheSize');
      expect(stats).toHaveProperty('popularTerms');
    });
  });
});

describe('Search Utils', () => {
  it('should count active filters correctly', async () => {
    const { countActiveFiltersOptimized } = await import('../../client/src/lib/search-utils');
    
    const filters: SearchFilters = {
      query: 'react',
      category: 'frontend',
      minPopularity: 5,
      minMaturity: 0,
      hasFreeTier: true,
      hasIntegrations: false,
      languages: ['JavaScript'],
      frameworks: [],
      sortBy: 'popularity',
    };

    const count = countActiveFiltersOptimized(filters);
    expect(count).toBe(5); // query, category, minPopularity, hasFreeTier, languages
  });

  it('should normalize search terms', async () => {
    const { normalizeSearchTerm } = await import('../../client/src/lib/search-utils');
    
    expect(normalizeSearchTerm('  React.js  ')).toBe('reactjs');
    expect(normalizeSearchTerm('Vue@3')).toBe('vue3');
    expect(normalizeSearchTerm('Next.js Framework')).toBe('nextjs framework');
  });

  it('should detect empty filters', async () => {
    const { areFiltersEmpty, getDefaultFilters } = await import('../../client/src/lib/search-utils');
    
    const emptyFilters = getDefaultFilters();
    expect(areFiltersEmpty(emptyFilters)).toBe(true);

    const filtersWithQuery = { ...emptyFilters, query: 'react' };
    expect(areFiltersEmpty(filtersWithQuery)).toBe(false);
  });

  it('should apply filter presets', async () => {
    const { applyFilterPreset, getDefaultFilters } = await import('../../client/src/lib/search-utils');
    
    const defaultFilters = getDefaultFilters();
    const popularPreset = applyFilterPreset('popular', defaultFilters);
    
    expect(popularPreset.minPopularity).toBe(7);
    expect(popularPreset.sortBy).toBe('popularity');
  });
});