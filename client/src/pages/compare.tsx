import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  GitCompare, 
  Plus, 
  X, 
  Check, 
  AlertCircle,
  Sparkles,
  Code,
  DollarSign,
  Users,
  Shield,
  Zap
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface ComparisonData {
  tools: any[];
  harmonyScore: number;
  validation: {
    valid: boolean;
    conflicts: string[];
    warnings: string[];
  };
  compatibilityMatrix: any[];
  summary: {
    isValid: boolean;
    totalTools: number;
    conflictCount: number;
    warningCount: number;
    avgCompatibility: number;
  };
}

export default function ComparePage() {
  const [location] = useLocation();
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);

  // Get tool IDs from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const toolsParam = params.get('tools');
    if (toolsParam) {
      setSelectedToolIds(toolsParam.split(','));
    }
  }, [location]);

  // Fetch all available tools
  const { data: allTools = [] } = useQuery({
    queryKey: ["/api/tools/quality"],
  });

  // Fetch comparison data when tools are selected
  const { data: comparison, isLoading: isComparing } = useQuery({
    queryKey: ["/api/v1/stack/analyze", selectedToolIds],
    enabled: selectedToolIds.length >= 2,
    queryFn: async () => {
      const response = await fetch(`/api/v1/stack/analyze?tools=${selectedToolIds.join(',')}`);
      if (!response.ok) throw new Error('Failed to analyze stack');
      return response.json();
    },
  });

  const handleAddTool = (toolId: string) => {
    if (!selectedToolIds.includes(toolId) && selectedToolIds.length < 5) {
      setSelectedToolIds([...selectedToolIds, toolId]);
    }
  };

  const handleRemoveTool = (toolId: string) => {
    setSelectedToolIds(selectedToolIds.filter(id => id !== toolId));
  };

  const selectedTools = selectedToolIds
    .map(id => allTools.find((t: any) => t.id === id))
    .filter(Boolean);

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getCompatibilityLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitCompare className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Tool Comparison</CardTitle>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {selectedToolIds.length}/5 Tools
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Tool Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Tools to Compare</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {selectedTools.map((tool: any) => (
              <Badge key={tool.id} variant="secondary" className="px-3 py-2">
                <span className="mr-2">{tool.name}</span>
                <button
                  onClick={() => handleRemoveTool(tool.id)}
                  className="hover:text-destructive"
                  data-testid={`remove-tool-${tool.id}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selectedToolIds.length < 5 && (
              <Select onValueChange={handleAddTool}>
                <SelectTrigger className="w-[200px]" data-testid="add-tool-select">
                  <SelectValue placeholder="Add a tool..." />
                </SelectTrigger>
                <SelectContent>
                  {allTools
                    .filter((tool: any) => !selectedToolIds.includes(tool.id))
                    .map((tool: any) => (
                      <SelectItem key={tool.id} value={tool.id}>
                        {tool.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedToolIds.length < 2 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Select at least 2 tools to start comparing
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparison && selectedToolIds.length >= 2 && (
        <>
          {/* Harmony Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Stack Harmony Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {comparison.harmonyScore}%
                  </span>
                  <Badge className={getCompatibilityColor(comparison.harmonyScore)}>
                    {getCompatibilityLabel(comparison.harmonyScore)}
                  </Badge>
                </div>
                <Progress value={comparison.harmonyScore} className="h-3" />
                
                {comparison.validation.conflicts.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Conflicts:</strong>
                      <ul className="list-disc list-inside mt-2">
                        {comparison.validation.conflicts.map((conflict: string, i: number) => (
                          <li key={i}>{conflict}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                
                {comparison.validation.warnings.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warnings:</strong>
                      <ul className="list-disc list-inside mt-2">
                        {comparison.validation.warnings.map((warning: string, i: number) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Feature Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Feature</th>
                      {selectedTools.map((tool: any) => (
                        <th key={tool.id} className="text-center p-3 min-w-[120px]">
                          {tool.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Category */}
                    <tr className="border-b">
                      <td className="p-3 font-medium">Category</td>
                      {selectedTools.map((tool: any) => (
                        <td key={tool.id} className="text-center p-3">
                          <Badge variant="outline">{tool.category}</Badge>
                        </td>
                      ))}
                    </tr>
                    
                    {/* Popularity */}
                    <tr className="border-b">
                      <td className="p-3 font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Popularity
                      </td>
                      {selectedTools.map((tool: any) => (
                        <td key={tool.id} className="text-center p-3">
                          <div className="flex flex-col items-center">
                            <span className="font-semibold">{tool.popularityScore}%</span>
                            <Progress value={tool.popularityScore} className="w-full h-1 mt-1" />
                          </div>
                        </td>
                      ))}
                    </tr>
                    
                    {/* Maturity */}
                    <tr className="border-b">
                      <td className="p-3 font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Maturity
                      </td>
                      {selectedTools.map((tool: any) => (
                        <td key={tool.id} className="text-center p-3">
                          <div className="flex flex-col items-center">
                            <span className="font-semibold">{tool.maturityScore}%</span>
                            <Progress value={tool.maturityScore} className="w-full h-1 mt-1" />
                          </div>
                        </td>
                      ))}
                    </tr>
                    
                    {/* Pricing */}
                    <tr className="border-b">
                      <td className="p-3 font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Pricing
                      </td>
                      {selectedTools.map((tool: any) => (
                        <td key={tool.id} className="text-center p-3">
                          <Badge variant={tool.pricing?.includes('Free') ? "success" : "secondary"}>
                            {tool.pricing || 'Unknown'}
                          </Badge>
                        </td>
                      ))}
                    </tr>
                    
                    {/* Features */}
                    <tr className="border-b">
                      <td className="p-3 font-medium flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Key Features
                      </td>
                      {selectedTools.map((tool: any) => (
                        <td key={tool.id} className="p-3">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {tool.features?.slice(0, 3).map((feature: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                    
                    {/* Languages */}
                    <tr className="border-b">
                      <td className="p-3 font-medium flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Languages
                      </td>
                      {selectedTools.map((tool: any) => (
                        <td key={tool.id} className="p-3">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {tool.languages?.map((lang: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {lang}
                              </Badge>
                            )) || <span className="text-muted-foreground">-</span>}
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
          <Card>
            <CardHeader>
              <CardTitle>Compatibility Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comparison.compatibilityMatrix?.map((item: any, i: number) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {item.tool1Name} ↔ {item.tool2Name}
                      </span>
                      <Badge className={getCompatibilityColor(item.score)}>
                        {item.score}%
                      </Badge>
                    </div>
                    <Progress value={item.score} className="h-2" />
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-2">{item.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {comparison.summary.isValid ? (
                  <Alert className="bg-green-50 border-green-200">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      This tool combination works well together with {comparison.summary.avgCompatibility}% average compatibility.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This stack has compatibility issues. Consider reviewing the conflicts above.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <div className="text-2xl font-bold">{comparison.summary.totalTools}</div>
                    <div className="text-sm text-muted-foreground">Tools</div>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <div className="text-2xl font-bold">{comparison.summary.conflictCount}</div>
                    <div className="text-sm text-muted-foreground">Conflicts</div>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <div className="text-2xl font-bold">{comparison.summary.warningCount}</div>
                    <div className="text-sm text-muted-foreground">Warnings</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}