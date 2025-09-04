import { X, ExternalLink, BookOpen, Edit, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ToolWithCategory } from "@shared/schema";

interface ToolModalProps {
  tool: ToolWithCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (tool: ToolWithCategory) => void;
}

export function ToolModal({ tool, isOpen, onClose, onEdit }: ToolModalProps) {
  if (!tool) return null;

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-github-surface border-github-border max-w-4xl max-h-[90vh] overflow-hidden">
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
        
        <div className="overflow-y-auto max-h-[60vh] p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tool Information */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-github-text mb-3">Tool Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-github-text-secondary">Maturity Score:</span>
                    <span className="text-github-text font-medium" data-testid="modal-maturity-score">
                      {tool.maturityScore.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-github-text-secondary">Popularity Score:</span>
                    <span className="text-github-text font-medium" data-testid="modal-popularity-score">
                      {tool.popularityScore.toFixed(1)}/10
                    </span>
                  </div>
                  {tool.pricing && (
                    <div className="flex justify-between">
                      <span className="text-github-text-secondary">Pricing:</span>
                      <span className="text-github-text font-medium" data-testid="modal-pricing">
                        {tool.pricing}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-github-text-secondary">Languages:</span>
                    <span className="text-github-text font-medium" data-testid="modal-languages">
                      {tool.languages.join(", ") || "Not specified"}
                    </span>
                  </div>
                </div>
              </div>
              
              {tool.features.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-github-text mb-2">Key Features</h4>
                  <ul className="text-sm text-github-text-secondary space-y-1">
                    {tool.features.map((feature, index) => (
                      <li key={index} data-testid={`modal-feature-${index}`}>
                        • {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tool.description && (
                <div>
                  <h4 className="text-md font-semibold text-github-text mb-2">Description</h4>
                  <p className="text-sm text-github-text-secondary" data-testid="modal-description">
                    {tool.description}
                  </p>
                </div>
              )}
            </div>
            
            {/* Technical Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-github-text mb-3">Technical Details</h3>
                
                {tool.frameworks.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-md font-semibold text-github-text mb-2">Frameworks</h4>
                    <div className="flex flex-wrap gap-2">
                      {tool.frameworks.map((framework, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="bg-github-dark text-github-text-secondary"
                          data-testid={`modal-framework-${index}`}
                        >
                          {framework}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {tool.integrations.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-github-text mb-2">Notable Integrations</h4>
                    <div className="flex flex-wrap gap-2">
                      {tool.integrations.map((integration, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="border-github-border text-github-text-secondary"
                          data-testid={`modal-integration-${index}`}
                        >
                          {integration}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {tool.notes && (
                <div>
                  <h4 className="text-md font-semibold text-github-text mb-2">Additional Notes</h4>
                  <p className="text-sm text-github-text-secondary" data-testid="modal-notes">
                    {tool.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-6 border-t border-github-border bg-github-dark/50">
          <div className="flex items-center space-x-4">
            {tool.url && (
              <Button
                variant="link"
                onClick={() => window.open(tool.url, '_blank')}
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
      </DialogContent>
    </Dialog>
  );
}
