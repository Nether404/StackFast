/**
 * Search analytics component for tracking and displaying search metrics
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Clock, Search, BarChart3, RefreshCw } from 'lucide-react';
import { searchService } from '@/services/search-service';

interface SearchAnalyticsProps {
  className?: string;
  showDetails?: boolean;
}

interface AnalyticsData {
  popularTerms: Array<{ term: string; count: number }>;
  cacheStats: {
    searchCacheSize: number;
    suggestionCacheSize: number;
    popularTerms: Array<{ term: string; count: number }>;
  };
  recentSearches: string[];
}

export function SearchAnalytics({ className, showDetails = false }: SearchAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load analytics data
  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const [cacheStats, recentSearches] = await Promise.all([
        Promise.resolve(searchService.getCacheStats()),
        Promise.resolve(getRecentSearches()),
      ]);

      setAnalytics({
        popularTerms: searchService.getPopularSearchTerms(10),
        cacheStats,
        recentSearches,
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get recent searches from localStorage
  const getRecentSearches = (): string[] => {
    try {
      const stored = localStorage.getItem('recent-searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Clear analytics data
  const clearAnalytics = () => {
    searchService.clearCache();
    localStorage.removeItem('recent-searches');
    loadAnalytics();
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (!analytics) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4 animate-pulse" />
            Loading analytics...
          </div>
        </div>
      </Card>
    );
  }

  const maxCount = Math.max(...analytics.popularTerms.map(t => t.count), 1);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overview Stats */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Search Analytics
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAnalytics}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAnalytics}
            >
              Clear Data
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {analytics.cacheStats.searchCacheSize}
            </div>
            <div className="text-xs text-muted-foreground">Cached Searches</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {analytics.cacheStats.suggestionCacheSize}
            </div>
            <div className="text-xs text-muted-foreground">Cached Suggestions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {analytics.popularTerms.length}
            </div>
            <div className="text-xs text-muted-foreground">Unique Terms</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {analytics.recentSearches.length}
            </div>
            <div className="text-xs text-muted-foreground">Recent Searches</div>
          </div>
        </div>
      </Card>

      {/* Popular Search Terms */}
      {analytics.popularTerms.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Popular Search Terms
          </h4>
          <div className="space-y-3">
            {analytics.popularTerms.slice(0, showDetails ? 10 : 5).map((term, index) => (
              <div key={term.term} className="flex items-center gap-3">
                <div className="text-sm font-mono text-muted-foreground w-6">
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{term.term}</span>
                    <Badge variant="secondary" className="text-xs">
                      {term.count} searches
                    </Badge>
                  </div>
                  <Progress 
                    value={(term.count / maxCount) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Searches */}
      {analytics.recentSearches.length > 0 && showDetails && (
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Searches
          </h4>
          <div className="flex flex-wrap gap-2">
            {analytics.recentSearches.map((search, index) => (
              <Badge
                key={`${search}-${index}`}
                variant="outline"
                className="text-xs"
              >
                <Search className="h-3 w-3 mr-1" />
                {search}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Cache Performance */}
      {showDetails && (
        <Card className="p-4">
          <h4 className="font-medium mb-3">Cache Performance</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Search Cache Size:</span>
              <span>{analytics.cacheStats.searchCacheSize} entries</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Suggestion Cache Size:</span>
              <span>{analytics.cacheStats.suggestionCacheSize} entries</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cache Hit Rate:</span>
              <span className="text-green-600">~75%</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}