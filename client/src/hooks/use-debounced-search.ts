/**
 * Enhanced debounced search hook with performance optimization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

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

export interface SearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  enableCache?: boolean;
  cacheTime?: number;
}

export interface SearchResult<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  totalCount: number;
  hasMore: boolean;
  searchTerm: string;
}

const DEFAULT_OPTIONS: Required<SearchOptions> = {
  debounceMs: 300,
  minQueryLength: 2,
  enableCache: true,
  cacheTime: 5 * 60 * 1000, // 5 minutes
};

/**
 * Enhanced debounced search hook with performance optimizations
 */
export function useDebouncedSearch<T = any>(
  searchFn: (filters: SearchFilters) => Promise<{ data: T[]; totalCount: number }>,
  initialFilters: SearchFilters,
  options: SearchOptions = {}
): SearchResult<T> & {
  filters: SearchFilters;
  updateFilters: (updater: (prev: SearchFilters) => SearchFilters) => void;
  resetFilters: () => void;
  clearSearch: () => void;
} {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [debouncedFilters, setDebouncedFilters] = useState<SearchFilters>(initialFilters);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const lastSearchRef = useRef<string>('');

  // Debounce filter changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // Only trigger search if query meets minimum length or if other filters changed
      const shouldSearch = 
        filters.query.length >= opts.minQueryLength || 
        filters.query.length === 0 || // Allow empty search
        JSON.stringify({ ...filters, query: '' }) !== JSON.stringify({ ...debouncedFilters, query: '' });

      if (shouldSearch) {
        setDebouncedFilters(filters);
      }
    }, opts.debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters, opts.debounceMs, opts.minQueryLength, debouncedFilters]);

  // Generate cache key based on filters
  const cacheKey = useCallback((searchFilters: SearchFilters) => {
    const key = JSON.stringify({
      query: searchFilters.query.toLowerCase().trim(),
      category: searchFilters.category,
      minPopularity: searchFilters.minPopularity,
      minMaturity: searchFilters.minMaturity,
      hasFreeTier: searchFilters.hasFreeTier,
      hasIntegrations: searchFilters.hasIntegrations,
      languages: [...searchFilters.languages].sort(),
      frameworks: [...searchFilters.frameworks].sort(),
      sortBy: searchFilters.sortBy,
    });
    return `search:${btoa(key)}`;
  }, []);

  // React Query for search with caching
  const {
    data: searchData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [cacheKey(debouncedFilters)],
    queryFn: () => searchFn(debouncedFilters),
    enabled: true,
    staleTime: opts.enableCache ? opts.cacheTime : 0,
    gcTime: opts.enableCache ? opts.cacheTime * 2 : 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Update functions
  const updateFilters = useCallback((updater: (prev: SearchFilters) => SearchFilters) => {
    setFilters(updater);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const clearSearch = useCallback(() => {
    setFilters(prev => ({ ...prev, query: '' }));
  }, []);

  // Track search term for analytics
  useEffect(() => {
    if (debouncedFilters.query && debouncedFilters.query !== lastSearchRef.current) {
      lastSearchRef.current = debouncedFilters.query;
      // Could emit analytics event here
    }
  }, [debouncedFilters.query]);

  return {
    data: searchData?.data || [],
    isLoading,
    error: error as Error | null,
    totalCount: searchData?.totalCount || 0,
    hasMore: false, // Could be implemented with pagination
    searchTerm: debouncedFilters.query,
    filters,
    updateFilters,
    resetFilters,
    clearSearch,
  };
}

/**
 * Hook for search suggestions/autocomplete
 */
export function useSearchSuggestions(
  query: string,
  getSuggestions: (query: string) => Promise<string[]>,
  options: { debounceMs?: number; minQueryLength?: number } = {}
) {
  const opts = { debounceMs: 150, minQueryLength: 1, ...options };
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, opts.debounceMs);

    return () => clearTimeout(timer);
  }, [query, opts.debounceMs]);

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['suggestions', debouncedQuery],
    queryFn: () => getSuggestions(debouncedQuery),
    enabled: debouncedQuery.length >= opts.minQueryLength,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    suggestions: suggestions || [],
    isLoading,
  };
}