import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import type { Tool } from '@shared/schema';
import { 
  Sparkles, 
  Clock, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  Layers,
  Code,
  Cpu,
  Zap,
  GitBranch,
  Package,
  Shield
} from 'lucide-react';

interface Blueprint {
  title: string;
  techStack: string;
  backendLogic: string[];
  frontendLogic: string[];
  recommendedWorkflow: {
    name: string;
    stages: string[];
    reasoning: string;
  };
  recommendedTools: Array<{
    tool: string;
    category: string;
    reason: string;
    compatibilityScore?: number;
  }>;
  stackAnalysis: {
    harmonyScore: number;
    totalTools: number;
    conflicts: string[];
    warnings: string[];
    integrationComplexity: 'low' | 'medium' | 'high';
  };
  alternativeStacks?: Array<{
    name: string;
    tools: string[];
    harmonyScore: number;
    tradeoffs: string;
  }>;
  estimatedTimeline?: {
    development: string;
    testing: string;
    deployment: string;
  };
  costEstimate?: {
    tooling: string;
    infrastructure: string;
    maintenance: string;
  };
}

export default function BlueprintBuilder() {
  const [idea, setIdea] = useState('');
  const [preferredTools, setPreferredTools] = useState<string[]>([]);
  const [avoidTools, setAvoidTools] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<'prototype' | 'mvp' | 'production'>('mvp');
  const [budget, setBudget] = useState<'low' | 'medium' | 'high' | 'enterprise'>('medium');
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch available tools for selection
  const { data: tools = [] } = useQuery<Tool[]>({
    queryKey: ['/api/tools'],
  });

  // Generate blueprint mutation
  const generateBlueprint = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/v1/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawIdea: idea,
          preferredTools,
          avoidTools,
          timeline,
          budget
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate blueprint');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setBlueprint(data.blueprint);
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
    }
  });

  const handleGenerate = () => {
    if (!idea.trim()) return;
    setIsGenerating(true);
    generateBlueprint.mutate();
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getHarmonyColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Blueprint Builder</h1>
        <p className="text-muted-foreground">
          Generate intelligent project blueprints with compatibility-aware tech stack recommendations
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Project Configuration</CardTitle>
            <CardDescription>
              Describe your project and preferences to generate an optimized blueprint
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="idea">Project Idea</Label>
              <Textarea
                id="idea"
                placeholder="Describe your project idea... e.g., 'Build a real-time collaborative code editor with AI assistance'"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred">Preferred Tools (Optional)</Label>
              <Select
                onValueChange={(value) => setPreferredTools([...preferredTools, value])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred tools" />
                </SelectTrigger>
                <SelectContent>
                  {tools.map((tool) => (
                    <SelectItem key={tool.id} value={tool.name}>
                      {tool.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {preferredTools.map((tool) => (
                  <Badge key={tool} variant="secondary">
                    {tool}
                    <button
                      onClick={() => setPreferredTools(preferredTools.filter(t => t !== tool))}
                      className="ml-2 text-xs"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeline">Timeline</Label>
                <Select value={timeline} onValueChange={(v: any) => setTimeline(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prototype">Prototype (1-2 weeks)</SelectItem>
                    <SelectItem value="mvp">MVP (1-3 months)</SelectItem>
                    <SelectItem value="production">Production (3-6 months)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget</Label>
                <Select value={budget} onValueChange={(v: any) => setBudget(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (&lt;$100/mo)</SelectItem>
                    <SelectItem value="medium">Medium ($100-500/mo)</SelectItem>
                    <SelectItem value="high">High ($500-2000/mo)</SelectItem>
                    <SelectItem value="enterprise">Enterprise ($2000+/mo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={!idea.trim() || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Generating Blueprint...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Blueprint
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Blueprint Output Section */}
        {blueprint && (
          <Card>
            <CardHeader>
              <CardTitle>{blueprint.title}</CardTitle>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline" className={getComplexityColor(blueprint.stackAnalysis.integrationComplexity)}>
                  {blueprint.stackAnalysis.integrationComplexity} complexity
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Harmony:</span>
                  <Progress 
                    value={blueprint.stackAnalysis.harmonyScore} 
                    className="w-20"
                  />
                  <span className="text-sm font-medium">{blueprint.stackAnalysis.harmonyScore}%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="stack">Tech Stack</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Frontend Logic
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {blueprint.frontendLogic.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      Backend Logic
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {blueprint.backendLogic.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="stack" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Recommended Tools</h4>
                    <div className="space-y-3">
                      {blueprint.recommendedTools.map((tool, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <div className="font-medium">{tool.tool}</div>
                            <div className="text-xs text-muted-foreground">{tool.reason}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{tool.category}</Badge>
                            {tool.compatibilityScore && (
                              <Badge variant="outline">{tool.compatibilityScore}%</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {blueprint.stackAnalysis.warnings.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {blueprint.stackAnalysis.warnings.join('. ')}
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="timeline" className="space-y-4">
                  {blueprint.estimatedTimeline && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Development</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{blueprint.estimatedTimeline.development}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Testing</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{blueprint.estimatedTimeline.testing}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Deployment</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{blueprint.estimatedTimeline.deployment}</div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {blueprint.costEstimate && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Cost Estimates
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tooling:</span>
                          <span className="font-medium">{blueprint.costEstimate.tooling}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Infrastructure:</span>
                          <span className="font-medium">{blueprint.costEstimate.infrastructure}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Maintenance:</span>
                          <span className="font-medium">{blueprint.costEstimate.maintenance}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="alternatives" className="space-y-4">
                  {blueprint.alternativeStacks && blueprint.alternativeStacks.length > 0 ? (
                    blueprint.alternativeStacks.map((alt, i) => (
                      <Card key={i}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{alt.name}</CardTitle>
                            <Badge className={getHarmonyColor(alt.harmonyScore)}>
                              {alt.harmonyScore}% harmony
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {alt.tools.map((tool) => (
                                <Badge key={tool} variant="outline">{tool}</Badge>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">{alt.tradeoffs}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No alternative stacks suggested - current selection is optimal
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}