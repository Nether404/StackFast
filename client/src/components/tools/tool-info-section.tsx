/**
 * Tool information section component
 */

import { Badge } from "@/components/ui/badge";
import type { ToolWithCategory } from "@shared/schema";

interface ToolInfoSectionProps {
  tool: ToolWithCategory;
}

export function ToolInfoSection({ tool }: ToolInfoSectionProps) {
  return (
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
              {tool.languages?.join(", ") || "Not specified"}
            </span>
          </div>
        </div>
      </div>
      
      {tool.features && tool.features.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-github-text mb-2">Key Features</h4>
          <ul className="text-sm text-github-text-secondary space-y-1">
            {tool.features?.map((feature, index) => (
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
  );
}