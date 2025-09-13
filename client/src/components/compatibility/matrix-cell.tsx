/**
 * Individual cell component for the compatibility matrix
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, Plus } from "lucide-react";
import type { ToolWithCategory, CompatibilityMatrix, Compatibility } from "@shared/schema";
import { getCompatibilityClass } from "@/lib/tool-utils";

interface MatrixCellProps {
  rowTool: ToolWithCategory;
  colTool: ToolWithCategory;
  compatibilityData: CompatibilityMatrix | null;
  onEdit: (toolOne: ToolWithCategory, toolTwo: ToolWithCategory, compatibilityData: CompatibilityMatrix | null) => void;
}

export function MatrixCell({ rowTool, colTool, compatibilityData, onEdit }: MatrixCellProps) {
  const compatibility = compatibilityData?.compatibility;

  const handleEditClick = () => {
    onEdit(rowTool, colTool, compatibilityData);
  };

  // Self-compatibility (diagonal)
  if (rowTool.id === colTool.id) {
    return (
      <div className="w-28 p-2 border-r border-github-border" data-testid={`cell-${rowTool.id}-${colTool.id}`}>
        <div className="flex flex-col items-center space-y-1">
          <div className="w-6 h-6 bg-github-border rounded matrix-cell flex items-center justify-center">
            <span className="text-xs text-github-text-secondary">—</span>
          </div>
        </div>
      </div>
    );
  }

  // Has compatibility data
  if (compatibility) {
    return (
      <div className="w-28 p-2 border-r border-github-border" data-testid={`cell-${rowTool.id}-${colTool.id}`}>
        <div className="flex flex-col items-center space-y-1">
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
                <div className="text-xs text-github-text-secondary mb-1">
                  Difficulty: {compatibility.integrationDifficulty || 'medium'}
                </div>
                {compatibility.notes && (
                  <div className="text-xs text-github-text-secondary mb-1">
                    {compatibility.notes}
                  </div>
                )}
                {compatibility.verifiedIntegration === 1 && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Verified Integration
                  </Badge>
                )}
                <div className="mt-2 text-xs text-github-text-secondary">
                  Click edit button to modify
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
          <Button
            size="sm"
            variant="ghost"
            className="h-4 w-4 p-0 hover:bg-github-border"
            onClick={handleEditClick}
            data-testid={`edit-${rowTool.id}-${colTool.id}`}
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  // No compatibility data
  return (
    <div className="w-28 p-2 border-r border-github-border" data-testid={`cell-${rowTool.id}-${colTool.id}`}>
      <div className="flex flex-col items-center space-y-1">
        <div className="w-6 h-6 bg-github-border/50 rounded matrix-cell flex items-center justify-center">
          <span className="text-xs text-github-text-secondary">?</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-4 w-4 p-0 hover:bg-github-border"
          onClick={handleEditClick}
          data-testid={`add-${rowTool.id}-${colTool.id}`}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}