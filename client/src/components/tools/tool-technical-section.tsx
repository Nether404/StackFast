/**
 * Tool technical details section component
 */

import { Badge } from "@/components/ui/badge";
import type { ToolWithCategory } from "@shared/schema";

interface ToolTechnicalSectionProps {
  tool: ToolWithCategory;
}

export function ToolTechnicalSection({ tool }: ToolTechnicalSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-github-text mb-3">Technical Details</h3>
        
        {tool.frameworks && tool.frameworks.length > 0 && (
          <div className="mb-4">
            <h4 className="text-md font-semibold text-github-text mb-2">Frameworks</h4>
            <div className="flex flex-wrap gap-2">
              {tool.frameworks?.map((framework, index) => (
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

        {tool.integrations && tool.integrations.length > 0 && (
          <div>
            <h4 className="text-md font-semibold text-github-text mb-2">Notable Integrations</h4>
            <div className="flex flex-wrap gap-2">
              {tool.integrations?.map((integration, index) => (
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
  );
}