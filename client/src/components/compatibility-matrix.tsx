import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import type { ToolWithCategory, CompatibilityMatrix } from "@shared/schema";

interface CompatibilityMatrixProps {
  searchQuery: string;
  filters: {
    category: string;
    compatibility: string;
    maturity: string;
  };
  onToolClick: (tool: ToolWithCategory) => void;
}

export function CompatibilityMatrix({ searchQuery, filters, onToolClick }: CompatibilityMatrixProps) {
  const { data: tools = [], isLoading: toolsLoading } = useQuery<ToolWithCategory[]>({
    queryKey: ["/api/tools/quality"],
  });

  const { data: compatibilityMatrix = [], isLoading: matrixLoading } = useQuery<CompatibilityMatrix[]>({
    queryKey: ["/api/compatibility-matrix"],
  });

  const getCompatibilityScore = (toolOne: ToolWithCategory, toolTwo: ToolWithCategory) => {
    if (toolOne.id === toolTwo.id) return null; // Self-compatibility
    
    const compatibility = compatibilityMatrix.find(
      (c) =>
        (c.toolOne.id === toolOne.id && c.toolTwo.id === toolTwo.id) ||
        (c.toolOne.id === toolTwo.id && c.toolTwo.id === toolOne.id)
    );
    
    return compatibility || null;
  };

  const getCompatibilityClass = (score: number) => {
    if (score >= 90) return "compatibility-high";
    if (score >= 70) return "compatibility-medium";
    if (score >= 50) return "compatibility-low";
    return "compatibility-none";
  };

  const filteredTools = tools.filter((tool) => {
    // Search filter
    if (searchQuery && !tool.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !tool.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Category filter
    if (filters.category !== "all" && filters.category !== tool.category.name.toLowerCase().replace(/[^a-z]/g, "-")) {
      return false;
    }

    // Maturity filter
    if (filters.maturity !== "all") {
      if (filters.maturity === "mature" && tool.maturityScore < 8.0) return false;
      if (filters.maturity === "stable" && (tool.maturityScore < 6.0 || tool.maturityScore >= 8.0)) return false;
      if (filters.maturity === "beta" && tool.maturityScore >= 6.0) return false;
    }

    return true;
  });

  const getCategoryColor = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case "ai coding tools":
        return "text-neon-orange";
      case "frontend/design":
        return "text-info";
      case "backend/database":
        return "text-success";
      case "payment platforms":
        return "text-warning";
      default:
        return "text-github-text-secondary";
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case "ai coding tools":
        return "🤖";
      case "frontend/design":
        return "🎨";
      case "backend/database":
        return "🗄️";
      case "payment platforms":
        return "💳";
      default:
        return "🔧";
    }
  };

  if (toolsLoading || matrixLoading) {
    return (
      <Card className="bg-github-surface border-github-border">
        <CardHeader>
          <CardTitle className="text-github-text">Loading Compatibility Matrix...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="loading-shimmer h-12 rounded bg-github-border" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="bg-github-surface rounded-lg border-github-border overflow-hidden">
        <CardHeader className="border-b border-github-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-github-text" data-testid="matrix-title">
                Tool Compatibility Matrix
              </CardTitle>
              <p className="text-sm text-github-text-secondary mt-1">
                Interactive visualization of tool compatibility across tech stack categories
              </p>
            </div>
            
            {/* Legend */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full compatibility-high" data-testid="legend-high"></div>
                <span className="text-xs text-github-text-secondary">High (90-100%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full compatibility-medium" data-testid="legend-medium"></div>
                <span className="text-xs text-github-text-secondary">Medium (70-89%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full compatibility-low" data-testid="legend-low"></div>
                <span className="text-xs text-github-text-secondary">Low (50-69%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full compatibility-none" data-testid="legend-none"></div>
                <span className="text-xs text-github-text-secondary">None (&lt;50%)</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        {/* Matrix Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Column Headers */}
            <div className="flex bg-github-dark border-b border-github-border">
              <div className="w-48 p-3 border-r border-github-border">
                <span className="text-sm font-medium text-github-text-secondary">Tool Name</span>
              </div>
              {filteredTools.map((tool, index) => (
                <div key={tool.id} className="w-24 p-3 border-r border-github-border text-center">
                  <div className="transform -rotate-45 origin-center whitespace-nowrap">
                    <span 
                      className={`text-xs font-medium ${getCategoryColor(tool.category.name)}`}
                      data-testid={`header-${tool.id}`}
                    >
                      {tool.name.length > 10 ? tool.name.substring(0, 10) + "..." : tool.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Matrix Rows */}
            {filteredTools.map((rowTool) => (
              <div 
                key={rowTool.id} 
                className="flex border-b border-github-border hover:bg-github-dark/50 transition-colors"
                data-testid={`row-${rowTool.id}`}
              >
                <div className="w-48 p-3 border-r border-github-border">
                  <div 
                    className="flex items-center space-x-3 cursor-pointer"
                    onClick={() => onToolClick(rowTool)}
                  >
                    <div className="w-8 h-8 bg-github-border rounded-lg flex items-center justify-center text-sm">
                      {getCategoryIcon(rowTool.category.name)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-github-text hover:text-neon-orange transition-colors" data-testid={`row-tool-name-${rowTool.id}`}>
                        {rowTool.name}
                      </div>
                      <div className="text-xs text-github-text-secondary" data-testid={`row-tool-category-${rowTool.id}`}>
                        {rowTool.category.name}
                      </div>
                    </div>
                  </div>
                </div>
                
                {filteredTools.map((colTool) => {
                  const compatibility = getCompatibilityScore(rowTool, colTool);
                  
                  return (
                    <div 
                      key={colTool.id} 
                      className="w-24 p-3 border-r border-github-border flex items-center justify-center"
                      data-testid={`cell-${rowTool.id}-${colTool.id}`}
                    >
                      {compatibility ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`w-6 h-6 rounded matrix-cell cursor-pointer flex items-center justify-center ${getCompatibilityClass(compatibility.compatibilityScore)}`}
                            >
                              <span className="text-xs text-white font-medium">
                                {Math.round(compatibility.compatibilityScore)}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-github-dark border-github-border text-github-text max-w-xs">
                            <div className="text-sm">
                              <div className="font-medium mb-1">
                                {rowTool.name} ↔ {colTool.name}
                              </div>
                              <div className="text-xs text-github-text-secondary mb-1">
                                Compatibility: {compatibility.compatibilityScore.toFixed(1)}%
                              </div>
                              {compatibility.notes && (
                                <div className="text-xs text-github-text-secondary">
                                  {compatibility.notes}
                                </div>
                              )}
                              {compatibility.verifiedIntegration === 1 && (
                                <Badge variant="secondary" className="mt-1 text-xs">
                                  Verified Integration
                                </Badge>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : rowTool.id === colTool.id ? (
                        <div className="w-6 h-6 bg-github-border rounded matrix-cell flex items-center justify-center">
                          <span className="text-xs text-github-text-secondary">—</span>
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-github-border/50 rounded matrix-cell flex items-center justify-center">
                          <span className="text-xs text-github-text-secondary">?</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}
