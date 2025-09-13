/**
 * Search optimization service with caching and performance enhancements
 */

import { Tool } from '@/shared/schema';
import { storage } from '../storage';
import { DatabaseOptimizer } from './database-optimizer';

interface SearchOptions {
  query?: string;
  category?: string;
  minPopularity?: number;
  minMaturity?: number;
  hasFreeTier?: boolean;
  hasIntegrations?: boolean;
  languages?: string[];
  frameworks?: string[];
  sortBy?: 'popularity' | 'maturity' | 'name' | 'recent';
  limit?: number;
  offset?: number;
}

interface SearchResult {
  tools: Tool[];
  totalCount: number;
  searchTime: number;
  cached: boolean;
  appliedFilters: string[];
}

interface SearchCache {
  result: SearchResult;
  timestamp: number;
  ttl: number;
}

class SearchOptimizer {
  private cache = new Map<string, SearchCache>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  private searchAnalytics = new Map<string, number>();

  /**
   * Perform optimized search with caching and performance monitoring
   */
  async searchTools(options: SearchOptions): Promise<SearchResult> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(options);
    
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
      // Track search analytics
      if (options.query) {
        this.trackSearch(options.query);
      }

      // Perform optimized search
      const result = await this.performSearch(options);
      
      const searchResult: SearchResult = {
        ...result,
        searchTime: performance.now() - startTime,
        cached: false,
      };

      // Cache the result
      this.setCache(cacheKey, searchResult);

      return searchResult;
    } catch (error) {
      console.error('Search optimization error:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSearchSuggestions(query: string, limit = 8): Promise<string[]> {
    if (!query || query.length < 2) return [];

    try {
      // Get tool name suggestions
      const tools = await DatabaseOptimizer.searchToolsOptimized(query, limit);
      const toolNames = tools.map(tool => tool.name);

      // Get category suggestions
      const categories = await storage.getCategories();
      const categoryNames = categories
        .filter(cat => cat.name.toLowerCase().includes(query.toLowerCase()))
        .map(cat => cat.name)
        .slice(0, 3);

      // Combine and deduplicate
      const allSuggestions = [...toolNames, ...categoryNames];
      return Array.from(new Set(allSuggestions)).slice(0, limit);
    } catch (error) {
      console.error('Suggestion error:', error);
      return [];
    }
  }

  /**
   * Get popular search terms
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
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      popularTerms: this.getPopularSearchTerms(5),
      cacheHitRate: this.calculateCacheHitRate(),
      memoryUsage: this.calculateMemoryUsage(),
    };
  }

  /**
   * Preload popular searches into cache
   */
  async preloadPopularSearches(): Promise<void> {
    const popularTerms = this.getPopularSearchTerms(10);
    
    for (const { term } of popularTerms) {
      try {
        // Preload basic search for popular terms
        await this.searchTools({ query: term });
      } catch (error) {
        console.warn(`Failed to preload search for term: ${term}`, error);
      }
    }
  }

  /**
   * Optimize cache by removing least recently used entries
   */
  optimizeCache(): void {
    if (this.cache.size <= this.MAX_CACHE_SIZE * 0.8) return;

    // Convert cache to array with access times
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      value,
      lastAccess: value.timestamp,
    }));

    // Sort by last access time (oldest first)
    entries.sort((a, b) => a.lastAccess - b.lastAccess);

    // Remove oldest 25% of entries
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i].key);
    }
  }

  // Private methods

  private async performSearch(options: SearchOptions): Promise<Omit<SearchResult, 'searchTime' | 'cached'>> {
    const appliedFilters: string[] = [];
    let tools = await storage.getToolsWithCategory();

    // Text search with optimization
    if (options.query) {
      const searchTerm = options.query.toLowerCase().trim();
      appliedFilters.push('query');
      
      // Use optimized database search for better performance
      if (searchTerm.length >= 2) {
        tools = await DatabaseOptimizer.searchToolsOptimized(searchTerm, 1000);
      } else {
        // Fallback to in-memory search for very short queries
        tools = tools.filter((tool: any) =>
          tool.name?.toLowerCase().includes(searchTerm) ||
          tool.description?.toLowerCase().includes(searchTerm) ||
          (Array.isArray(tool.features) && tool.features.some((f: string) => 
            f.toLowerCase().includes(searchTerm)
          ))
        );
      }
    }

    // Category filter
    if (options.category) {
      appliedFilters.push('category');
      const categoryLower = options.category.toLowerCase();
      tools = tools.filter((tool: any) => 
        tool.category?.name?.toLowerCase() === categoryLower ||
        tool.category?.name?.toLowerCase().includes(categoryLower)
      );
    }

    // Score filters
    if (options.minPopularity && options.minPopularity > 0) {
      appliedFilters.push('minPopularity');
      tools = tools.filter((tool: any) => (tool.popularityScore || 0) >= options.minPopularity!);
    }

    if (options.minMaturity && options.minMaturity > 0) {
      appliedFilters.push('minMaturity');
      tools = tools.filter((tool: any) => (tool.maturityScore || 0) >= options.minMaturity!);
    }

    // Free tier filter
    if (options.hasFreeTier) {
      appliedFilters.push('hasFreeTier');
      tools = tools.filter((tool: any) => 
        tool.pricing?.toLowerCase().includes('free') ||
        tool.pricing?.toLowerCase().includes('open source')
      );
    }

    // Integrations filter
    if (options.hasIntegrations) {
      appliedFilters.push('hasIntegrations');
      tools = tools.filter((tool: any) => 
        Array.isArray(tool.integrations) && tool.integrations.length > 0
      );
    }

    // Language filters
    if (options.languages && options.languages.length > 0) {
      appliedFilters.push('languages');
      tools = tools.filter((tool: any) => 
        Array.isArray(tool.languages) && 
        options.languages!.some(lang => 
          tool.languages.some((toolLang: string) => 
            toolLang.toLowerCase().includes(lang.toLowerCase())
          )
        )
      );
    }

    // Framework filters
    if (options.frameworks && options.frameworks.length > 0) {
      appliedFilters.push('frameworks');
      tools = tools.filter((tool: any) => 
        Array.isArray(tool.frameworks) && 
        options.frameworks!.some(framework => 
          tool.frameworks.some((toolFramework: string) => 
            toolFramework.toLowerCase().includes(framework.toLowerCase())
          )
        )
      );
    }

    // Sorting
    const sortBy = options.sortBy || 'popularity';
    tools = this.applySorting(tools, sortBy);

    const totalCount = tools.length;

    // Apply pagination
    if (options.limit || options.offset) {
      const offset = options.offset || 0;
      const limit = options.limit || 20;
      tools = tools.slice(offset, offset + limit);
    }

    return {
      tools,
      totalCount,
      appliedFilters,
    };
  }

  private applySorting(tools: any[], sortBy: string): any[] {
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
        // Default: combined popularity + maturity
        return [...tools].sort((a, b) => 
          ((b.popularityScore || 0) + (b.maturityScore || 0)) - 
          ((a.popularityScore || 0) + (a.maturityScore || 0))
        );
    }
  }

  private generateCacheKey(options: SearchOptions): string {
    const key = {
      query: options.query?.toLowerCase().trim() || '',
      category: options.category || '',
      minPopularity: options.minPopularity || 0,
      minMaturity: options.minMaturity || 0,
      hasFreeTier: options.hasFreeTier || false,
      hasIntegrations: options.hasIntegrations || false,
      languages: (options.languages || []).sort(),
      frameworks: (options.frameworks || []).sort(),
      sortBy: options.sortBy || 'popularity',
      limit: options.limit || 20,
      offset: options.offset || 0,
    };
    return btoa(JSON.stringify(key));
  }

  private getFromCache(key: string): SearchResult | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.result;
  }

  private setCache(key: string, result: SearchResult): void {
    // Limit cache size
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      ttl: this.DEFAULT_TTL,
    });
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

  private calculateCacheHitRate(): number {
    // This would need to be tracked over time in a real implementation
    return 0.75; // Placeholder
  }

  private calculateMemoryUsage(): number {
    // Estimate memory usage of cache
    let totalSize = 0;
    for (const [key, value] of this.cache.entries()) {
      totalSize += key.length * 2; // UTF-16 characters
      totalSize += JSON.stringify(value).length * 2;
    }
    return totalSize; // bytes
  }
}

export const searchOptimizer = new SearchOptimizer();