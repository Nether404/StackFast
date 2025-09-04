import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Filter, X, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

interface SearchFilters {
  query: string;
  category: string;
  minPopularity: number;
  minMaturity: number;
  hasFreeTier: boolean;
}

interface ToolSearchProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

export function ToolSearch({ onSearch, isLoading }: ToolSearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "",
    minPopularity: 0,
    minMaturity: 0,
    hasFreeTier: false,
  });

  // Fetch categories for filter dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ["/api/v1/categories"],
    staleTime: 5 * 60 * 1000,
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, query: searchQuery }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Apply filters when they change
  useEffect(() => {
    onSearch(filters);
  }, [filters, onSearch]);

  const handleReset = () => {
    setSearchQuery("");
    setFilters({
      query: "",
      category: "",
      minPopularity: 0,
      minMaturity: 0,
      hasFreeTier: false,
    });
    setShowFilters(false);
  };

  const activeFilterCount = [
    filters.category,
    filters.minPopularity > 0,
    filters.minMaturity > 0,
    filters.hasFreeTier,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tools by name, description, or features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-tools-input"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          data-testid="toggle-filters-button"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-6 space-y-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              data-testid="reset-filters-button"
            >
              <X className="h-4 w-4 mr-2" />
              Reset All
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Category Filter */}
            <div className="space-y-2">
              <Label htmlFor="category-filter">Category</Label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="category-filter" data-testid="category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categoriesData?.categories?.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name} ({cat.toolCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Popularity Filter */}
            <div className="space-y-2">
              <Label htmlFor="popularity-filter">
                Minimum Popularity: {filters.minPopularity}%
              </Label>
              <Slider
                id="popularity-filter"
                min={0}
                max={100}
                step={10}
                value={[filters.minPopularity]}
                onValueChange={([value]) => setFilters(prev => ({ ...prev, minPopularity: value }))}
                className="mt-2"
                data-testid="popularity-filter"
              />
            </div>

            {/* Maturity Filter */}
            <div className="space-y-2">
              <Label htmlFor="maturity-filter">
                Minimum Maturity: {filters.minMaturity}%
              </Label>
              <Slider
                id="maturity-filter"
                min={0}
                max={100}
                step={10}
                value={[filters.minMaturity]}
                onValueChange={([value]) => setFilters(prev => ({ ...prev, minMaturity: value }))}
                className="mt-2"
                data-testid="maturity-filter"
              />
            </div>

            {/* Free Tier Filter */}
            <div className="flex items-center space-x-2">
              <Switch
                id="free-tier-filter"
                checked={filters.hasFreeTier}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, hasFreeTier: checked }))}
                data-testid="free-tier-filter"
              />
              <Label htmlFor="free-tier-filter" className="cursor-pointer">
                Has Free Tier
              </Label>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {filters.category && (
                <Badge variant="secondary">
                  Category: {filters.category}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, category: "" }))}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.minPopularity > 0 && (
                <Badge variant="secondary">
                  Popularity ≥ {filters.minPopularity}%
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, minPopularity: 0 }))}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.minMaturity > 0 && (
                <Badge variant="secondary">
                  Maturity ≥ {filters.minMaturity}%
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, minMaturity: 0 }))}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.hasFreeTier && (
                <Badge variant="secondary">
                  Free Tier
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, hasFreeTier: false }))}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}