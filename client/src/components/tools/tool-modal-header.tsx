/**
 * Tool modal header component
 */

import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import type { ToolWithCategory } from "@shared/schema";
import { getCategoryIcon } from "@/lib/tool-utils";

interface ToolModalHeaderProps {
  tool: ToolWithCategory;
  onClose: () => void;
}

export function ToolModalHeader({ tool, onClose }: ToolModalHeaderProps) {
  return (
    <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-github-border">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-github-border rounded-lg flex items-center justify-center text-xl">
          {getCategoryIcon(tool.category.name)}
        </div>
        <div>
          <DialogTitle className="text-xl font-bold text-github-text" data-testid="modal-tool-name">
            {tool.name}
          </DialogTitle>
          <p className="text-sm text-github-text-secondary" data-testid="modal-tool-category">
            {tool.category.name}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="text-github-text-secondary hover:text-github-text"
        data-testid="button-close-modal"
      >
        <X className="w-6 h-6" />
      </Button>
    </DialogHeader>
  );
}