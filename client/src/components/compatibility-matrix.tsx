import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EditCompatibilityDialog } from "@/components/edit-compatibility-dialog";
import { useQuery } from "@tanstack/react-query";
import type { ToolWithCategory, CompatibilityMatrix, Compatibility } from "@shared/schema";
import { MatrixHeader } from "@/components/compatibility/matrix-header";
import { MatrixColumnHeaders } from "@/components/compatibility/matrix-column-headers";
import { MatrixRow } from "@/components/compatibility/matrix-row";
import { MatrixLoading } from "@/components/compatibility/matrix-loading";
import { VirtualizedCompatibilityMatrix } from "@/components/compatibility/virtualized-matrix";
import { filterTools } from "@/lib/tool-utils";

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

  const handleEditCompatibility = (toolOne: ToolWithCategory, toolTwo: ToolWithCategory, compatibilityData: CompatibilityMatrix | null) => {
    setSelectedCompatibility({
      compatibility: compatibilityData?.compatibility || null,
      toolOne,
      toolTwo,
    });
    setEditDialogOpen(true);
  };

  const filteredTools = filterTools(tools, searchQuery, filters);

  if (toolsLoading || matrixLoading) {
    return <MatrixLoading />;
  }

  // Use virtualized matrix for large datasets (>20 tools), regular matrix for smaller ones
  const shouldUseVirtualization = filteredTools.length > 20;

  if (shouldUseVirtualization) {
    return (
      <VirtualizedCompatibilityMatrix
        searchQuery={searchQuery}
        filters={filters}
        onToolClick={onToolClick}
      />
    );
  }

  return (
    <TooltipProvider>
      <Card className="bg-github-surface rounded-lg border-github-border overflow-hidden">
        <MatrixHeader />

        {/* Matrix Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-max">
            <MatrixColumnHeaders tools={filteredTools} />

            {/* Matrix Rows */}
            {filteredTools.map((rowTool) => (
              <MatrixRow
                key={rowTool.id}
                rowTool={rowTool}
                tools={filteredTools}
                compatibilityMatrix={compatibilityMatrix}
                onToolClick={onToolClick}
                onEditCompatibility={handleEditCompatibility}
              />
            ))}
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
