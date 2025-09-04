import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, AlertCircle, CheckCircle, XCircle, GitBranch, Clock, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Tool, ToolWithCategory } from "@shared/schema";

interface MigrationPath {
  fromTool: string;
  toTool: string;
  difficulty: "easy" | "moderate" | "complex";
  estimatedTime: string;
  steps: string[];
  considerations: string[];
  benefits: string[];
  compatibility: number;
}

export function MigrationPaths() {
  const [fromTool, setFromTool] = useState<string>("");
  const [toTool, setToTool] = useState<string>("");
  const [showPath, setShowPath] = useState(false);

  // Fetch all tools
  const { data: tools = [] } = useQuery<ToolWithCategory[]>({
    queryKey: ["/api/tools"]
  });

  // Fetch migration path
  const { data: migrationPath, isLoading: pathLoading } = useQuery<MigrationPath | null>({
    queryKey: ["/api/migration-path", fromTool, toTool],
    queryFn: async () => {
      if (!fromTool || !toTool) return null;
      const response = await apiRequest("GET", `/api/migration-path?from=${fromTool}&to=${toTool}`);
      return response.json();
    },
    enabled: showPath && !!fromTool && !!toTool
  });

  const handleAnalyzeMigration = () => {
    if (fromTool && toTool) {
      setShowPath(true);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-green-400 bg-green-900/20 border-green-600/30";
      case "moderate":
        return "text-yellow-400 bg-yellow-900/20 border-yellow-600/30";
      case "complex":
        return "text-red-400 bg-red-900/20 border-red-600/30";
      default:
        return "text-github-text-secondary";
    }
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  // Group tools by category for better selection
  const toolsByCategory = tools.reduce((acc, tool) => {
    const category = tool.category.name;
    if (!acc[category]) acc[category] = [];
    acc[category].push(tool);
    return acc;
  }, {} as Record<string, ToolWithCategory[]>);

  return (
    <div className="space-y-6">
      {/* Migration Tool Selector */}
      <Card className="bg-github-surface border-github-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-neon-orange" />
            Migration Path Analyzer
          </CardTitle>
          <CardDescription>
            Find the best path to migrate from one tool to another
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* From Tool Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-github-text">
                Current Tool
              </label>
              <Select value={fromTool} onValueChange={setFromTool}>
                <SelectTrigger className="bg-github-dark border-github-border">
                  <SelectValue placeholder="Select current tool" />
                </SelectTrigger>
                <SelectContent className="bg-github-dark border-github-border">
                  {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
                    <div key={category}>
                      <div className="px-2 py-1 text-xs font-semibold text-github-text-secondary">
                        {category}
                      </div>
                      {categoryTools.map(tool => (
                        <SelectItem 
                          key={tool.id} 
                          value={tool.id}
                          className="text-github-text"
                        >
                          {tool.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* To Tool Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-github-text">
                Target Tool
              </label>
              <Select value={toTool} onValueChange={setToTool}>
                <SelectTrigger className="bg-github-dark border-github-border">
                  <SelectValue placeholder="Select target tool" />
                </SelectTrigger>
                <SelectContent className="bg-github-dark border-github-border">
                  {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
                    <div key={category}>
                      <div className="px-2 py-1 text-xs font-semibold text-github-text-secondary">
                        {category}
                      </div>
                      {categoryTools
                        .filter(tool => tool.id !== fromTool)
                        .map(tool => (
                          <SelectItem 
                            key={tool.id} 
                            value={tool.id}
                            className="text-github-text"
                          >
                            {tool.name}
                          </SelectItem>
                        ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleAnalyzeMigration}
            disabled={!fromTool || !toTool}
            className="w-full mt-4 bg-neon-orange hover:bg-neon-orange/90"
          >
            Analyze Migration Path
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Migration Path Results */}
      {showPath && migrationPath && (
        <Card className="bg-github-surface border-github-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Migration Path Analysis
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor(migrationPath.difficulty)}>
                  {migrationPath.difficulty}
                </Badge>
                <Badge className={`${getCompatibilityColor(migrationPath.compatibility)} bg-github-dark`}>
                  {migrationPath.compatibility}% Compatible
                </Badge>
              </div>
            </div>
            <CardDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {migrationPath.estimatedTime}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Migration Steps */}
            <div>
              <h4 className="text-sm font-semibold text-github-text mb-3">
                Migration Steps
              </h4>
              <div className="space-y-2">
                {migrationPath.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-neon-orange/20 text-neon-orange text-xs font-bold">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-github-text flex-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            {migrationPath.benefits.length > 0 && (
              <Alert className="border-green-600/30 bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-github-text">
                  <strong className="block mb-1">Benefits:</strong>
                  <ul className="list-disc list-inside space-y-1">
                    {migrationPath.benefits.map((benefit, idx) => (
                      <li key={idx} className="text-sm">{benefit}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Considerations */}
            {migrationPath.considerations.length > 0 && (
              <Alert className="border-yellow-600/30 bg-yellow-900/20">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-github-text">
                  <strong className="block mb-1">Considerations:</strong>
                  <ul className="list-disc list-inside space-y-1">
                    {migrationPath.considerations.map((consideration, idx) => (
                      <li key={idx} className="text-sm">{consideration}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Common Migration Patterns */}
      <Card className="bg-github-surface border-github-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            Common Migration Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { from: "Create React App", to: "Vite", difficulty: "easy", trend: "popular" },
              { from: "Express.js", to: "Fastify", difficulty: "moderate", trend: "growing" },
              { from: "MongoDB", to: "PostgreSQL", difficulty: "complex", trend: "stable" },
              { from: "Jenkins", to: "GitHub Actions", difficulty: "moderate", trend: "popular" },
              { from: "Webpack", to: "Vite", difficulty: "moderate", trend: "growing" },
              { from: "REST API", to: "GraphQL", difficulty: "complex", trend: "stable" }
            ].map((pattern, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-github-dark border border-github-border hover:border-neon-orange/50 transition-colors cursor-pointer"
                onClick={() => {
                  const fromId = tools.find(t => t.name === pattern.from)?.id;
                  const toId = tools.find(t => t.name === pattern.to)?.id;
                  if (fromId && toId) {
                    setFromTool(fromId);
                    setToTool(toId);
                    setShowPath(false);
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-github-text">{pattern.from}</span>
                  <ArrowRight className="h-3 w-3 text-github-text-secondary" />
                  <span className="text-sm text-github-text">{pattern.to}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${getDifficultyColor(pattern.difficulty)}`}>
                    {pattern.difficulty}
                  </Badge>
                  {pattern.trend === "popular" && (
                    <Badge variant="secondary" className="text-xs">
                      Popular
                    </Badge>
                  )}
                  {pattern.trend === "growing" && (
                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 text-xs">
                      Growing
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}