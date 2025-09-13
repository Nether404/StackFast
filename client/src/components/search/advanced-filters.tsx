/**
 * Advanced filter controls component
 */

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Shield } from "lucide-react";
import type { SearchFilters } from "@/lib/search-utils";
import { COMMON_LANGUAGES, COMMON_FRAMEWORKS, toggleArrayItem } from "@/lib/search-utils";

interface AdvancedFiltersProps {
  filters: SearchFilters;
  onUpdateFilters: (updater: (prev: SearchFilters) => SearchFilters) => void;
}

export function AdvancedFilters({ filters, onUpdateFilters }: AdvancedFiltersProps) {
  const toggleLanguage = (language: string) => {
    onUpdateFilters(prev => ({
      ...prev,
      languages: toggleArrayItem(prev.languages, language)
    }));
  };

  const toggleFramework = (framework: string) => {
    onUpdateFilters(prev => ({
      ...prev,
      frameworks: toggleArrayItem(prev.frameworks, framework)
    }));
  };

  return (
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
          onValueChange={([value]) => onUpdateFilters(prev => ({ ...prev, minPopularity: value }))}
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
          onValueChange={([value]) => onUpdateFilters(prev => ({ ...prev, minMaturity: value }))}
          max={10}
          step={1}
          className="w-full"
        />
      </div>

      {/* Language Filters */}
      <div className="space-y-2">
        <Label className="text-sm text-github-text-secondary">Languages:</Label>
        <div className="flex flex-wrap gap-2">
          {COMMON_LANGUAGES.map(lang => (
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
          {COMMON_FRAMEWORKS.map(framework => (
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
          onValueChange={(value: any) => onUpdateFilters(prev => ({ ...prev, sortBy: value }))}
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
  );
}