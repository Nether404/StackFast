import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  X, 
  DollarSign, 
  TrendingUp, 
  Shield,
  GitBranch,
  Zap
} from "lucide-react";
import type { ToolCategory } from "@shared/schema";

interface AdvancedSearchProps {
  categories: ToolCategory[];
  onSearch: (filters: SearchFilters) => void;
  onReset: () => void;
}

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

export function AdvancedSearch({ categories, onSearch, onReset }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "",
    minPopularity: 0,
    minMaturity: 0,
    hasFreeTier: false,
    hasIntegrations: false,
    languages: [],
    frameworks: [],
    sortBy: "popularity"
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Common languages and frameworks for quick filters
  const commonLanguages = ["JavaScript", "TypeScript", "Python", "Go", "Rust", "Java"];
  const commonFrameworks = ["React", "Vue", "Angular", "Next.js", "Express", "Django"];

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (filters.query) count++;
    if (filters.category) count++;
    if (filters.minPopularity > 0) count++;
    if (filters.minMaturity > 0) count++;
    if (filters.hasFreeTier) count++;
    if (filters.hasIntegrations) count++;
    if (filters.languages.length > 0) count++;
    if (filters.frameworks.length > 0) count++;
    setActiveFiltersCount(count);
  }, [filters]);

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({
      query: "",
      category: "",
      minPopularity: 0,
      minMaturity: 0,
      hasFreeTier: false,
      hasIntegrations: false,
      languages: [],
      frameworks: [],
      sortBy: "popularity"
    });
    onReset();
  };

  const toggleLanguage = (language: string) => {
    setFilters(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const toggleFramework = (framework: string) => {
    setFilters(prev => ({
      ...prev,
      frameworks: prev.frameworks.includes(framework)
        ? prev.frameworks.filter(f => f !== framework)
        : [...prev.frameworks, framework]
    }));
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
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filters.hasFreeTier ? "default" : "outline"}
            size="sm"
            onClick={() => setFilters(prev => ({ ...prev, hasFreeTier: !prev.hasFreeTier }))}
            className={filters.hasFreeTier ? "bg-neon-orange hover:bg-neon-orange/90" : ""}
          >
            <DollarSign className="h-3 w-3 mr-1" />
            Free Tier
          </Button>
          <Button
            variant={filters.hasIntegrations ? "default" : "outline"}
            size="sm"
            onClick={() => setFilters(prev => ({ ...prev, hasIntegrations: !prev.hasIntegrations }))}
            className={filters.hasIntegrations ? "bg-neon-orange hover:bg-neon-orange/90" : ""}
          >
            <GitBranch className="h-3 w-3 mr-1" />
            Has Integrations
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="h-3 w-3 mr-1" />
            {showAdvanced ? "Hide" : "Show"} Advanced
          </Button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t border-github-border">
            {/* Popularity Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-github-text-secondary flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Min Popularity: {filters.minPopularity}
                </Label>
                <span className="text-xs text-github-text-secondary">0-10</span>
              </div>
              <Slider
                value={[filters.minPopularity]}
                onValueChange={([value]) => setFilters(prev => ({ ...prev, minPopularity: value }))}
                max={10}
                step={1}
                className="w-full"
              />
            </div>

            {/* Maturity Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-github-text-secondary flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Min Maturity: {filters.minMaturity}
                </Label>
                <span className="text-xs text-github-text-secondary">0-10</span>
              </div>
              <Slider
                value={[filters.minMaturity]}
                onValueChange={([value]) => setFilters(prev => ({ ...prev, minMaturity: value }))}
                max={10}
                step={1}
                className="w-full"
              />
            </div>

            {/* Language Filters */}
            <div className="space-y-2">
              <Label className="text-sm text-github-text-secondary">Languages:</Label>
              <div className="flex flex-wrap gap-2">
                {commonLanguages.map(lang => (
                  <Badge
                    key={lang}
                    variant={filters.languages.includes(lang) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      filters.languages.includes(lang) 
                        ? "bg-neon-orange hover:bg-neon-orange/90" 
                        : "hover:bg-github-dark"
                    }`}
                    onClick={() => toggleLanguage(lang)}
                  >
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Framework Filters */}
            <div className="space-y-2">
              <Label className="text-sm text-github-text-secondary">Frameworks:</Label>
              <div className="flex flex-wrap gap-2">
                {commonFrameworks.map(framework => (
                  <Badge
                    key={framework}
                    variant={filters.frameworks.includes(framework) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      filters.frameworks.includes(framework) 
                        ? "bg-neon-orange hover:bg-neon-orange/90" 
                        : "hover:bg-github-dark"
                    }`}
                    onClick={() => toggleFramework(framework)}
                  >
                    {framework}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-github-text-secondary min-w-[100px]">Sort by:</Label>
              <Select 
                value={filters.sortBy} 
                onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortBy: value }))}
              >
                <SelectTrigger className="bg-github-dark border-github-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-github-dark border-github-border">
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="maturity">Maturity</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="recent">Recently Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
        {activeFiltersCount > 0 && (
          <div className="pt-4 border-t border-github-border">
            <p className="text-xs text-github-text-secondary mb-2">Active filters:</p>
            <div className="flex flex-wrap gap-2">
              {filters.query && (
                <Badge variant="secondary" className="text-xs">
                  Query: "{filters.query}"
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, query: "" }))}
                  />
                </Badge>
              )}
              {filters.category && (
                <Badge variant="secondary" className="text-xs">
                  Category: {filters.category}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, category: "" }))}
                  />
                </Badge>
              )}
              {filters.hasFreeTier && (
                <Badge variant="secondary" className="text-xs">
                  Free Tier
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, hasFreeTier: false }))}
                  />
                </Badge>
              )}
              {filters.minPopularity > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Popularity ≥ {filters.minPopularity}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, minPopularity: 0 }))}
                  />
                </Badge>
              )}
              {filters.minMaturity > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Maturity ≥ {filters.minMaturity}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, minMaturity: 0 }))}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}