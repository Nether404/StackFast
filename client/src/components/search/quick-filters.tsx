/**
 * Quick filter buttons component for advanced search
 */

import { Button } from "@/components/ui/button";
import { DollarSign, GitBranch, Filter } from "lucide-react";
import type { SearchFilters } from "@/lib/search-utils";

interface QuickFiltersProps {
  filters: SearchFilters;
  showAdvanced: boolean;
  onToggleFreeTier: () => void;
  onToggleIntegrations: () => void;
  onToggleAdvanced: () => void;
}

export function QuickFilters({ 
  filters, 
  showAdvanced, 
  onToggleFreeTier, 
  onToggleIntegrations, 
  onToggleAdvanced 
}: QuickFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={filters.hasFreeTier ? "default" : "outline"}
        size="sm"
        onClick={onToggleFreeTier}
        className={filters.hasFreeTier ? "bg-neon-orange hover:bg-neon-orange/90" : ""}
      >
        <DollarSign className="h-3 w-3 mr-1" />
        Free Tier
      </Button>
      <Button
        variant={filters.hasIntegrations ? "default" : "outline"}
        size="sm"
        onClick={onToggleIntegrations}
        className={filters.hasIntegrations ? "bg-neon-orange hover:bg-neon-orange/90" : ""}
      >
        <GitBranch className="h-3 w-3 mr-1" />
        Has Integrations
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleAdvanced}
      >
        <Filter className="h-3 w-3 mr-1" />
        {showAdvanced ? "Hide" : "Show"} Advanced
      </Button>
    </div>
  );
}