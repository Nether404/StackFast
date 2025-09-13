import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { ToolWithCategory } from "@shared/schema";
import { ToolModalHeader } from "@/components/tools/tool-modal-header";
import { ToolInfoSection } from "@/components/tools/tool-info-section";
import { ToolTechnicalSection } from "@/components/tools/tool-technical-section";
import { ToolModalFooter } from "@/components/tools/tool-modal-footer";

interface ToolModalProps {
  tool: ToolWithCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (tool: ToolWithCategory) => void;
}

export function ToolModal({ tool, isOpen, onClose, onEdit }: ToolModalProps) {
  if (!tool) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-github-surface border-github-border max-w-4xl max-h-[90vh] overflow-hidden">
        <ToolModalHeader tool={tool} onClose={onClose} />
        
        <div className="overflow-y-auto max-h-[60vh] p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ToolInfoSection tool={tool} />
            <ToolTechnicalSection tool={tool} />
          </div>
        </div>
        
        <ToolModalFooter tool={tool} onEdit={onEdit} />
      </DialogContent>
    </Dialog>
  );
}
