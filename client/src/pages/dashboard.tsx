import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Cpu, Layout, Database, Zap, TrendingUp, 
  ArrowRight, Sparkles, GitCompare, Layers,
  Star, Activity, Users, Clock, CheckCircle2,
  Rocket, BookOpen, MessageSquare, Target
} from "lucide-react";
import { Link } from "wouter";
import { QuickBlueprint } from "@/components/blueprint/quick-blueprint";
import type { ToolWithCategory } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: tools = [] } = useQuery<ToolWithCategory[]>({
    queryKey: ["/api/tools/quality"],
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: compatibilities = [] } = useQuery<any[]>({
    queryKey: ["/api/compatibility-matrix"],
  });

  // Get category statistics
  const getCategoryStats = () => {
    // Create a map of categoryId to category name
    const categoryMap = categories.reduce((acc: any, cat: any) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {});

    // Count tools by categoryId
    const stats = tools.reduce((acc, tool: any) => {
      if (tool.categoryId && categoryMap[tool.categoryId]) {
        const categoryName = categoryMap[tool.categoryId];
        acc[categoryName] = (acc[categoryName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return [
      { 
        name: "IDE/Development", 
        count: stats["IDE/Development"] || 0, 
        icon: Cpu, 
        color: "bg-purple-600 text-white",
        description: "IDEs and code editors"
      },
      { 
        name: "AI Coding Tools", 
        count: stats["AI Coding Tools"] || 0, 
        icon: Sparkles, 
        color: "bg-neon-orange text-white",
        description: "AI-powered code generation"
      },
      { 
        name: "Backend/Database", 
        count: stats["Backend/Database"] || 0, 
        icon: Database, 
        color: "bg-emerald-600 text-white",
        description: "Servers, databases and hosting"
      },
      { 
        name: "Frontend/Design", 
        count: stats["Frontend/Design"] || 0, 
        icon: Layout, 
        color: "bg-blue-600 text-white",
        description: "UI frameworks and design tools"
      },
      { 
        name: "DevOps/Deployment", 
        count: stats["DevOps/Deployment"] || 0, 
        icon: Layers, 
        color: "bg-violet-600 text-white",
        description: "Deployment and operations"
      },
      { 
        name: "Payment Platforms", 
        count: stats["Payment Platforms"] || 0, 
        icon: Zap, 
        color: "bg-amber-600 text-white",
        description: "Payment and e-commerce"
      },
    ];
  };

  // Get top rated tools
  const getTopTools = () => {
    return tools
      .filter(tool => tool.popularityScore >= 7)
      .sort((a, b) => (b.popularityScore + b.maturityScore) - (a.popularityScore + a.maturityScore))
      .slice(0, 6);
  };

  const categoryStats = getCategoryStats();
  const topTools = getTopTools();

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Welcome Section */}
      <div className="">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Welcome to TechStack Explorer</h1>
        <p className="text-base sm:text-lg text-github-text-secondary">Your intelligent platform for building and optimizing tech stacks</p>
      </div>

      {/* Quick Start Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-purple-600/10 to-purple-600/5 border-purple-600/20 hover:border-purple-600/40 transition-all group cursor-pointer">
          <Link href="/quickstart">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Rocket className="h-8 w-8 text-purple-400" />
                <ArrowRight className="h-4 w-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <CardTitle className="text-xl mt-4">Quick Start</CardTitle>
              <CardDescription>New here? Get up to speed in 5 minutes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm">Interactive walkthrough</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm">Sample projects</span>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="bg-gradient-to-br from-neon-orange/10 to-neon-orange/5 border-neon-orange/20 hover:border-neon-orange/40 transition-all group cursor-pointer">
          <Link href="/blueprint">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Sparkles className="h-8 w-8 text-neon-orange" />
                <ArrowRight className="h-4 w-4 text-neon-orange group-hover:translate-x-1 transition-transform" />
              </div>
              <CardTitle className="text-xl mt-4">AI Blueprint</CardTitle>
              <CardDescription>Generate a complete tech stack with AI</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm">30-second generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">Tailored recommendations</span>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/10 to-green-600/5 border-green-600/20 hover:border-green-600/40 transition-all group cursor-pointer">
          <Link href="/stack-builder">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Layers className="h-8 w-8 text-green-400" />
                <ArrowRight className="h-4 w-4 text-green-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <CardTitle className="text-xl mt-4">Stack Builder</CardTitle>
              <CardDescription>Build and validate your tech stack</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <GitCompare className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm">Compatibility checks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm">{tools.length}+ tools available</span>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Quick Blueprint Generator */}
      <QuickBlueprint />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-github-surface border-github-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-github-text-secondary">Total Tools</p>
                <p className="text-2xl font-bold text-github-text">{tools.length}</p>
              </div>
              <Database className="h-8 w-8 text-github-text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-github-surface border-github-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-github-text-secondary">Compatibility Scores</p>
                <p className="text-2xl font-bold text-github-text">{compatibilities.length}</p>
              </div>
              <Activity className="h-8 w-8 text-neon-orange" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-github-surface border-github-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-github-text-secondary">Categories</p>
                <p className="text-2xl font-bold text-github-text">{categoryStats.length}</p>
              </div>
              <Layers className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-github-surface border-github-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-github-text-secondary">Avg Score</p>
                <p className="text-2xl font-bold text-github-text">
                  {Math.round(
                    compatibilities.reduce((acc, c) => acc + (c.compatibilityScore || 0), 0) / 
                    Math.max(compatibilities.length, 1)
                  )}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Grid */}
      <div>
        <h2 className="text-xl font-semibold text-github-text mb-4">Explore Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {categoryStats.map((category) => {
            const Icon = category.icon;
            return (
              <Link href={`/?tab=database&category=${encodeURIComponent(category.name)}`} key={category.name}>
                <Card 
                  className="bg-github-surface border-github-border hover:border-neon-orange transition-colors cursor-pointer"
                  data-testid={`category-${category.name}`}
                >
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center mb-4`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-github-text mb-1">{category.name}</h3>
                    <p className="text-sm text-github-text-secondary mb-3">{category.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-github-text">{category.count}</span>
                      <ArrowRight className="h-4 w-4 text-github-text-secondary" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Popular Tools */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-github-text">Popular Tools</h2>
          <Link href="/?tab=database">
            <Button variant="ghost" size="sm" className="text-neon-orange hover:bg-github-surface">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topTools.map((tool) => (
            <Card key={tool.id} className="bg-github-surface border-github-border hover:border-neon-orange transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-github-text mb-1">{tool.name}</h3>
                    <div className="flex flex-wrap gap-1">
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
                      {(tool as any).categories && (tool as any).categories.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{(tool as any).categories.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-github-text">{tool.popularityScore}</span>
                  </div>
                </div>
                <p className="text-sm text-github-text-secondary line-clamp-2 mb-3">
                  {tool.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      Maturity: {tool.maturityScore}
                    </Badge>
                  </div>
                  <Link href={`/?tab=database&search=${encodeURIComponent(tool.name)}`}>
                    <Button variant="ghost" size="sm" className="text-neon-orange hover:bg-github-surface">
                      <Sparkles className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-github-surface border-github-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-github-text">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/?tab=stack-builder">
              <Button variant="outline" className="w-full justify-start border-github-border hover:bg-github-dark">
                <Layers className="h-4 w-4 mr-2" />
                Build a new tech stack
              </Button>
            </Link>
            <Link href="/?tab=compare">
              <Button variant="outline" className="w-full justify-start border-github-border hover:bg-github-dark">
                <GitCompare className="h-4 w-4 mr-2" />
                Compare similar tools
              </Button>
            </Link>
            <Link href="/?tab=database">
              <Button variant="outline" className="w-full justify-start border-github-border hover:bg-github-dark">
                <Database className="h-4 w-4 mr-2" />
                Browse tool database
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}