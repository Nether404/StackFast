import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import type { ToolCategory } from "@shared/schema";
import { QuickFilters } from "@/components/search/quick-filters";
import { AdvancedFilters } from "@/components/search/advanced-filters";
import { FilterTags } from "@/components/search/filter-tags";
import { 
  SearchFilters, 
  countActiveFilters, 
  getDefaultFilters 
} from "@/lib/search-utils";

interface AdvancedSearchProps {
  categories: ToolCategory[];
  onSearch: (filters: SearchFilters) => void;
  onReset: () => void;
}

export type { SearchFilters };

export function AdvancedSearch({ categories, onSearch, onReset }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>(getDefaultFilters());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    setActiveFiltersCount(countActiveFilters(filters));
  }, [filters]);

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters(getDefaultFilters());
    onReset();
  };

  return (
    <Card className="bg-github-surface border-github-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-neon-orange" />
            Advanced Search
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="bg-neon-orange/20 text-neon-orange">
              {activeFiltersCount} active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Search tools by name, description, or features..."
            value={filters.query}
            onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
            className="flex-1 bg-github-dark border-github-border"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} className="bg-neon-orange hover:bg-neon-orange/90">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Label className="text-sm text-github-text-secondary min-w-[100px]">Category:</Label>
          <Select 
            value={filters.category} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger className="bg-github-dark border-github-border">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent className="bg-github-dark border-github-border">
              <SelectItem value="">All categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Filters */}
        <QuickFilters
          filters={filters}
          showAdvanced={showAdvanced}
          onToggleFreeTier={() => setFilters(prev => ({ ...prev, hasFreeTier: !prev.hasFreeTier }))}
          onToggleIntegrations={() => setFilters(prev => ({ ...prev, hasIntegrations: !prev.hasIntegrations }))}
          onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
        />

        {/* Advanced Filters */}
        {showAdvanced && (
          <AdvancedFilters
            filters={filters}
            onUpdateFilters={setFilters}
          />
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t border-github-border">
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={activeFiltersCount === 0}
          >
            <X className="h-4 w-4 mr-1" />
            Reset Filters
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="secondary"
              onClick={handleSearch}
            >
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        <FilterTags
          filters={filters}
          onUpdateFilters={setFilters}
        />
      </CardContent>
    </Card>
  );
}