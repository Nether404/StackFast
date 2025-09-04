import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  BarChart3, 
  TrendingUp, 
  Network, 
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  Filter,
  ArrowUpDown
} from "lucide-react";
import type { ToolWithCategory, CompatibilityMatrix } from "@shared/schema";

interface CompatibilityInsightsProps {
  tools: ToolWithCategory[];
  compatibilityMatrix: CompatibilityMatrix[];
}

export function CompatibilityInsights({ tools, compatibilityMatrix }: CompatibilityInsightsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"score" | "count" | "name">("score");

  // Calculate compatibility statistics
  const stats = useMemo(() => {
    const scores = compatibilityMatrix.map(c => c.compatibilityScore);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highCompatibility = scores.filter(s => s >= 90).length;
    const mediumCompatibility = scores.filter(s => s >= 70 && s < 90).length;
    const lowCompatibility = scores.filter(s => s >= 50 && s < 70).length;
    const incompatible = scores.filter(s => s < 50).length;

    return {
      avgScore: Math.round(avgScore),
      total: scores.length,
      highCompatibility,
      mediumCompatibility,
      lowCompatibility,
      incompatible,
      coverage: Math.round((scores.length / (tools.length * (tools.length - 1) / 2)) * 100)
    };
  }, [compatibilityMatrix, tools]);

  // Find compatibility hubs (tools that work well with many others)
  const compatibilityHubs = useMemo(() => {
    const hubScores = new Map<string, { tool: ToolWithCategory; avgScore: number; count: number; highScores: number }>();

    tools.forEach(tool => {
      const compatibilities = compatibilityMatrix.filter(
        c => c.toolOne.id === tool.id || c.toolTwo.id === tool.id
      );
      
      if (compatibilities.length > 0) {
        const scores = compatibilities.map(c => c.compatibilityScore);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const highScores = scores.filter(s => s >= 85).length;
        
        hubScores.set(tool.id, {
          tool,
          avgScore,
          count: compatibilities.length,
          highScores
        });
      }
    });

    return Array.from(hubScores.values())
      .filter(h => selectedCategory === "all" || h.tool.category.name === selectedCategory)
      .filter(h => h.avgScore >= minScore)
      .sort((a, b) => {
        if (sortBy === "score") return b.avgScore - a.avgScore;
        if (sortBy === "count") return b.count - a.count;
        return a.tool.name.localeCompare(b.tool.name);
      })
      .slice(0, 10);
  }, [tools, compatibilityMatrix, selectedCategory, minScore, sortBy]);

  // Find best tool pairs
  const bestPairs = useMemo(() => {
    return compatibilityMatrix
      .filter(c => c.compatibilityScore >= 85)
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, 10);
  }, [compatibilityMatrix]);

  // Find problematic pairs
  const problematicPairs = useMemo(() => {
    return compatibilityMatrix
      .filter(c => c.compatibilityScore < 50)
      .sort((a, b) => a.compatibilityScore - b.compatibilityScore)
      .slice(0, 5);
  }, [compatibilityMatrix]);

  // Category compatibility analysis
  const categoryAnalysis = useMemo(() => {
    const categoryPairs = new Map<string, { avgScore: number; count: number }>();
    
    compatibilityMatrix.forEach(c => {
      const key = `${c.toolOne.category.name}-${c.toolTwo.category.name}`;
      const reverseKey = `${c.toolTwo.category.name}-${c.toolOne.category.name}`;
      const finalKey = categoryPairs.has(key) ? key : reverseKey;
      
      const existing = categoryPairs.get(finalKey) || { avgScore: 0, count: 0 };
      categoryPairs.set(finalKey, {
        avgScore: (existing.avgScore * existing.count + c.compatibilityScore) / (existing.count + 1),
        count: existing.count + 1
      });
    });

    return Array.from(categoryPairs.entries())
      .map(([key, value]) => ({
        categories: key.split('-'),
        avgScore: Math.round(value.avgScore),
        count: value.count
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [compatibilityMatrix]);

  const categories = Array.from(new Set(tools.map(t => t.category.name)));

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    if (score >= 50) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 90) return "default";
    if (score >= 70) return "secondary";
    if (score >= 50) return "outline";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-github-surface border-github-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-github-text-secondary">
              Average Compatibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>
                {stats.avgScore}%
              </span>
              <TrendingUp className="h-4 w-4 text-github-text-secondary" />
            </div>
            <Progress value={stats.avgScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-github-surface border-github-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-github-text-secondary">
              Matrix Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-github-text">{stats.coverage}%</span>
              <Network className="h-4 w-4 text-github-text-secondary" />
            </div>
            <p className="text-xs text-github-text-secondary mt-1">
              {stats.total} of {Math.round(tools.length * (tools.length - 1) / 2)} possible pairs
            </p>
          </CardContent>
        </Card>

        <Card className="bg-github-surface border-github-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-github-text-secondary">
              High Compatibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-green-500">{stats.highCompatibility}</span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-github-text-secondary mt-1">Score ≥ 90%</p>
          </CardContent>
        </Card>

        <Card className="bg-github-surface border-github-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-github-text-secondary">
              Low Compatibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-orange-500">{stats.incompatible}</span>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-xs text-github-text-secondary mt-1">Score &lt; 50%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="hubs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-github-surface">
          <TabsTrigger value="hubs" data-testid="tab-hubs">
            <Sparkles className="h-4 w-4 mr-2" />
            Hubs
          </TabsTrigger>
          <TabsTrigger value="pairs" data-testid="tab-pairs">
            <Network className="h-4 w-4 mr-2" />
            Best Pairs
          </TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">
            <BarChart3 className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="warnings" data-testid="tab-warnings">
            <AlertCircle className="h-4 w-4 mr-2" />
            Warnings
          </TabsTrigger>
        </TabsList>

        {/* Compatibility Hubs */}
        <TabsContent value="hubs" className="space-y-4">
          <Card className="bg-github-surface border-github-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-github-text">Compatibility Hubs</CardTitle>
                  <CardDescription>
                    Tools that work well with many others in your stack
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40" data-testid="select-category">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                    <SelectTrigger className="w-32" data-testid="select-sort">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score">By Score</SelectItem>
                      <SelectItem value="count">By Count</SelectItem>
                      <SelectItem value="name">By Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {compatibilityHubs.map(hub => (
                  <div key={hub.tool.id} className="flex items-center justify-between p-3 rounded-lg bg-github-canvas border border-github-border hover:bg-github-surface transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{hub.tool.category.name === "AI Coding Tools" ? "🤖" : "🔧"}</div>
                      <div>
                        <div className="font-medium text-github-text">{hub.tool.name}</div>
                        <div className="text-sm text-github-text-secondary">
                          Works with {hub.count} tools • {hub.highScores} excellent matches
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getScoreBadgeVariant(hub.avgScore)}>
                        {Math.round(hub.avgScore)}% avg
                      </Badge>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-github-text-secondary" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Average compatibility score across all tested integrations</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Best Pairs */}
        <TabsContent value="pairs" className="space-y-4">
          <Card className="bg-github-surface border-github-border">
            <CardHeader>
              <CardTitle className="text-github-text">Highest Compatibility Pairs</CardTitle>
              <CardDescription>
                Tool combinations with the best integration scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bestPairs.map((pair, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-900/20 to-github-canvas border border-green-800/30">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium text-github-text">
                          {pair.toolOne.name} + {pair.toolTwo.name}
                        </div>
                        <div className="text-sm text-github-text-secondary">
                          {pair.toolOne.category.name} × {pair.toolTwo.category.name}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                      {pair.compatibilityScore}% compatible
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Analysis */}
        <TabsContent value="categories" className="space-y-4">
          <Card className="bg-github-surface border-github-border">
            <CardHeader>
              <CardTitle className="text-github-text">Category Compatibility</CardTitle>
              <CardDescription>
                Average compatibility scores between tool categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryAnalysis.slice(0, 10).map((analysis, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-github-canvas border border-github-border">
                    <div className="flex items-center gap-3">
                      <BarChart3 className={`h-5 w-5 ${getScoreColor(analysis.avgScore)}`} />
                      <div>
                        <div className="font-medium text-github-text">
                          {analysis.categories[0]} ↔ {analysis.categories[1]}
                        </div>
                        <div className="text-sm text-github-text-secondary">
                          Based on {analysis.count} tool pairs
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={analysis.avgScore} className="w-20" />
                      <Badge variant={getScoreBadgeVariant(analysis.avgScore)}>
                        {analysis.avgScore}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Warnings */}
        <TabsContent value="warnings" className="space-y-4">
          <Card className="bg-github-surface border-github-border">
            <CardHeader>
              <CardTitle className="text-github-text">Compatibility Warnings</CardTitle>
              <CardDescription>
                Tool pairs with known integration challenges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {problematicPairs.map((pair, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-red-900/20 to-github-canvas border border-red-800/30">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <div>
                        <div className="font-medium text-github-text">
                          {pair.toolOne.name} ⚠️ {pair.toolTwo.name}
                        </div>
                        <div className="text-sm text-github-text-secondary">
                          Integration requires additional configuration
                        </div>
                      </div>
                    </div>
                    <Badge variant="destructive">
                      {pair.compatibilityScore}% compatible
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}