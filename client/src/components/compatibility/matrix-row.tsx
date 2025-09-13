/**
 * Row component for the compatibility matrix
 */

import type { ToolWithCategory, CompatibilityMatrix } from "@shared/schema";
import { MatrixCell } from "./matrix-cell";
import { getCategoryIcon, getCompatibilityScore } from "@/lib/tool-utils";

interface MatrixRowProps {
  rowTool: ToolWithCategory;
  tools: ToolWithCategory[];
  compatibilityMatrix: CompatibilityMatrix[];
  onToolClick: (tool: ToolWithCategory) => void;
  onEditCompatibility: (toolOne: ToolWithCategory, toolTwo: ToolWithCategory, compatibilityData: CompatibilityMatrix | null) => void;
}

export function MatrixRow({ 
  rowTool, 
  tools, 
  compatibilityMatrix, 
  onToolClick, 
  onEditCompatibility 
}: MatrixRowProps) {
  return (
    <div
      className="flex border-b border-github-border hover:bg-github-dark/50 transition-colors"
      data-testid={`row-${rowTool.id}`}
    >
      {/* Row Header */}
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

      {/* Matrix Cells */}
      {tools.map((colTool) => {
        const compatibilityData = getCompatibilityScore(rowTool, colTool, compatibilityMatrix);
        
        return (
          <MatrixCell
            key={colTool.id}
            rowTool={rowTool}
            colTool={colTool}
            compatibilityData={compatibilityData}
            onEdit={onEditCompatibility}
          />
        );
      })}
    </div>
  );
}