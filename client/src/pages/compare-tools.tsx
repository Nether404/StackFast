import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Plus, CheckCircle2, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ToolWithCategory, Compatibility } from "@shared/schema";

interface CompareToolsPageProps {
  searchQuery: string;
}

export default function CompareToolsPage({ searchQuery }: CompareToolsPageProps) {
  const [selectedTools, setSelectedTools] = useState<ToolWithCategory[]>([]);
  const [compatibilityScores, setCompatibilityScores] = useState<Map<string, number>>(new Map());

  const { data: tools = [], isLoading } = useQuery<ToolWithCategory[]>({
    queryKey: ["/api/tools"],
  });

  // Fetch compatibility scores when tools are selected
  const fetchCompatibilityScores = useMutation({
    mutationFn: async (toolIds: string[]) => {
      const response = await apiRequest("POST", "/api/stack/bulk-compatibility", { toolIds });
      return response.json();
    },
    onSuccess: (data) => {
      const scores = new Map<string, number>();
      data.forEach((item: any) => {
        const key = `${item.toolOneId}-${item.toolTwoId}`;
        scores.set(key, item.score);
      });
      setCompatibilityScores(scores);
    }
  });

  // Update compatibility scores when tools change
  useEffect(() => {
    if (selectedTools.length >= 2) {
      const toolIds = selectedTools.map(t => t.id);
      fetchCompatibilityScores.mutate(toolIds);
    }
  }, [selectedTools]);

  const filteredTools = tools.filter((tool) => {
    if (searchQuery && !tool.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !tool.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const availableTools = filteredTools.filter(
    tool => !selectedTools.find(selected => selected.id === tool.id)
  );

  const addTool = (toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    if (tool && selectedTools.length < 4) {
      setSelectedTools(prev => [...prev, tool]);
    }
  };

  const removeTool = (toolId: string) => {
    setSelectedTools(prev => prev.filter(tool => tool.id !== toolId));
  };

  const getCompatibilityScore = (tool1Id: string, tool2Id: string): number | null => {
    const key1 = `${tool1Id}-${tool2Id}`;
    const key2 = `${tool2Id}-${tool1Id}`;
    return compatibilityScores.get(key1) ?? compatibilityScores.get(key2) ?? null;
  };

  const getCompatibilityColor = (score: number): string => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getCompatibilityIcon = (score: number) => {
    if (score >= 80) return <CheckCircle2 className="h-4 w-4 text-green-400" />;
    if (score >= 60) return <AlertCircle className="h-4 w-4 text-yellow-400" />;
    return <XCircle className="h-4 w-4 text-red-400" />;
  };

  const getComparisonMetrics = () => {
    if (selectedTools.length === 0) return [];

    return [
      {
        name: "Maturity Score",
        key: "maturityScore",
        format: (value: number) => `${value.toFixed(1)}/10`,
      },
      {
        name: "Popularity Score", 
        key: "popularityScore",
        format: (value: number) => `${value.toFixed(1)}/10`,
      },
      {
        name: "Frameworks Count",
        key: "frameworks",
        format: (value: string[]) => value.length.toString(),
      },
      {
        name: "Languages Count",
        key: "languages", 
        format: (value: string[]) => value.length.toString(),
      },
      {
        name: "Integrations Count",
        key: "integrations",
        format: (value: string[]) => value.length.toString(),
      },
    ];
  };

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

  if (isLoading) {
    return (
      <Card className="bg-github-surface border-github-border">
        <CardHeader>
          <CardTitle className="text-github-text">Loading Comparison Tools...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="loading-shimmer h-64 rounded bg-github-border" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-github-surface border-github-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-github-text" data-testid="compare-title">
            Compare Tools
          </CardTitle>
          <p className="text-sm text-github-text-secondary mt-1">
            Select up to 4 tools to compare their features, compatibility, and characteristics
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <Select onValueChange={addTool} disabled={selectedTools.length >= 4}>
              <SelectTrigger className="w-64 bg-github-dark border-github-border text-github-text" data-testid="select-add-tool">
                <SelectValue placeholder="Add tool to compare" />
              </SelectTrigger>
              <SelectContent className="bg-github-dark border-github-border">
                {availableTools.map((tool) => (
                  <SelectItem key={tool.id} value={tool.id}>
                    <div className="flex items-center space-x-2">
                      <span>{getCategoryIcon((tool as any).categories?.[0]?.name || tool.category?.name || '')}</span>
                      <span>{tool.name}</span>
                      {(tool as any).categories && (tool as any).categories.length > 0 ? (
                        (tool as any).categories.slice(0, 2).map((cat: any, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {cat.name}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {tool.category?.name || 'Uncategorized'}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedTools.length >= 4 && (
              <span className="text-sm text-github-text-secondary">
                Maximum 4 tools can be compared
              </span>
            )}
          </div>

          {selectedTools.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-github-text-secondary mb-4">
                Select tools from the dropdown above to start comparing
              </div>
              <div className="text-sm text-github-text-secondary">
                You can compare up to 4 tools side by side
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected Tools Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedTools.map((tool) => (
                  <Card key={tool.id} className="bg-github-dark border-github-border relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTool(tool.id)}
                      className="absolute top-2 right-2 h-8 w-8 p-0 text-github-text-secondary hover:text-github-text"
                      data-testid={`button-remove-tool-${tool.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="text-lg">{getCategoryIcon(tool.category.name)}</div>
                        <div>
                          <h3 className="font-medium text-github-text" data-testid={`compare-tool-name-${tool.id}`}>
                            {tool.name}
                          </h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(tool as any).categories && (tool as any).categories.length > 0 ? (
                              (tool as any).categories.slice(0, 2).map((cat: any, index: number) => (
                                <p key={index} className={`text-xs ${getCategoryColor(cat.name)}`}>
                                  {cat.name}
                                </p>
                              ))
                            ) : (
                              <p className={`text-xs ${getCategoryColor(tool.category?.name || '')}`}>
                                {tool.category?.name || 'Uncategorized'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-github-text-secondary line-clamp-2" data-testid={`compare-tool-description-${tool.id}`}>
                        {tool.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Add more tools placeholder */}
                {selectedTools.length < 4 && (
                  <Card className="bg-github-dark border-github-border border-dashed">
                    <CardContent className="p-4 flex items-center justify-center h-full">
                      <div className="text-center">
                        <Plus className="h-8 w-8 text-github-text-secondary mx-auto mb-2" />
                        <p className="text-sm text-github-text-secondary">Add another tool</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Detailed Comparison Table */}
              <Card className="bg-github-dark border-github-border">
                <CardHeader>
                  <CardTitle className="text-md font-semibold text-github-text">
                    Detailed Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full" data-testid="comparison-table">
                      <thead>
                        <tr className="border-b border-github-border">
                          <th className="text-left py-3 px-4 text-github-text-secondary">Metric</th>
                          {selectedTools.map((tool) => (
                            <th key={tool.id} className="text-left py-3 px-4 text-github-text min-w-48">
                              {tool.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {getComparisonMetrics().map((metric) => (
                          <tr key={metric.name} className="border-b border-github-border/50">
                            <td className="py-3 px-4 text-github-text-secondary font-medium">
                              {metric.name}
                            </td>
                            {selectedTools.map((tool) => {
                              const value = tool[metric.key as keyof ToolWithCategory] as any;
                              return (
                                <td key={tool.id} className="py-3 px-4 text-github-text" data-testid={`metric-${metric.key}-${tool.id}`}>
                                  <div className="flex items-center space-x-2">
                                    <span>{metric.format(value)}</span>
                                    {(metric.key === "maturityScore" || metric.key === "popularityScore") && (
                                      <Progress value={value * 10} className="w-16 h-2" />
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        
                        {/* Pricing Comparison */}
                        <tr className="border-b border-github-border/50">
                          <td className="py-3 px-4 text-github-text-secondary font-medium">Pricing</td>
                          {selectedTools.map((tool) => (
                            <td key={tool.id} className="py-3 px-4 text-github-text" data-testid={`pricing-${tool.id}`}>
                              {tool.pricing || "Not specified"}
                            </td>
                          ))}
                        </tr>

                        {/* Frameworks */}
                        <tr className="border-b border-github-border/50">
                          <td className="py-3 px-4 text-github-text-secondary font-medium">Frameworks</td>
                          {selectedTools.map((tool) => (
                            <td key={tool.id} className="py-3 px-4" data-testid={`frameworks-${tool.id}`}>
                              <div className="flex flex-wrap gap-1">
                                {tool.frameworks.slice(0, 3).map((framework, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {framework}
                                  </Badge>
                                ))}
                                {tool.frameworks.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{tool.frameworks.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </td>
                          ))}
                        </tr>

                        {/* Top Integrations */}
                        <tr>
                          <td className="py-3 px-4 text-github-text-secondary font-medium">Top Integrations</td>
                          {selectedTools.map((tool) => (
                            <td key={tool.id} className="py-3 px-4" data-testid={`integrations-${tool.id}`}>
                              <div className="flex flex-wrap gap-1">
                                {tool.integrations.slice(0, 3).map((integration, index) => (
                                  <Badge key={index} variant="outline" className="text-xs border-github-border">
                                    {integration}
                                  </Badge>
                                ))}
                                {tool.integrations.length > 3 && (
                                  <Badge variant="outline" className="text-xs border-github-border">
                                    +{tool.integrations.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Compatibility Matrix */}
              {selectedTools.length >= 2 && (
                <Card className="bg-github-dark border-github-border">
                  <CardHeader>
                    <CardTitle className="text-md font-semibold text-github-text">
                      Compatibility Analysis
                    </CardTitle>
                    <p className="text-sm text-github-text-secondary">
                      How well these tools work together
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedTools.map((tool1, idx1) => (
                        selectedTools.slice(idx1 + 1).map((tool2) => {
                          const score = getCompatibilityScore(tool1.id, tool2.id);
                          if (score === null) return null;
                          
                          return (
                            <div key={`${tool1.id}-${tool2.id}`} className="flex items-center justify-between p-4 rounded-lg bg-github-surface border border-github-border">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="text-github-text font-medium">{tool1.name}</div>
                                  <ArrowRight className="h-4 w-4 text-github-text-secondary" />
                                  <div className="text-github-text font-medium">{tool2.name}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {getCompatibilityIcon(score)}
                                <Badge 
                                  className={`${score >= 80 ? 'bg-green-900/30 text-green-400 border-green-800' : 
                                            score >= 60 ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800' :
                                            score >= 40 ? 'bg-orange-900/30 text-orange-400 border-orange-800' :
                                            'bg-red-900/30 text-red-400 border-red-800'}`}
                                >
                                  {score}% compatible
                                </Badge>
                              </div>
                            </div>
                          );
                        })
                      ))}
                      
                      {fetchCompatibilityScores.isPending && (
                        <div className="text-center py-4 text-github-text-secondary">
                          Loading compatibility scores...
                        </div>
                      )}
                    </div>

                    {/* Compatibility Summary */}
                    {selectedTools.length >= 2 && !fetchCompatibilityScores.isPending && (
                      <div className="mt-6 p-4 rounded-lg bg-github-surface border border-github-border">
                        <h4 className="text-sm font-medium text-github-text mb-3">Stack Compatibility Summary</h4>
                        <div className="space-y-2">
                          {(() => {
                            const scores: number[] = [];
                            selectedTools.forEach((tool1, idx1) => {
                              selectedTools.slice(idx1 + 1).forEach((tool2) => {
                                const score = getCompatibilityScore(tool1.id, tool2.id);
                                if (score !== null) scores.push(score);
                              });
                            });
                            const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
                            const minScore = scores.length > 0 ? Math.min(...scores) : 0;
                            const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
                            
                            return (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span className="text-github-text-secondary">Average Compatibility:</span>
                                  <span className={`font-medium ${getCompatibilityColor(avgScore)}`}>
                                    {avgScore}%
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-github-text-secondary">Highest Compatibility:</span>
                                  <span className={`font-medium ${getCompatibilityColor(maxScore)}`}>
                                    {maxScore}%
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-github-text-secondary">Lowest Compatibility:</span>
                                  <span className={`font-medium ${getCompatibilityColor(minScore)}`}>
                                    {minScore}%
                                  </span>
                                </div>
                                <Separator className="my-2" />
                                <Alert className={avgScore >= 70 ? "border-green-800" : avgScore >= 50 ? "border-yellow-800" : "border-red-800"}>
                                  <AlertDescription className="text-sm">
                                    {avgScore >= 70 ? (
                                      <>
                                        <CheckCircle2 className="inline h-4 w-4 text-green-400 mr-2" />
                                        <span className="text-github-text">This combination of tools works well together!</span>
                                      </>
                                    ) : avgScore >= 50 ? (
                                      <>
                                        <AlertCircle className="inline h-4 w-4 text-yellow-400 mr-2" />
                                        <span className="text-github-text">This stack has moderate compatibility. Some integration work may be needed.</span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="inline h-4 w-4 text-red-400 mr-2" />
                                        <span className="text-github-text">These tools may have compatibility challenges. Consider alternatives.</span>
                                      </>
                                    )}
                                  </AlertDescription>
                                </Alert>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
