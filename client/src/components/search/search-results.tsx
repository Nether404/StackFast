/**
 * Enhanced search results component with performance metrics
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, Zap, Database, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { SearchPerformanceMonitor } from './search-performance-monitor';
import type { ToolWithCategory } from '@/lib/types';
import type { SearchPerformanceMetrics } from '@/lib/search-utils';

interface SearchResultsProps {
  results: ToolWithCategory[];
  isLoading: boolean;
  error?: Error | null;
  metrics?: SearchPerformanceMetrics & {
    response?: {
      searchTime: number;
      cached: boolean;
      appliedFilters: string[];
    };
  };
  onToolClick?: (tool: ToolWithCategory) => void;
  className?: string;
  showMetrics?: boolean;
}

export function SearchResults({
  results,
  isLoading,
  error,
  metrics,
  onToolClick,
  className = '',
  showMetrics = false,
}: SearchResultsProps) {
  const [showPerformanceDetails, setShowPerformanceDetails] = useState(false);

  if (error) {
    return (
      <Card className={`p-6 border-destructive ${className}`}>
        <div className="text-center">
          <div className="text-destructive font-medium mb-2">Search Error</div>
          <div className="text-sm text-muted-foreground">{error.message}</div>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 animate-spin" />
            Searching...
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Results Header with Metrics */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {results.length} result{results.length !== 1 ? 's' : ''}
              {metrics?.response && (
                <span className="ml-2">
                  in {Math.round(metrics.response.searchTime)}ms
                </span>
              )}
            </div>

            {/* Cache Indicator */}
            {metrics?.response?.cached && (
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Cached
              </Badge>
            )}

            {/* Applied Filters */}
            {metrics?.response?.appliedFilters && metrics.response.appliedFilters.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Database className="h-3 w-3 mr-1" />
                {metrics.response.appliedFilters.length} filter{metrics.response.appliedFilters.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Performance Toggle */}
          {showMetrics && metrics && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPerformanceDetails(!showPerformanceDetails)}
            >
              {showPerformanceDetails ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Performance Details */}
        {showPerformanceDetails && metrics && (
          <>
            <Separator className="my-3" />
            <SearchPerformanceMonitor metrics={metrics} />
          </>
        )}
      </Card>

      {/* Results List */}
      {results.length > 0 ? (
        <div className="grid gap-4">
          {results.map((tool) => (
            <Card
              key={tool.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onToolClick?.(tool)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{tool.name}</h3>
                    {tool.category && (
                      <Badge variant="outline" className="text-xs">
                        {tool.category.name}
                      </Badge>
                    )}
                  </div>
                  
                  {tool.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {tool.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {tool.popularityScore !== undefined && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Popularity: {tool.popularityScore}/10
                      </div>
                    )}
                    {tool.maturityScore !== undefined && (
                      <div className="flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        Maturity: {tool.maturityScore}/10
                      </div>
                    )}
                  </div>
                </div>

                {/* Tool Scores */}
                <div className="text-right">
                  {(tool.popularityScore !== undefined || tool.maturityScore !== undefined) && (
                    <div className="text-sm font-medium">
                      Score: {Math.round(((tool.popularityScore || 0) + (tool.maturityScore || 0)) / 2)}/10
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <div className="text-lg font-medium mb-2">No results found</div>
            <div className="text-sm">
              Try adjusting your search terms or filters
            </div>
          </div>
        </Card>
      )}

      {/* Compact Performance Monitor */}
      {showMetrics && metrics && !showPerformanceDetails && (
        <div className="flex justify-center">
          <SearchPerformanceMonitor metrics={metrics} compact />
        </div>
      )}
    </div>
  );
}