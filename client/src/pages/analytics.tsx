import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Package, 
  GitBranch,
  Zap,
  DollarSign,
  Shield,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import type { ToolWithCategory, CompatibilityMatrix } from "@shared/schema";

export default function AnalyticsPage() {
  // Fetch all tools
  const { data: tools = [], isLoading: toolsLoading } = useQuery<ToolWithCategory[]>({
    queryKey: ["/api/tools"]
  });

  // Fetch compatibility matrix
  const { data: compatibilityMatrix = [], isLoading: matrixLoading } = useQuery<CompatibilityMatrix[]>({
    queryKey: ["/api/compatibility-matrix"]
  });

  // Calculate analytics data
  const calculateAnalytics = () => {
    if (tools.length === 0) return null;

    // Category distribution
    const categoryDistribution = tools.reduce((acc, tool) => {
      const category = tool.category.name;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Popularity leaders
    const popularityLeaders = [...tools]
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, 10);

    // Maturity leaders
    const maturityLeaders = [...tools]
      .sort((a, b) => b.maturityScore - a.maturityScore)
      .slice(0, 10);

    // Integration champions (tools with most integrations)
    const integrationChampions = [...tools]
      .sort((a, b) => b.integrations.length - a.integrations.length)
      .slice(0, 10);

    // Free tier availability
    const freeTierCount = tools.filter(t => t.pricing?.toLowerCase().includes('free')).length;
    const freeTierPercentage = Math.round((freeTierCount / tools.length) * 100);

    // Compatibility insights
    const compatibilityScores = compatibilityMatrix.map(c => c.compatibilityScore);
    const avgCompatibility = compatibilityScores.length > 0
      ? Math.round(compatibilityScores.reduce((a, b) => a + b, 0) / compatibilityScores.length)
      : 0;
    
    const highCompatPairs = compatibilityMatrix
      .filter(c => c.compatibilityScore >= 80)
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, 10);

    const lowCompatPairs = compatibilityMatrix
      .filter(c => c.compatibilityScore < 50)
      .sort((a, b) => a.compatibilityScore - b.compatibilityScore)
      .slice(0, 10);

    // Category compatibility heatmap
    const categoryCompatibility: Record<string, Record<string, { score: number; count: number }>> = {};
    compatibilityMatrix.forEach(item => {
      const cat1 = item.toolOne.category.name;
      const cat2 = item.toolTwo.category.name;
      
      if (!categoryCompatibility[cat1]) categoryCompatibility[cat1] = {};
      if (!categoryCompatibility[cat1][cat2]) {
        categoryCompatibility[cat1][cat2] = { score: 0, count: 0 };
      }
      
      categoryCompatibility[cat1][cat2].score += item.compatibilityScore;
      categoryCompatibility[cat1][cat2].count += 1;
    });

    // Calculate category averages
    const categoryAverages: Array<{ categories: string[]; avgScore: number; count: number }> = [];
    Object.entries(categoryCompatibility).forEach(([cat1, targets]) => {
      Object.entries(targets).forEach(([cat2, data]) => {
        categoryAverages.push({
          categories: [cat1, cat2],
          avgScore: Math.round(data.score / data.count),
          count: data.count
        });
      });
    });
    categoryAverages.sort((a, b) => b.avgScore - a.avgScore);

    return {
      totalTools: tools.length,
      categoryDistribution,
      popularityLeaders,
      maturityLeaders,
      integrationChampions,
      freeTierCount,
      freeTierPercentage,
      avgCompatibility,
      highCompatPairs,
      lowCompatPairs,
      categoryAverages,
      totalCompatibilities: compatibilityMatrix.length
    };
  };

  const analytics = calculateAnalytics();

  if (toolsLoading || matrixLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-neon-orange mx-auto mb-4 animate-pulse" />
          <p className="text-github-text-secondary">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-github-text-secondary">No data available for analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-github-surface border-github-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Package className="h-5 w-5 text-neon-orange" />
              <Badge variant="secondary">Total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-github-text">{analytics.totalTools}</div>
            <p className="text-xs text-github-text-secondary">Development Tools</p>
          </CardContent>
        </Card>

        <Card className="bg-github-surface border-github-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <GitBranch className="h-5 w-5 text-blue-400" />
              <Badge variant="secondary">Matrix</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-github-text">{analytics.totalCompatibilities}</div>
            <p className="text-xs text-github-text-secondary">Compatibility Mappings</p>
          </CardContent>
        </Card>

        <Card className="bg-github-surface border-github-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Zap className="h-5 w-5 text-yellow-400" />
              <Badge variant="secondary">Average</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-github-text">{analytics.avgCompatibility}%</div>
            <p className="text-xs text-github-text-secondary">Compatibility Score</p>
          </CardContent>
        </Card>

        <Card className="bg-github-surface border-github-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DollarSign className="h-5 w-5 text-green-400" />
              <Badge variant="secondary">Free</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-github-text">{analytics.freeTierPercentage}%</div>
            <p className="text-xs text-github-text-secondary">Have Free Tier</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="popularity" className="space-y-4">
        <TabsList className="bg-github-dark border border-github-border">
          <TabsTrigger value="popularity">Popularity</TabsTrigger>
          <TabsTrigger value="maturity">Maturity</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        {/* Popularity Tab */}
        <TabsContent value="popularity" className="space-y-4">
          <Card className="bg-github-surface border-github-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                Most Popular Tools
              </CardTitle>
              <CardDescription>Top 10 tools by popularity score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.popularityLeaders.map((tool, idx) => (
                  <div key={tool.id} className="flex items-center justify-between p-3 rounded-lg bg-github-dark border border-github-border">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neon-orange/20 text-neon-orange font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-medium text-github-text">{tool.name}</div>
                        <div className="text-xs text-github-text-secondary">{tool.category.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={tool.popularityScore * 10} className="w-20" />
                      <span className="text-sm font-medium text-github-text">{tool.popularityScore.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maturity Tab */}
        <TabsContent value="maturity" className="space-y-4">
          <Card className="bg-github-surface border-github-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-400" />
                Most Mature Tools
              </CardTitle>
              <CardDescription>Top 10 tools by maturity score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.maturityLeaders.map((tool, idx) => (
                  <div key={tool.id} className="flex items-center justify-between p-3 rounded-lg bg-github-dark border border-github-border">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-900/30 text-green-400 font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-medium text-github-text">{tool.name}</div>
                        <div className="text-xs text-github-text-secondary">{tool.category.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={tool.maturityScore * 10} className="w-20" />
                      <span className="text-sm font-medium text-github-text">{tool.maturityScore.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <Card className="bg-github-surface border-github-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-purple-400" />
                Integration Champions
              </CardTitle>
              <CardDescription>Tools with the most integration options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.integrationChampions.map((tool, idx) => (
                  <div key={tool.id} className="flex items-center justify-between p-3 rounded-lg bg-github-dark border border-github-border">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-900/30 text-purple-400 font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-medium text-github-text">{tool.name}</div>
                        <div className="text-xs text-github-text-secondary">
                          {tool.integrations.slice(0, 3).join(", ")}
                          {tool.integrations.length > 3 && ` +${tool.integrations.length - 3} more`}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {tool.integrations.length} integrations
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compatibility Tab */}
        <TabsContent value="compatibility" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* High Compatibility Pairs */}
            <Card className="bg-github-surface border-github-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUp className="h-5 w-5 text-green-400" />
                  Best Compatibility
                </CardTitle>
                <CardDescription>Tool pairs with highest compatibility</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.highCompatPairs.map((pair, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-green-900/20 border border-green-800/30">
                      <div className="text-sm">
                        <span className="text-github-text">{pair.toolOne.name}</span>
                        <span className="text-github-text-secondary mx-2">↔</span>
                        <span className="text-github-text">{pair.toolTwo.name}</span>
                      </div>
                      <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                        {pair.compatibilityScore}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Low Compatibility Pairs */}
            <Card className="bg-github-surface border-github-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDown className="h-5 w-5 text-red-400" />
                  Challenging Integrations
                </CardTitle>
                <CardDescription>Tool pairs that may need extra work</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.lowCompatPairs.map((pair, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-red-900/20 border border-red-800/30">
                      <div className="text-sm">
                        <span className="text-github-text">{pair.toolOne.name}</span>
                        <span className="text-github-text-secondary mx-2">↔</span>
                        <span className="text-github-text">{pair.toolTwo.name}</span>
                      </div>
                      <Badge className="bg-red-600/20 text-red-400 border-red-600/30">
                        {pair.compatibilityScore}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Compatibility Matrix */}
          <Card className="bg-github-surface border-github-border">
            <CardHeader>
              <CardTitle>Category Compatibility Insights</CardTitle>
              <CardDescription>Average compatibility scores between tool categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.categoryAverages.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-github-dark border border-github-border">
                    <div className="flex items-center gap-2">
                      <span className="text-github-text font-medium">{item.categories[0]}</span>
                      <span className="text-github-text-secondary">×</span>
                      <span className="text-github-text font-medium">{item.categories[1]}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-github-text-secondary">{item.count} pairs</span>
                      <Badge className={
                        item.avgScore >= 80 ? "bg-green-600/20 text-green-400 border-green-600/30" :
                        item.avgScore >= 60 ? "bg-yellow-600/20 text-yellow-400 border-yellow-600/30" :
                        "bg-red-600/20 text-red-400 border-red-600/30"
                      }>
                        {item.avgScore}% avg
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card className="bg-github-surface border-github-border">
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
              <CardDescription>Number of tools in each category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.categoryDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => {
                    const percentage = Math.round((count / analytics.totalTools) * 100);
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-github-text">{category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-github-text-secondary">{count} tools</span>
                            <Badge variant="secondary">{percentage}%</Badge>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}