import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface SearchFiltersProps {
  filters: {
    category: string;
    compatibility: string;
    maturity: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
}

export function SearchFilters({ filters, onFilterChange, onClearFilters }: SearchFiltersProps) {
  return (
    <Card className="bg-github-surface rounded-lg p-4 mb-6 border border-github-border">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-github-text-secondary">Category:</label>
          <Select value={filters.category} onValueChange={(value) => onFilterChange("category", value)}>
            <SelectTrigger className="bg-github-dark border-github-border text-github-text w-48" data-testid="filter-category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-github-dark border-github-border">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="ai-coding">AI Coding Tools</SelectItem>
              <SelectItem value="frontend">Frontend/Design</SelectItem>
              <SelectItem value="backend">Backend/Database</SelectItem>
              <SelectItem value="payment">Payment Platforms</SelectItem>
              <SelectItem value="devops">DevOps/Deployment</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-github-text-secondary">Compatibility:</label>
          <Select value={filters.compatibility} onValueChange={(value) => onFilterChange("compatibility", value)}>
            <SelectTrigger className="bg-github-dark border-github-border text-github-text w-48" data-testid="filter-compatibility">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent className="bg-github-dark border-github-border">
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="high">High (90-100%)</SelectItem>
              <SelectItem value="medium">Medium (70-89%)</SelectItem>
              <SelectItem value="low">Low (50-69%)</SelectItem>
              <SelectItem value="none">None (&lt;50%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-github-text-secondary">Maturity:</label>
          <Select value={filters.maturity} onValueChange={(value) => onFilterChange("maturity", value)}>
            <SelectTrigger className="bg-github-dark border-github-border text-github-text w-48" data-testid="filter-maturity">
              <SelectValue placeholder="All Maturity" />
            </SelectTrigger>
            <SelectContent className="bg-github-dark border-github-border">
              <SelectItem value="all">All Maturity</SelectItem>
              <SelectItem value="mature">Mature (8.0+)</SelectItem>
              <SelectItem value="stable">Stable (6.0-7.9)</SelectItem>
              <SelectItem value="beta">Beta (&lt;6.0)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={onClearFilters}
          className="text-neon-orange hover:text-neon-orange-light text-sm flex items-center space-x-1"
          data-testid="button-clear-filters"
        >
          <X className="w-4 h-4" />
          <span>Clear Filters</span>
        </Button>
      </div>
    </Card>
  );
}
