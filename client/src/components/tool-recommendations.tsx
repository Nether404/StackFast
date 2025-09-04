import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Zap, Shield, DollarSign } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Tool, ToolWithCategory } from "@shared/schema";

interface ToolRecommendationsProps {
  selectedToolIds: string[];
  onToolSelect?: (tool: Tool) => void;
  maxRecommendations?: number;
}

export function ToolRecommendations({ 
  selectedToolIds, 
  onToolSelect,
  maxRecommendations = 5 
}: ToolRecommendationsProps) {
  const [category, setCategory] = useState<string | undefined>();

  // Fetch recommendations
  const { data: recommendations = [], isLoading, refetch } = useQuery<Tool[]>({
    queryKey: ["/api/stack/recommendations", selectedToolIds, category],
    queryFn: async () => {
      if (selectedToolIds.length === 0) return [];
      const response = await apiRequest("POST", "/api/stack/recommendations", {
        toolIds: selectedToolIds,
        category
      });
      return response.json();
    },
    enabled: selectedToolIds.length > 0
  });

  // Fetch all tools to get category info
  const { data: allTools = [] } = useQuery<ToolWithCategory[]>({
    queryKey: ["/api/tools"]
  });

  const getToolWithCategory = (tool: Tool): ToolWithCategory | undefined => {
    return allTools.find(t => t.id === tool.id);
  };

  const getRecommendationReason = (tool: Tool): string => {
    const toolWithCategory = getToolWithCategory(tool);
    if (!toolWithCategory) return "Compatible with your stack";

    // Generate reason based on tool characteristics
    if (toolWithCategory.popularityScore >= 8) {
      return "Popular choice in the community";
    }
    if (toolWithCategory.maturityScore >= 8) {
      return "Mature and stable solution";
    }
    if (toolWithCategory.integrations.length > 5) {
      return "Extensive integration options";
    }
    if (toolWithCategory.pricing?.toLowerCase().includes("free")) {
      return "Free tier available";
    }
    return "Works well with your selected tools";
  };

  const getRecommendationIcon = (tool: Tool) => {
    const toolWithCategory = getToolWithCategory(tool);
    if (!toolWithCategory) return <Zap className="h-4 w-4" />;

    if (toolWithCategory.popularityScore >= 8) {
      return <TrendingUp className="h-4 w-4 text-blue-400" />;
    }
    if (toolWithCategory.maturityScore >= 8) {
      return <Shield className="h-4 w-4 text-green-400" />;
    }
    if (toolWithCategory.pricing?.toLowerCase().includes("free")) {
      return <DollarSign className="h-4 w-4 text-yellow-400" />;
    }
    return <Zap className="h-4 w-4 text-neon-orange" />;
  };

  if (selectedToolIds.length === 0) {
    return (
      <Card className="bg-github-surface border-github-border">
        <CardContent className="p-6">
          <p className="text-sm text-github-text-secondary text-center">
            Select tools to see recommendations
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-github-surface border-github-border">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-neon-orange" />
          <span className="ml-2 text-github-text-secondary">Loading recommendations...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-github-surface border-github-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-github-text">
          Recommended Tools
        </CardTitle>
        <p className="text-sm text-github-text-secondary">
          Tools that work well with your current selection
        </p>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <p className="text-sm text-github-text-secondary text-center py-4">
            No recommendations available for this combination
          </p>
        ) : (
          <div className="space-y-3">
            {recommendations.slice(0, maxRecommendations).map((tool) => {
              const toolWithCategory = getToolWithCategory(tool);
              if (!toolWithCategory) return null;

              return (
                <div
                  key={tool.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-github-dark border border-github-border hover:border-neon-orange/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getRecommendationIcon(tool)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-github-text">
                          {tool.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {toolWithCategory.category.name}
                        </Badge>
                      </div>
                      <p className="text-xs text-github-text-secondary mt-1">
                        {getRecommendationReason(tool)}
                      </p>
                    </div>
                  </div>
                  {onToolSelect && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onToolSelect(tool)}
                      className="text-neon-orange hover:text-neon-orange hover:bg-neon-orange/10"
                    >
                      Add
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Category Filter */}
        {recommendations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-github-border">
            <p className="text-xs text-github-text-secondary mb-2">Filter by category:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={category === undefined ? "default" : "outline"}
                onClick={() => {
                  setCategory(undefined);
                  refetch();
                }}
                className="text-xs"
              >
                All
              </Button>
              {["AI Coding Tools", "Frontend/Design", "Backend/Database", "DevOps/Deployment"].map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={category === cat ? "default" : "outline"}
                  onClick={() => {
                    setCategory(cat);
                    refetch();
                  }}
                  className="text-xs"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}