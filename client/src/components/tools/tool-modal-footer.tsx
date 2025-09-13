/**
 * Tool modal footer component
 */

import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen, Edit, UserPlus } from "lucide-react";
import type { ToolWithCategory } from "@shared/schema";

interface ToolModalFooterProps {
  tool: ToolWithCategory;
  onEdit: (tool: ToolWithCategory) => void;
}

export function ToolModalFooter({ tool, onEdit }: ToolModalFooterProps) {
  return (
    <div className="flex items-center justify-between p-6 border-t border-github-border bg-github-dark/50">
      <div className="flex items-center space-x-4">
        {tool.url && (
          <Button
            variant="link"
            onClick={() => tool.url && window.open(tool.url, '_blank')}
            className="text-neon-orange hover:text-neon-orange-light text-sm p-0 h-auto"
            data-testid="button-visit-website"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Visit Website
          </Button>
        )}
        <Button
          variant="link"
          className="text-github-text-secondary hover:text-github-text text-sm p-0 h-auto"
          data-testid="button-documentation"
        >
          <BookOpen className="w-4 h-4 mr-1" />
          Documentation
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="secondary"
          onClick={() => onEdit(tool)}
          className="bg-github-border hover:bg-github-text-secondary text-github-text"
          data-testid="button-edit-tool-modal"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Tool
        </Button>
        <Button
          className="bg-neon-orange hover:bg-neon-orange-light text-white"
          data-testid="button-add-to-stack"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add to Stack
        </Button>
      </div>
    </div>
  );
}