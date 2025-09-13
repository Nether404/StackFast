import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EditCompatibilityDialog } from "@/components/edit-compatibility-dialog";
import { VirtualScroll, VirtualScrollConfig } from "@/components/ui/virtual-scroll";
import { useQuery } from "@tanstack/react-query";
import { Edit, Plus } from "lucide-react";
import type { ToolWithCategory, CompatibilityMatrix, Compatibility } from "@shared/schema";

interface VirtualizedMatrixProps {
  searchQuery: string;
  filters: {
    category: string;
    compatibility: string;
    maturity: string;
  };
  onToolClick: (tool: ToolWithCategory) => void;
}

interface MatrixRowData {
  rowTool: ToolWithCategory;
  filteredTools: ToolWithCategory[];
  compatibilityMatrix: CompatibilityMatrix[];
  onToolClick: (tool: ToolWithCategory) => void;
  onEditCompatibility: (toolOne: ToolWithCategory, toolTwo: ToolWithCategory, compatibilityData: CompatibilityMatrix | null) => void;
}

const MatrixRow = React.memo(({ 
  index, 
  style, 
  data 
}: { 
  index: number; 
  style: React.CSSProperties; 
  data: MatrixRowData[] 
}): React.ReactElement => {
  const rowData = data[index];
  if (!rowData) return <div style={style} />;

  const { rowTool, filteredTools, compatibilityMatrix, onToolClick, onEditCompatibility } = rowData;

  const getCompatibilityScore = useCallback((toolOne: ToolWithCategory, toolTwo: ToolWithCategory) => {
    if (toolOne.id === toolTwo.id) return null; // Self-compatibility

    const compatibility = compatibilityMatrix.find(
      (c) =>
        (c.toolOne.id === toolOne.id && c.toolTwo.id === toolTwo.id) ||
        (c.toolOne.id === toolTwo.id && c.toolTwo.id === toolOne.id)
    );

    return compatibility || null;
  }, [compatibilityMatrix]);

  const getCompatibilityClass = useCallback((score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    if (score >= 50) return "bg-orange-500";
    return "bg-red-500";
  }, []);

  const getCategoryColor = useCallback((categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case "ai coding tools":
        return "text-orange-400";
      case "frontend/design":
        return "text-blue-400";
      case "backend/database":
        return "text-green-400";
      case "payment platforms":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  }, []);

  const getCategoryIcon = useCallback((categoryName: string) => {
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
  }, []);

  return (
    <div
      style={style}
      className="flex border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
    >
      {/* Row Header - Tool Name */}
      <div className="w-48 p-3 border-r border-gray-700 flex-shrink-0 bg-gray-900">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => onToolClick(rowTool)}
        >
          <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-sm">
            {getCategoryIcon(rowTool.category.name)}
          </div>
          <div>
            <div className={`text-sm font-medium hover:text-orange-400 transition-colors ${getCategoryColor(rowTool.category.name)}`}>
              {rowTool.name}
            </div>
            <div className="text-xs text-gray-400">
              {rowTool.category.name}
            </div>
          </div>
        </div>
      </div>

      {/* Matrix Cells */}
      <div className="flex overflow-x-auto">
        {filteredTools.map((colTool) => {
          const compatibilityData = getCompatibilityScore(rowTool, colTool);
          const compatibility = compatibilityData?.compatibility;

          return (
            <div
              key={colTool.id}
              className="w-28 p-2 border-r border-gray-700 flex-shrink-0"
            >
              <div className="flex flex-col items-center space-y-1">
                {compatibility ? (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`w-6 h-6 rounded cursor-pointer flex items-center justify-center ${getCompatibilityClass(compatibility.compatibilityScore)}`}
                        >
                          <span className="text-xs text-white font-medium">
                            {Math.round(compatibility.compatibilityScore)}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-800 border-gray-600 text-white max-w-xs">
                        <div className="text-sm">
                          <div className="font-medium mb-1">
                            {rowTool.name} ↔ {colTool.name}
                          </div>
                          <div className="text-xs text-gray-300 mb-1">
                            Compatibility: {compatibility.compatibilityScore.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-300 mb-1">
                            Difficulty: {compatibility.integrationDifficulty || 'medium'}
                          </div>
                          {compatibility.notes && (
                            <div className="text-xs text-gray-300 mb-1">
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
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0 hover:bg-gray-600"
                      onClick={() => onEditCompatibility(rowTool, colTool, compatibilityData)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </>
                ) : rowTool.id === colTool.id ? (
                  <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
                    <span className="text-xs text-gray-400">—</span>
                  </div>
                ) : (
                  <>
                    <div className="w-6 h-6 bg-gray-600/50 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-400">?</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0 hover:bg-gray-600"
                      onClick={() => onEditCompatibility(rowTool, colTool, null)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

MatrixRow.displayName = "MatrixRow";

export function VirtualizedCompatibilityMatrix({ searchQuery, filters, onToolClick }: VirtualizedMatrixProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCompatibility, setSelectedCompatibility] = useState<{
    compatibility: Compatibility | null;
    toolOne: ToolWithCategory;
    toolTwo: ToolWithCategory;
  } | null>(null);

  const { data: tools = [], isLoading: toolsLoading } = useQuery<ToolWithCategory[]>({
    queryKey: ["/api/tools/quality"],
  });

  const { data: compatibilityMatrix = [], isLoading: matrixLoading } = useQuery<CompatibilityMatrix[]>({
    queryKey: ["/api/compatibility-matrix"],
  });

  const handleEditCompatibility = useCallback((toolOne: ToolWithCategory, toolTwo: ToolWithCategory, compatibilityData: CompatibilityMatrix | null) => {
    setSelectedCompatibility({
      compatibility: compatibilityData?.compatibility || null,
      toolOne,
      toolTwo,
    });
    setEditDialogOpen(true);
  }, []);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
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
  }, [tools, searchQuery, filters]);

  const getCategoryColor = useCallback((categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case "ai coding tools":
        return "text-orange-400";
      case "frontend/design":
        return "text-blue-400";
      case "backend/database":
        return "text-green-400";
      case "payment platforms":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  }, []);

  // Prepare data for virtual scrolling
  const matrixRowData = useMemo(() => {
    return filteredTools.map(rowTool => ({
      rowTool,
      filteredTools,
      compatibilityMatrix,
      onToolClick,
      onEditCompatibility: handleEditCompatibility,
    }));
  }, [filteredTools, compatibilityMatrix, onToolClick, handleEditCompatibility]);

  // Virtual scroll configuration
  const virtualConfig: VirtualScrollConfig = {
    itemHeight: 80, // Height of each matrix row
    containerHeight: 600, // Max height of the virtualized container
    overscan: 5, // Number of items to render outside visible area
    threshold: 20, // Use virtualization when more than 20 tools
  };

  if (toolsLoading || matrixLoading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Loading Compatibility Matrix...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded bg-gray-700 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="bg-gray-900 rounded-lg border-gray-700 overflow-hidden">
        <CardHeader className="border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-white">
                Tool Compatibility Matrix (Virtualized)
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                Interactive visualization with virtual scrolling for large datasets ({filteredTools.length} tools)
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-400">High (90-100%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs text-gray-400">Medium (70-89%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-xs text-gray-400">Low (50-69%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-400">None (&lt;50%)</span>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Matrix Grid with Virtual Scrolling */}
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Column Headers */}
            <div className="flex bg-gray-800 border-b border-gray-700">
              <div className="w-48 p-3 border-r border-gray-700 flex-shrink-0">
                <span className="text-sm font-medium text-gray-300">Tool Name</span>
              </div>
              {filteredTools.map((tool) => (
                <div key={tool.id} className="w-28 p-3 border-r border-gray-700 text-center flex-shrink-0">
                  <div className="transform -rotate-45 origin-center whitespace-nowrap">
                    <span
                      className={`text-xs font-medium ${getCategoryColor(tool.category.name)}`}
                    >
                      {tool.name.length > 10 ? tool.name.substring(0, 10) + "..." : tool.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Virtualized Matrix Rows */}
            <VirtualScroll
              items={matrixRowData}
              config={virtualConfig}
              renderItem={MatrixRow}
              className="virtual-matrix-container"
            />
          </div>
        </div>
      </Card>

      {selectedCompatibility && (
        <EditCompatibilityDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          compatibility={selectedCompatibility.compatibility}
          toolOne={selectedCompatibility.toolOne}
          toolTwo={selectedCompatibility.toolTwo}
        />
      )}
    </TooltipProvider>
  );
}