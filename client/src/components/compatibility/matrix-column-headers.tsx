/**
 * Column headers component for the compatibility matrix
 */

import type { ToolWithCategory } from "@shared/schema";
import { getCategoryColor, truncateText } from "@/lib/tool-utils";

interface MatrixColumnHeadersProps {
  tools: ToolWithCategory[];
}

export function MatrixColumnHeaders({ tools }: MatrixColumnHeadersProps) {
  return (
    <div className="flex bg-github-dark border-b border-github-border">
      <div className="w-48 p-3 border-r border-github-border">
        <span className="text-sm font-medium text-github-text-secondary">Tool Name</span>
      </div>
      {tools.map((tool) => (
        <div key={tool.id} className="w-28 p-3 border-r border-github-border text-center">
          <div className="transform -rotate-45 origin-center whitespace-nowrap">
            <span
              className={`text-xs font-medium ${getCategoryColor(tool.category.name)}`}
              data-testid={`header-${tool.id}`}
            >
              {truncateText(tool.name, 10)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}