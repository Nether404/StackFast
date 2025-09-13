/**
 * Enhanced Search Demo Page - Showcases all search improvements
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Zap, BarChart3, Settings, Database } from 'lucide-react';
import { EnhancedSearch } from '@/components/search/enhanced-search';
import { SearchResults } from '@/components/search/search-results';
import { SearchAnalytics } from '@/components/search/search-analytics';
import { SearchPerformanceMonitor } from '@/components/search/search-performance-monitor';
import { searchPreloader } from '@/services/search-preloader';
import type { ToolWithCategory } from '@/lib/types';
import type { SearchPerformanceMetrics } from '@/lib/search-utils';

export default function EnhancedSearchDemo() {
  const [searchResults, setSearchResults] = useState<ToolWithCategory[]>([]);
  const [searchMetrics, setSearchMetrics] = useState<SearchPerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Handle search results
  const handleSearchResults = (results: ToolWithCategory[], metrics?: any) => {
    setSearchResults(results);
    setSearchMetrics(metrics);
    setIsLoading(false);
    setError(null);
  };

  // Handle tool selection
  const handleToolClick = (tool: ToolWithCategory) => {
    console.log('Selected tool:', tool);
    // Could navigate to tool detail page or open modal
  };

  // Preloader actions
  const handlePreloadPopular = async () => {
    const popularTerms = ['react', 'vue', 'angular', 'node', 'python', 'docker'];
    for (const term of popularTerms) {
      await searchPreloader.preloadSearch(term, 5);
    }
  };

  const preloaderStats = searchPreloader.getStats();

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Enhanced Search Demo</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Experience the improved search functionality with debouncing, caching, 
          performance monitoring, and advanced filtering capabilities.
        </p>
        
        {/* Feature Badges */}
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Zap className="h-3 w-3 mr-1" />
            Debounced Input
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Database className="h-3 w-3 mr-1" />
            Smart Caching
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Search className="h-3 w-3 mr-1" />
            Autocomplete
          </Badge>
          <Badge variant="outline" className="text-sm">
            <BarChart3 className="h-3 w-3 mr-1" />
            Performance Metrics
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Settings className="h-3 w-3 mr-1" />
            Advanced Filters
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Main Content */}
      <Tabs defaultValue="search" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Enhanced Search</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="preloader">Preloader</TabsTrigger>
        </TabsList>

        {/* Enhanced Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Search Tools</h2>
            <EnhancedSearch
              onResults={handleSearchResults}
              showMetrics={true}
              enablePresets={true}
            />
          </Card>

          <SearchResults
            results={searchResults}
            isLoading={isLoading}
            error={error}
            metrics={searchMetrics}
            onToolClick={handleToolClick}
            showMetrics={true}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Search Analytics</h2>
            <p className="text-muted-foreground mb-6">
              Track popular search terms, cache performance, and user behavior patterns.
            </p>
            <SearchAnalytics showDetails={true} />
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Performance Monitoring</h2>
            <p className="text-muted-foreground mb-6">
              Real-time performance metrics for search operations.
            </p>
            
            {searchMetrics ? (
              <SearchPerformanceMonitor metrics={searchMetrics} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Perform a search to see performance metrics
              </div>
            )}
          </Card>

          {/* Performance Tips */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Features</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Debounced Input</h4>
                <p className="text-sm text-muted-foreground">
                  Search requests are debounced by 300ms to prevent excessive API calls
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Smart Caching</h4>
                <p className="text-sm text-muted-foreground">
                  Search results are cached for 5 minutes with intelligent invalidation
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Optimized Queries</h4>
                <p className="text-sm text-muted-foreground">
                  Database queries use proper indexing and efficient joins
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Response Compression</h4>
                <p className="text-sm text-muted-foreground">
                  API responses are compressed using gzip/brotli for faster transfer
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Preloader Tab */}
        <TabsContent value="preloader" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Search Preloader</h2>
            <p className="text-muted-foreground mb-6">
              Proactively cache popular searches and filter combinations for better performance.
            </p>

            {/* Preloader Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {preloaderStats.queueSize}
                </div>
                <div className="text-sm text-muted-foreground">Queue Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {preloaderStats.preloadedTerms}
                </div>
                <div className="text-sm text-muted-foreground">Preloaded Terms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {preloaderStats.isPreloading ? (
                    <span className="text-orange-600">Active</span>
                  ) : (
                    <span className="text-green-600">Idle</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Status</div>
              </div>
            </div>

            {/* Preloader Actions */}
            <div className="space-y-4">
              <Button onClick={handlePreloadPopular} className="w-full">
                <Zap className="h-4 w-4 mr-2" />
                Preload Popular Terms
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => searchPreloader.clear()}
                className="w-full"
              >
                Clear Preloader Cache
              </Button>
            </div>

            {/* Preloader Features */}
            <Separator className="my-6" />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Preloader Features</h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Popular Categories</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically preloads searches for common categories like frontend, backend, etc.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Filter Presets</div>
                    <div className="text-sm text-muted-foreground">
                      Preloads common filter combinations like "popular tools" and "free tier"
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Recent Searches</div>
                    <div className="text-sm text-muted-foreground">
                      Preloads user's recent search terms for instant results
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}