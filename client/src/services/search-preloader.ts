/**
 * Search preloader service for proactive caching
 */

import { searchService } from './search-service';
import type { SearchFilters } from '@/hooks/use-debounced-search';
import { getDefaultFilters, FILTER_PRESETS } from '@/lib/search-utils';

class SearchPreloader {
  private preloadQueue: Array<{ filters: SearchFilters; priority: number }> = [];
  private isPreloading = false;
  private preloadedTerms = new Set<string>();

  /**
   * Initialize preloader with common searches
   */
  async initialize(): Promise<void> {
    // Preload popular categories
    await this.preloadPopularCategories();
    
    // Preload filter presets
    await this.preloadFilterPresets();
    
    // Preload recent searches
    await this.preloadRecentSearches();
    
    // Start background preloading
    this.startBackgroundPreloading();
  }

  /**
   * Preload search for a specific term
   */
  async preloadSearch(query: string, priority = 1): Promise<void> {
    if (this.preloadedTerms.has(query.toLowerCase())) return;

    const filters: SearchFilters = {
      ...getDefaultFilters(),
      query,
    };

    this.addToQueue(filters, priority);
    this.preloadedTerms.add(query.toLowerCase());
  }

  /**
   * Preload searches for filter combinations
   */
  async preloadFilterCombination(filters: Partial<SearchFilters>, priority = 1): Promise<void> {
    const fullFilters: SearchFilters = {
      ...getDefaultFilters(),
      ...filters,
    };

    this.addToQueue(fullFilters, priority);
  }

  /**
   * Preload suggestions for a query
   */
  async preloadSuggestions(query: string): Promise<void> {
    if (query.length < 2) return;

    try {
      await searchService.getSearchSuggestions(query);
    } catch (error) {
      console.warn('Failed to preload suggestions:', error);
    }
  }

  /**
   * Clear preload cache and queue
   */
  clear(): void {
    this.preloadQueue = [];
    this.preloadedTerms.clear();
    searchService.clearCache();
  }

  /**
   * Get preloader statistics
   */
  getStats() {
    return {
      queueSize: this.preloadQueue.length,
      preloadedTerms: this.preloadedTerms.size,
      isPreloading: this.isPreloading,
    };
  }

  // Private methods

  private async preloadPopularCategories(): Promise<void> {
    const popularCategories = [
      'frontend',
      'backend',
      'database',
      'devops',
      'testing',
      'ai',
      'mobile',
      'cloud',
    ];

    for (const category of popularCategories) {
      this.preloadFilterCombination({ category }, 3);
    }
  }

  private async preloadFilterPresets(): Promise<void> {
    for (const [presetName, preset] of Object.entries(FILTER_PRESETS)) {
      this.addToQueue(preset, 2);
    }
  }

  private async preloadRecentSearches(): Promise<void> {
    try {
      const recentSearches = JSON.parse(localStorage.getItem('recent-searches') || '[]');
      for (const query of recentSearches.slice(0, 5)) {
        await this.preloadSearch(query, 4);
      }
    } catch (error) {
      console.warn('Failed to preload recent searches:', error);
    }
  }

  private addToQueue(filters: SearchFilters, priority: number): void {
    // Check if already in queue
    const exists = this.preloadQueue.some(item => 
      JSON.stringify(item.filters) === JSON.stringify(filters)
    );

    if (!exists) {
      this.preloadQueue.push({ filters, priority });
      // Sort by priority (higher first)
      this.preloadQueue.sort((a, b) => b.priority - a.priority);
    }
  }

  private startBackgroundPreloading(): void {
    if (this.isPreloading) return;

    this.isPreloading = true;
    this.processPreloadQueue();
  }

  private async processPreloadQueue(): Promise<void> {
    while (this.preloadQueue.length > 0) {
      const item = this.preloadQueue.shift();
      if (!item) break;

      try {
        // Add delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Perform the preload search
        await searchService.searchTools(item.filters);
      } catch (error) {
        console.warn('Preload failed:', error);
      }
    }

    this.isPreloading = false;
  }
}

export const searchPreloader = new SearchPreloader();

// Auto-initialize when the module loads
if (typeof window !== 'undefined') {
  // Initialize after a short delay to not block initial page load
  setTimeout(() => {
    searchPreloader.initialize().catch(console.warn);
  }, 2000);
}