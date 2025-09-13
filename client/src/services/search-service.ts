/**
 * Enhanced search service with caching and performance optimizations
 */

import type { SearchFilters } from '@/hooks/use-debounced-search';
import type { ToolWithCategory } from '@/lib/types';

export interface SearchResponse {
  data: ToolWithCategory[];
  totalCount: number;
  searchTime: number;
  cached: boolean;
}

export interface SearchSuggestion {
  text: string;
  type: 'tool' | 'category' | 'feature' | 'framework' | 'language';
  count?: number;
}

class SearchService {
  private cache = new Map<string, { data: SearchResponse; timestamp: number }>();
  private suggestionCache = new Map<string, { suggestions: string[]; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly SUGGESTION_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private searchAnalytics = new Map<string, number>();

  /**
   * Perform optimized search with caching
   */
  async searchTools(filters: SearchFilters): Promise<SearchResponse> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(filters);
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return {
        ...cached,
        searchTime: performance.now() - startTime,
        cached: true,
      };
    }

    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.query) {
        params.append('query', filters.query);
        this.trackSearch(filters.query);
      }
      if (filters.category) params.append('category', filters.category);
      if (filters.minPopularity > 0) params.append('minPopularity', filters.minPopularity.toString());
      if (filters.minMaturity > 0) params.append('minMaturity', filters.minMaturity.toString());
      if (filters.hasFreeTier) params.append('hasFreeTier', 'true');
      if (filters.languages.length > 0) params.append('languages', filters.languages.join(','));
      if (filters.frameworks.length > 0) params.append('frameworks', filters.frameworks.join(','));
      
      // Add sorting
      params.append('sortBy', filters.sortBy);
      
      // Increase limit for better performance (fewer requests)
      params.append('limit', '100');

      const response = await fetch(`/api/v1/tools/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const result = await response.json();
      const searchResponse: SearchResponse = {
        data: result.data || result.tools || [],
        totalCount: result.totalCount || result.data?.length || 0,
        searchTime: performance.now() - startTime,
        cached: false,
      };

      // Apply client-side sorting if needed
      if (filters.sortBy) {
        searchResponse.data = this.applySorting(searchResponse.data, filters.sortBy);
      }

      // Cache the result
      this.setCache(cacheKey, searchResponse);

      return searchResponse;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    const cacheKey = `suggestions:${query.toLowerCase()}`;
    const cached = this.getSuggestionsFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Get suggestions from multiple sources
      const [toolSuggestions, categorySuggestions, featureSuggestions] = await Promise.all([
        this.getToolNameSuggestions(query),
        this.getCategorySuggestions(query),
        this.getFeatureSuggestions(query),
      ]);

      const allSuggestions = [
        ...toolSuggestions,
        ...categorySuggestions,
        ...featureSuggestions,
      ];

      // Remove duplicates and limit results
      const uniqueSuggestions = Array.from(new Set(allSuggestions))
        .slice(0, 8);

      // Cache suggestions
      this.setSuggestionCache(cacheKey, uniqueSuggestions);

      return uniqueSuggestions;
    } catch (error) {
      console.error('Suggestion error:', error);
      return [];
    }
  }

  /**
   * Get popular search terms for analytics
   */
  getPopularSearchTerms(limit = 10): Array<{ term: string; count: number }> {
    return Array.from(this.searchAnalytics.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([term, count]) => ({ term, count }));
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.cache.clear();
    this.suggestionCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      searchCacheSize: this.cache.size,
      suggestionCacheSize: this.suggestionCache.size,
      popularTerms: this.getPopularSearchTerms(5),
    };
  }

  // Private methods

  private generateCacheKey(filters: SearchFilters): string {
    const key = {
      query: filters.query.toLowerCase().trim(),
      category: filters.category,
      minPopularity: filters.minPopularity,
      minMaturity: filters.minMaturity,
      hasFreeTier: filters.hasFreeTier,
      hasIntegrations: filters.hasIntegrations,
      languages: [...filters.languages].sort(),
      frameworks: [...filters.frameworks].sort(),
      sortBy: filters.sortBy,
    };
    return btoa(JSON.stringify(key));
  }

  private getFromCache(key: string): SearchResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: SearchResponse): void {
    // Limit cache size
    if (this.cache.size > 50) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private getSuggestionsFromCache(key: string): string[] | null {
    const cached = this.suggestionCache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.SUGGESTION_CACHE_TTL;
    if (isExpired) {
      this.suggestionCache.delete(key);
      return null;
    }

    return cached.suggestions;
  }

  private setSuggestionCache(key: string, suggestions: string[]): void {
    // Limit cache size
    if (this.suggestionCache.size > 100) {
      const oldestKey = this.suggestionCache.keys().next().value;
      this.suggestionCache.delete(oldestKey);
    }

    this.suggestionCache.set(key, {
      suggestions,
      timestamp: Date.now(),
    });
  }

  private async getToolNameSuggestions(query: string): Promise<string[]> {
    try {
      const response = await fetch(`/api/v1/tools/search?query=${encodeURIComponent(query)}&limit=5`);
      const result = await response.json();
      return (result.data || []).map((tool: any) => tool.name);
    } catch {
      return [];
    }
  }

  private async getCategorySuggestions(query: string): Promise<string[]> {
    try {
      const response = await fetch('/api/v1/categories');
      const result = await response.json();
      return (result.categories || [])
        .filter((cat: any) => cat.name.toLowerCase().includes(query.toLowerCase()))
        .map((cat: any) => cat.name)
        .slice(0, 3);
    } catch {
      return [];
    }
  }

  private async getFeatureSuggestions(query: string): Promise<string[]> {
    // Common features that might match the query
    const commonFeatures = [
      'API', 'REST API', 'GraphQL', 'WebSocket', 'Real-time',
      'Authentication', 'Authorization', 'OAuth', 'JWT',
      'Database', 'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL',
      'Caching', 'Redis', 'CDN', 'Performance',
      'Testing', 'Unit Testing', 'Integration Testing',
      'Deployment', 'CI/CD', 'Docker', 'Kubernetes',
      'Monitoring', 'Logging', 'Analytics', 'Metrics',
      'Security', 'Encryption', 'HTTPS', 'SSL',
    ];

    return commonFeatures
      .filter(feature => feature.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3);
  }

  private applySorting(tools: ToolWithCategory[], sortBy: string): ToolWithCategory[] {
    switch (sortBy) {
      case 'name':
        return [...tools].sort((a, b) => a.name.localeCompare(b.name));
      case 'popularity':
        return [...tools].sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
      case 'maturity':
        return [...tools].sort((a, b) => (b.maturityScore || 0) - (a.maturityScore || 0));
      case 'recent':
        return [...tools].sort((a, b) => {
          const aDate = new Date(a.updatedAt || a.createdAt || 0);
          const bDate = new Date(b.updatedAt || b.createdAt || 0);
          return bDate.getTime() - aDate.getTime();
        });
      default:
        return tools;
    }
  }

  private trackSearch(query: string): void {
    const normalizedQuery = query.toLowerCase().trim();
    if (normalizedQuery.length < 2) return;

    const current = this.searchAnalytics.get(normalizedQuery) || 0;
    this.searchAnalytics.set(normalizedQuery, current + 1);

    // Limit analytics storage
    if (this.searchAnalytics.size > 1000) {
      const entries = Array.from(this.searchAnalytics.entries());
      entries.sort(([, a], [, b]) => b - a);
      this.searchAnalytics.clear();
      entries.slice(0, 500).forEach(([term, count]) => {
        this.searchAnalytics.set(term, count);
      });
    }
  }
}

export const searchService = new SearchService();