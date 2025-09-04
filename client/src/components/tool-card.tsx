import { ExternalLink, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ToolWithCategory } from "@shared/schema";

interface ToolCardProps {
  tool: ToolWithCategory & { categories?: any[] };
  onEdit: (tool: ToolWithCategory) => void;
  onViewDetails: (tool: ToolWithCategory) => void;
}

export function ToolCard({ tool, onEdit, onViewDetails }: ToolCardProps) {
  const getCategoryColor = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case "ai coding tools":
        return "text-neon-orange";
      case "frontend/design":
        return "text-info";
      case "backend/database":
        return "text-success";
      case "payment platforms":
        return "text-warning";
      default:
        return "text-github-text-secondary";
    }
  };

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
    <Card 
      className="tool-card bg-github-surface hover:bg-github-dark/50 transition-all duration-200 cursor-pointer group"
      onClick={() => onViewDetails(tool)}
      data-testid={`card-tool-${tool.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-github-border rounded-lg flex items-center justify-center text-lg">
              {getCategoryIcon(tool.categories?.[0]?.name || tool.category?.name || '')}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-github-text group-hover:text-neon-orange transition-colors" data-testid={`text-tool-name-${tool.id}`}>
                {tool.name}
              </h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {tool.categories && tool.categories.length > 0 ? (
                  tool.categories.map((cat: any, index: number) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs"
                      style={{ 
                        borderColor: getCategoryColor(cat.name),
                        color: getCategoryColor(cat.name)
                      }}
                    >
                      {cat.name}
                    </Badge>
                  ))
                ) : (
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ 
                      borderColor: getCategoryColor(tool.category?.name || ''),
                      color: getCategoryColor(tool.category?.name || '')
                    }}
                  >
                    {tool.category?.name || 'Uncategorized'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(tool);
              }}
              data-testid={`button-edit-tool-${tool.id}`}
            >
              <Edit className="w-4 h-4" />
            </Button>
            {tool.url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(tool.url, '_blank');
                }}
                data-testid={`button-external-link-${tool.id}`}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        <p className="text-sm text-github-text-secondary mb-4 line-clamp-2" data-testid={`text-description-${tool.id}`}>
          {tool.description}
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-github-text-secondary">Maturity Score</span>
            <div className="flex items-center space-x-2">
              <Progress value={tool.maturityScore * 10} className="w-16 h-2" />
              <span className="text-sm text-github-text font-medium" data-testid={`text-maturity-${tool.id}`}>
                {tool.maturityScore.toFixed(1)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-github-text-secondary">Popularity Score</span>
            <div className="flex items-center space-x-2">
              <Progress value={tool.popularityScore * 10} className="w-16 h-2" />
              <span className="text-sm text-github-text font-medium" data-testid={`text-popularity-${tool.id}`}>
                {tool.popularityScore.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex flex-wrap gap-1">
            {tool.frameworks.slice(0, 3).map((framework, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs bg-github-dark text-github-text-secondary"
                data-testid={`badge-framework-${tool.id}-${index}`}
              >
                {framework}
              </Badge>
            ))}
            {tool.frameworks.length > 3 && (
              <Badge 
                variant="secondary" 
                className="text-xs bg-github-dark text-github-text-secondary"
                data-testid={`badge-more-frameworks-${tool.id}`}
              >
                +{tool.frameworks.length - 3} more
              </Badge>
            )}
          </div>
        </div>
        
        {tool.pricing && (
          <div className="mt-4 pt-4 border-t border-github-border">
            <span className="text-xs text-github-text-secondary">Pricing: </span>
            <span className="text-xs text-github-text" data-testid={`text-pricing-${tool.id}`}>
              {tool.pricing}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
