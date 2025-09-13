/**
 * Utility functions for search operations with performance optimizations
 */

export interface SearchFilters {
  query: string;
  category: string;
  minPopularity: number;
  minMaturity: number;
  hasFreeTier: boolean;
  hasIntegrations: boolean;
  languages: string[];
  frameworks: string[];
  sortBy: "popularity" | "maturity" | "name" | "recent";
}

export interface SearchPerformanceMetrics {
  searchTime: number;
  resultsCount: number;
  cacheHit: boolean;
  filterCount: number;
}

/**
 * Count active filters in search filters object
 */
export function countActiveFilters(filters: SearchFilters): number {
  let count = 0;
  if (filters.query) count++;
  if (filters.category) count++;
  if (filters.minPopularity > 0) count++;
  if (filters.minMaturity > 0) count++;
  if (filters.hasFreeTier) count++;
  if (filters.hasIntegrations) count++;
  if (filters.languages.length > 0) count++;
  if (filters.frameworks.length > 0) count++;
  return count;
}

/**
 * Get default search filters
 */
export function getDefaultFilters(): SearchFilters {
  return {
    query: "",
    category: "",
    minPopularity: 0,
    minMaturity: 0,
    hasFreeTier: false,
    hasIntegrations: false,
    languages: [],
    frameworks: [],
    sortBy: "popularity"
  };
}

/**
 * Toggle item in array (add if not present, remove if present)
 */
export function toggleArrayItem<T>(array: T[], item: T): T[] {
  return array.includes(item)
    ? array.filter(i => i !== item)
    : [...array, item];
}

/**
 * Common languages for quick filters
 */
export const COMMON_LANGUAGES = ["JavaScript", "TypeScript", "Python", "Go", "Rust", "Java"];

/**
 * Common frameworks for quick filters
 */
export const COMMON_FRAMEWORKS = ["React", "Vue", "Angular", "Next.js", "Express", "Django"];

/**
 * Performance-optimized filter counting with memoization
 */
const filterCountCache = new Map<string, number>();

export function countActiveFiltersOptimized(filters: SearchFilters): number {
  const cacheKey = JSON.stringify(filters);
  
  if (filterCountCache.has(cacheKey)) {
    return filterCountCache.get(cacheKey)!;
  }

  let count = 0;
  if (filters.query) count++;
  if (filters.category) count++;
  if (filters.minPopularity > 0) count++;
  if (filters.minMaturity > 0) count++;
  if (filters.hasFreeTier) count++;
  if (filters.hasIntegrations) count++;
  if (filters.languages.length > 0) count++;
  if (filters.frameworks.length > 0) count++;

  // Limit cache size
  if (filterCountCache.size > 100) {
    filterCountCache.clear();
  }
  
  filterCountCache.set(cacheKey, count);
  return count;
}

/**
 * Optimized search term normalization
 */
export function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Check if filters are effectively empty (no meaningful filtering)
 */
export function areFiltersEmpty(filters: SearchFilters): boolean {
  return (
    !filters.query &&
    !filters.category &&
    filters.minPopularity === 0 &&
    filters.minMaturity === 0 &&
    !filters.hasFreeTier &&
    !filters.hasIntegrations &&
    filters.languages.length === 0 &&
    filters.frameworks.length === 0
  );
}

/**
 * Generate search analytics data
 */
export function generateSearchMetrics(
  filters: SearchFilters,
  resultsCount: number,
  searchTime: number,
  cacheHit: boolean = false
): SearchPerformanceMetrics {
  return {
    searchTime,
    resultsCount,
    cacheHit,
    filterCount: countActiveFiltersOptimized(filters),
  };
}

/**
 * Advanced filter presets for common use cases
 */
export const FILTER_PRESETS = {
  popular: {
    ...getDefaultFilters(),
    minPopularity: 7,
    sortBy: "popularity" as const,
  },
  mature: {
    ...getDefaultFilters(),
    minMaturity: 8,
    sortBy: "maturity" as const,
  },
  free: {
    ...getDefaultFilters(),
    hasFreeTier: true,
    sortBy: "popularity" as const,
  },
  frontend: {
    ...getDefaultFilters(),
    frameworks: ["React", "Vue", "Angular"],
    sortBy: "popularity" as const,
  },
  backend: {
    ...getDefaultFilters(),
    frameworks: ["Express", "Django", "Spring"],
    sortBy: "popularity" as const,
  },
} as const;

/**
 * Apply filter preset
 */
export function applyFilterPreset(
  presetName: keyof typeof FILTER_PRESETS,
  currentFilters: SearchFilters
): SearchFilters {
  const preset = FILTER_PRESETS[presetName];
  return {
    ...currentFilters,
    ...preset,
  };
}