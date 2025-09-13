/**
 * Active filter tags component for advanced search
 */

import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { SearchFilters } from "@/lib/search-utils";

interface FilterTagsProps {
  filters: SearchFilters;
  onUpdateFilters: (updater: (prev: SearchFilters) => SearchFilters) => void;
}

export function FilterTags({ filters, onUpdateFilters }: FilterTagsProps) {
  const hasActiveFilters = filters.query || filters.category || filters.hasFreeTier || 
                          filters.minPopularity > 0 || filters.minMaturity > 0;

  if (!hasActiveFilters) return null;

  return (
    <div className="pt-4 border-t border-github-border">
      <p className="text-xs text-github-text-secondary mb-2">Active filters:</p>
      <div className="flex flex-wrap gap-2">
        {filters.query && (
          <Badge variant="secondary" className="text-xs">
            Query: "{filters.query}"
            <X 
              className="h-3 w-3 ml-1 cursor-pointer" 
              onClick={() => onUpdateFilters(prev => ({ ...prev, query: "" }))}
            />
          </Badge>
        )}
        {filters.category && (
          <Badge variant="secondary" className="text-xs">
            Category: {filters.category}
            <X 
              className="h-3 w-3 ml-1 cursor-pointer" 
              onClick={() => onUpdateFilters(prev => ({ ...prev, category: "" }))}
            />
          </Badge>
        )}
        {filters.hasFreeTier && (
          <Badge variant="secondary" className="text-xs">
            Free Tier
            <X 
              className="h-3 w-3 ml-1 cursor-pointer" 
              onClick={() => onUpdateFilters(prev => ({ ...prev, hasFreeTier: false }))}
            />
          </Badge>
        )}
        {filters.minPopularity > 0 && (
          <Badge variant="secondary" className="text-xs">
            Popularity ≥ {filters.minPopularity}
            <X 
              className="h-3 w-3 ml-1 cursor-pointer" 
              onClick={() => onUpdateFilters(prev => ({ ...prev, minPopularity: 0 }))}
            />
          </Badge>
        )}
        {filters.minMaturity > 0 && (
          <Badge variant="secondary" className="text-xs">
            Maturity ≥ {filters.minMaturity}
            <X 
              className="h-3 w-3 ml-1 cursor-pointer" 
              onClick={() => onUpdateFilters(prev => ({ ...prev, minMaturity: 0 }))}
            />
          </Badge>
        )}
      </div>
    </div>
  );
}