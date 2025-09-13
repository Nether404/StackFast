/**
 * Enhanced search component with debouncing, caching, and advanced filtering
 */

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Filter, X, Zap, Clock, TrendingUp } from 'lucide-react';
import { SearchInput } from './search-input';
import { AdvancedFilters } from './advanced-filters';
import { QuickFilters } from './quick-filters';
import { FilterTags } from './filter-tags';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';
import { searchService } from '@/services/search-service';
import { 
  getDefaultFilters, 
  countActiveFiltersOptimized, 
  FILTER_PRESETS, 
  applyFilterPreset,
  generateSearchMetrics,
  type SearchFilters 
} from '@/lib/search-utils';
import type { ToolWithCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

interface EnhancedSearchProps {
  onResults: (results: ToolWithCategory[], metrics?: any) => void;
  className?: string;
  showMetrics?: boolean;
  enablePresets?: boolean;
}

export function EnhancedSearch({ 
  onResults, 
  className,
  showMetrics = false,
  enablePresets = true,
}: EnhancedSearchProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  // Enhanced search with debouncing and caching
  const {
    data: results,
    isLoading,
    error,
    totalCount,
    searchTerm,
    filters,
    updateFilters,
    resetFilters,
    clearSearch,
  } = useDebouncedSearch(
    useCallback(async (searchFilters: SearchFilters) => {
      const response = await searchService.searchTools(searchFilters);
      
      // Generate metrics for analytics
      const metrics = generateSearchMetrics(
        searchFilters,
        response.totalCount,
        response.searchTime,
        response.cached
      );

      // Call onResults with results and metrics
      onResults(response.data, { ...metrics, response });
      
      return {
        data: response.data,
        totalCount: response.totalCount,
      };
    }, [onResults]),
    getDefaultFilters(),
    {
      debounceMs: 300,
      minQueryLength: 2,
      enableCache: true,
      cacheTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Handle search input changes
  const handleSearchChange = useCallback((query: string) => {
    updateFilters(prev => ({ ...prev, query }));
  }, [updateFilters]);

  // Handle filter preset selection
  const handlePresetSelect = useCallback((presetName: keyof typeof FILTER_PRESETS) => {
    const newFilters = applyFilterPreset(presetName, filters);
    updateFilters(() => newFilters);
  }, [filters, updateFilters]);

  // Toggle advanced filters
  const toggleAdvanced = useCallback(() => {
    setShowAdvanced(prev => !prev);
  }, []);

  // Toggle free tier filter
  const toggleFreeTier = useCallback(() => {
    updateFilters(prev => ({ ...prev, hasFreeTier: !prev.hasFreeTier }));
  }, [updateFilters]);

  // Toggle integrations filter
  const toggleIntegrations = useCallback(() => {
    updateFilters(prev => ({ ...prev, hasIntegrations: !prev.hasIntegrations }));
  }, [updateFilters]);

  const activeFilterCount = countActiveFiltersOptimized(filters);
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Search Input */}
      <SearchInput
        value={filters.query}
        onChange={handleSearchChange}
        placeholder="Search tools by name, description, features..."
        showSuggestions={true}
        showPopularTerms={true}
      />

      {/* Quick Actions Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Quick Filters */}
        <QuickFilters
          filters={filters}
          showAdvanced={showAdvanced}
          onToggleFreeTier={toggleFreeTier}
          onToggleIntegrations={toggleIntegrations}
          onToggleAdvanced={toggleAdvanced}
        />

        {/* Filter Presets */}
        {enablePresets && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPresets(!showPresets)}
              className="text-xs"
            >
              <Zap className="h-3 w-3 mr-1" />
              Presets
            </Button>
          </>
        )}

        {/* Active Filter Count */}
        {hasActiveFilters && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </>
        )}

        {/* Search Metrics */}
        {showMetrics && results.length > 0 && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{totalCount} results</span>
              {isLoading && <Clock className="h-3 w-3 animate-spin" />}
            </div>
          </>
        )}
      </div>

      {/* Filter Presets */}
      {showPresets && enablePresets && (
        <Card className="p-3">
          <div className="space-y-2">
            <div className="text-sm font-medium">Quick Presets</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(FILTER_PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSelect(key as keyof typeof FILTER_PRESETS)}
                  className="text-xs capitalize"
                >
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <FilterTags
          filters={filters}
          onRemoveFilter={(filterKey, value) => {
            updateFilters(prev => {
              const updated = { ...prev };
              if (filterKey === 'languages') {
                updated.languages = updated.languages.filter(l => l !== value);
              } else if (filterKey === 'frameworks') {
                updated.frameworks = updated.frameworks.filter(f => f !== value);
              } else if (filterKey === 'category') {
                updated.category = '';
              } else if (filterKey === 'minPopularity') {
                updated.minPopularity = 0;
              } else if (filterKey === 'minMaturity') {
                updated.minMaturity = 0;
              } else if (filterKey === 'hasFreeTier') {
                updated.hasFreeTier = false;
              } else if (filterKey === 'hasIntegrations') {
                updated.hasIntegrations = false;
              }
              return updated;
            });
          }}
        />
      )}

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card className="p-4">
          <AdvancedFilters
            filters={filters}
            onUpdateFilters={updateFilters}
          />
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 border-destructive">
          <div className="text-sm text-destructive">
            Search error: {error.message}
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 animate-spin" />
            Searching...
          </div>
        </div>
      )}
    </div>
  );
}