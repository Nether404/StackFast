/**
 * Search performance monitoring component
 */

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Zap, Database, TrendingUp } from 'lucide-react';
import type { SearchPerformanceMetrics } from '@/lib/search-utils';

interface SearchPerformanceMonitorProps {
  metrics?: SearchPerformanceMetrics;
  className?: string;
  compact?: boolean;
}

interface PerformanceHistory {
  timestamp: number;
  searchTime: number;
  resultsCount: number;
  cacheHit: boolean;
}

export function SearchPerformanceMonitor({ 
  metrics, 
  className = '',
  compact = false 
}: SearchPerformanceMonitorProps) {
  const [history, setHistory] = useState<PerformanceHistory[]>([]);
  const [averageTime, setAverageTime] = useState(0);
  const [cacheHitRate, setCacheHitRate] = useState(0);

  // Update performance history when new metrics arrive
  useEffect(() => {
    if (metrics) {
      const newEntry: PerformanceHistory = {
        timestamp: Date.now(),
        searchTime: metrics.searchTime,
        resultsCount: metrics.resultsCount,
        cacheHit: metrics.cacheHit,
      };

      setHistory(prev => {
        const updated = [...prev, newEntry].slice(-20); // Keep last 20 entries
        
        // Calculate average search time
        const avgTime = updated.reduce((sum, entry) => sum + entry.searchTime, 0) / updated.length;
        setAverageTime(avgTime);
        
        // Calculate cache hit rate
        const cacheHits = updated.filter(entry => entry.cacheHit).length;
        const hitRate = (cacheHits / updated.length) * 100;
        setCacheHitRate(hitRate);
        
        return updated;
      });
    }
  }, [metrics]);

  if (!metrics && history.length === 0) {
    return null;
  }

  const getPerformanceColor = (time: number) => {
    if (time < 100) return 'text-green-600';
    if (time < 300) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceLevel = (time: number) => {
    if (time < 100) return { level: 'Excellent', progress: 100 };
    if (time < 300) return { level: 'Good', progress: 75 };
    if (time < 500) return { level: 'Fair', progress: 50 };
    return { level: 'Slow', progress: 25 };
  };

  if (compact) {
    return (
      <TooltipProvider>
        <div className={`flex items-center gap-2 text-xs ${className}`}>
          {metrics && (
            <>
              <Tooltip>
                <TooltipTrigger>
                  <Badge 
                    variant={metrics.cacheHit ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {Math.round(metrics.searchTime)}ms
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <div>Search Time: {Math.round(metrics.searchTime)}ms</div>
                    <div>Results: {metrics.resultsCount}</div>
                    <div>Cache: {metrics.cacheHit ? 'Hit' : 'Miss'}</div>
                    <div>Filters: {metrics.filterCount}</div>
                  </div>
                </TooltipContent>
              </Tooltip>

              {metrics.cacheHit && (
                <Badge variant="outline" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Cached
                </Badge>
              )}
            </>
          )}

          {history.length > 0 && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {Math.round(averageTime)}ms avg
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div>Average Time: {Math.round(averageTime)}ms</div>
                  <div>Cache Hit Rate: {Math.round(cacheHitRate)}%</div>
                  <div>Searches: {history.length}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  }

  const currentPerformance = metrics ? getPerformanceLevel(metrics.searchTime) : null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Current Search Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center">
            <div className={`text-lg font-bold ${getPerformanceColor(metrics.searchTime)}`}>
              {Math.round(metrics.searchTime)}ms
            </div>
            <div className="text-xs text-muted-foreground">Search Time</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {metrics.resultsCount}
            </div>
            <div className="text-xs text-muted-foreground">Results</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold">
              {metrics.cacheHit ? (
                <span className="text-green-600">Hit</span>
              ) : (
                <span className="text-orange-600">Miss</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">Cache</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {metrics.filterCount}
            </div>
            <div className="text-xs text-muted-foreground">Filters</div>
          </div>
        </div>
      )}

      {/* Performance Level */}
      {currentPerformance && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Performance</span>
            <span className={getPerformanceColor(metrics!.searchTime)}>
              {currentPerformance.level}
            </span>
          </div>
          <Progress value={currentPerformance.progress} className="h-2" />
        </div>
      )}

      {/* Historical Averages */}
      {history.length > 0 && (
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground">
              Average Time
            </div>
            <div className={`text-lg font-bold ${getPerformanceColor(averageTime)}`}>
              {Math.round(averageTime)}ms
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground">
              Cache Hit Rate
            </div>
            <div className="text-lg font-bold text-green-600">
              {Math.round(cacheHitRate)}%
            </div>
          </div>
        </div>
      )}

      {/* Performance Indicators */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>&lt;100ms Excellent</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span>&lt;300ms Good</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span>&gt;500ms Slow</span>
        </div>
      </div>
    </div>
  );
}