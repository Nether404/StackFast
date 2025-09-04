import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  DollarSign,
  Users,
  Code,
  Package,
  FileCode,
  BookOpen,
  Rocket,
  Shield,
  AlertTriangle,
  TrendingUp,
  Download
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MigrationStep {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: "easy" | "medium" | "hard";
  category: "preparation" | "migration" | "testing" | "deployment";
  tasks: string[];
  risks: string[];
  tips: string[];
}

interface MigrationPath {
  from: any;
  to: any;
  compatibility: number;
  effort: "low" | "medium" | "high";
  estimatedTime: string;
  steps: MigrationStep[];
  benefits: string[];
  challenges: string[];
  alternatives: any[];
}

export default function MigrationWizard() {
  const [fromTool, setFromTool] = useState<string>("");
  const [toTool, setToTool] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Fetch available tools
  const { data: tools = [] } = useQuery({
    queryKey: ["/api/tools/quality"],
  });

  // Generate migration plan
  const { data: migrationPlan, isLoading: isGeneratingPlan } = useQuery({
    queryKey: ["/api/migration/plan", fromTool, toTool],
    enabled: !!fromTool && !!toTool && fromTool !== toTool,
    queryFn: async () => {
      // In a real app, this would call the migration planning API
      const fromToolData = tools.find((t: any) => t.id === fromTool);
      const toToolData = tools.find((t: any) => t.id === toTool);
      
      if (!fromToolData || !toToolData) return null;
      
      // Generate migration steps based on tool categories
      const steps: MigrationStep[] = [
        {
          id: "assessment",
          title: "Current State Assessment",
          description: `Analyze your current ${fromToolData.name} implementation`,
          duration: "2-4 hours",
          difficulty: "easy",
          category: "preparation",
          tasks: [
            "Document current configuration and settings",
            "List all integrations and dependencies",
            "Export data and configurations",
            "Identify custom code and workflows"
          ],
          risks: [
            "Missing critical configurations",
            "Undocumented customizations"
          ],
          tips: [
            "Create a comprehensive backup before starting",
            "Document all API keys and credentials"
          ]
        },
        {
          id: "planning",
          title: "Migration Planning",
          description: `Create detailed migration plan to ${toToolData.name}`,
          duration: "4-8 hours",
          difficulty: "medium",
          category: "preparation",
          tasks: [
            "Map features between tools",
            "Identify feature gaps and workarounds",
            "Create data migration strategy",
            "Plan rollback procedures"
          ],
          risks: [
            "Feature parity issues",
            "Data format incompatibilities"
          ],
          tips: [
            "Involve all stakeholders in planning",
            "Create a detailed timeline with milestones"
          ]
        },
        {
          id: "environment",
          title: "Environment Setup",
          description: `Set up ${toToolData.name} environment`,
          duration: "2-6 hours",
          difficulty: "medium",
          category: "migration",
          tasks: [
            "Create accounts and workspaces",
            "Configure initial settings",
            "Set up user access and permissions",
            "Install required plugins/extensions"
          ],
          risks: [
            "Configuration errors",
            "Permission issues"
          ],
          tips: [
            "Start with a sandbox environment",
            "Document all configuration changes"
          ]
        },
        {
          id: "data",
          title: "Data Migration",
          description: "Migrate data and content",
          duration: "4-16 hours",
          difficulty: "hard",
          category: "migration",
          tasks: [
            "Export data from source system",
            "Transform data to target format",
            "Import data to new system",
            "Verify data integrity"
          ],
          risks: [
            "Data loss or corruption",
            "Format conversion issues"
          ],
          tips: [
            "Migrate in small batches",
            "Validate data after each batch"
          ]
        },
        {
          id: "integration",
          title: "Integration & Configuration",
          description: "Set up integrations and workflows",
          duration: "8-16 hours",
          difficulty: "hard",
          category: "migration",
          tasks: [
            "Configure API connections",
            "Set up webhooks and automations",
            "Migrate custom code",
            "Configure monitoring and alerts"
          ],
          risks: [
            "Integration failures",
            "Performance issues"
          ],
          tips: [
            "Test each integration thoroughly",
            "Monitor API rate limits"
          ]
        },
        {
          id: "testing",
          title: "Testing & Validation",
          description: "Test all functionality",
          duration: "4-8 hours",
          difficulty: "medium",
          category: "testing",
          tasks: [
            "Perform functional testing",
            "Run performance tests",
            "Validate data accuracy",
            "User acceptance testing"
          ],
          risks: [
            "Missed edge cases",
            "Performance degradation"
          ],
          tips: [
            "Create comprehensive test cases",
            "Include real users in testing"
          ]
        },
        {
          id: "training",
          title: "Team Training",
          description: "Train team on new tool",
          duration: "4-8 hours",
          difficulty: "easy",
          category: "deployment",
          tasks: [
            "Create training materials",
            "Conduct training sessions",
            "Document new procedures",
            "Set up support channels"
          ],
          risks: [
            "User resistance",
            "Knowledge gaps"
          ],
          tips: [
            "Focus on key differences",
            "Provide hands-on practice"
          ]
        },
        {
          id: "cutover",
          title: "Production Cutover",
          description: "Switch to new system",
          duration: "2-4 hours",
          difficulty: "medium",
          category: "deployment",
          tasks: [
            "Final data sync",
            "Update DNS/routing",
            "Notify stakeholders",
            "Monitor system health"
          ],
          risks: [
            "Downtime",
            "Rollback delays"
          ],
          tips: [
            "Plan for off-peak hours",
            "Have rollback plan ready"
          ]
        }
      ];
      
      const compatibility = Math.floor(Math.random() * 40) + 60;
      const effort = compatibility > 80 ? "low" : compatibility > 60 ? "medium" : "high";
      
      return {
        from: fromToolData,
        to: toToolData,
        compatibility,
        effort,
        estimatedTime: `${steps.reduce((sum, s) => sum + parseInt(s.duration), 0)}-${steps.reduce((sum, s) => sum + parseInt(s.duration.split('-')[1] || s.duration), 0)} hours`,
        steps,
        benefits: [
          `${toToolData.name} offers better ${toToolData.features?.[0] || 'features'}`,
          "Improved team collaboration",
          "Better integration capabilities",
          "Enhanced security and compliance"
        ],
        challenges: [
          "Learning curve for team members",
          "Data migration complexity",
          "Potential feature gaps",
          "Integration reconfiguration"
        ],
        alternatives: tools.filter((t: any) => 
          t.id !== fromTool && 
          t.id !== toTool && 
          t.category === toToolData.category
        ).slice(0, 3)
      } as MigrationPath;
    }
  });

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set(prev).add(stepId));
    toast({
      title: "Step Completed",
      description: "Great progress! Moving to the next step.",
    });
  };

  const calculateProgress = () => {
    if (!migrationPlan) return 0;
    return (completedSteps.size / migrationPlan.steps.length) * 100;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "text-green-500";
      case "medium": return "text-yellow-500";
      case "hard": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "preparation": return BookOpen;
      case "migration": return Package;
      case "testing": return Shield;
      case "deployment": return Rocket;
      default: return FileCode;
    }
  };

  const exportMigrationPlan = () => {
    if (!migrationPlan) return;
    
    const planText = JSON.stringify(migrationPlan, null, 2);
    const blob = new Blob([planText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration-plan-${fromTool}-to-${toTool}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Plan Exported",
      description: "Migration plan saved to your downloads.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Migration Wizard</CardTitle>
              <CardDescription>
                Step-by-step guidance for transitioning between tools
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              Smart Migration
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Tool Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Migration Path</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <Select value={fromTool} onValueChange={setFromTool}>
              <SelectTrigger data-testid="from-tool-select">
                <SelectValue placeholder="From Tool..." />
              </SelectTrigger>
              <SelectContent>
                {tools.map((tool: any) => (
                  <SelectItem key={tool.id} value={tool.id}>
                    {tool.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
            
            <Select value={toTool} onValueChange={setToTool}>
              <SelectTrigger data-testid="to-tool-select">
                <SelectValue placeholder="To Tool..." />
              </SelectTrigger>
              <SelectContent>
                {tools.filter((t: any) => t.id !== fromTool).map((tool: any) => (
                  <SelectItem key={tool.id} value={tool.id}>
                    {tool.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!fromTool || !toTool ? (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Select both source and target tools to generate a migration plan
              </AlertDescription>
            </Alert>
          ) : fromTool === toTool ? (
            <Alert className="mt-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Source and target tools must be different
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {/* Migration Plan */}
      {migrationPlan && (
        <>
          {/* Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Migration Overview</CardTitle>
                <Button onClick={exportMigrationPlan} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Plan
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    Compatibility
                  </div>
                  <div className="text-2xl font-bold">{migrationPlan.compatibility}%</div>
                  <Progress value={migrationPlan.compatibility} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Estimated Time
                  </div>
                  <div className="text-2xl font-bold">{migrationPlan.estimatedTime}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Effort Level
                  </div>
                  <Badge variant={migrationPlan.effort === "low" ? "success" : migrationPlan.effort === "medium" ? "secondary" : "destructive"} className="text-lg">
                    {migrationPlan.effort.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    Progress
                  </div>
                  <div className="text-2xl font-bold">{Math.round(calculateProgress())}%</div>
                  <Progress value={calculateProgress()} className="h-2" />
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Benefits
                  </h4>
                  <ul className="space-y-2">
                    {migrationPlan.benefits.map((benefit, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Challenges
                  </h4>
                  <ul className="space-y-2">
                    {migrationPlan.challenges.map((challenge, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        {challenge}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Migration Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Migration Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={migrationPlan.steps[currentStep]?.id} onValueChange={(value) => {
                const index = migrationPlan.steps.findIndex(s => s.id === value);
                if (index !== -1) setCurrentStep(index);
              }}>
                <TabsList className="grid grid-cols-4 lg:grid-cols-8 mb-6">
                  {migrationPlan.steps.map((step, index) => {
                    const Icon = getCategoryIcon(step.category);
                    const isCompleted = completedSteps.has(step.id);
                    return (
                      <TabsTrigger 
                        key={step.id} 
                        value={step.id}
                        className="relative"
                        data-testid={`step-tab-${step.id}`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                          <span className="text-xs hidden lg:inline">{index + 1}</span>
                        </div>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                
                {migrationPlan.steps.map((step) => (
                  <TabsContent key={step.id} value={step.id} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{step.title}</h3>
                        <p className="text-muted-foreground mt-1">{step.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {step.duration}
                        </Badge>
                        <Badge className={getDifficultyColor(step.difficulty)} variant="outline">
                          {step.difficulty}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Tasks */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Tasks</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {step.tasks.map((task, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                                {task}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      
                      {/* Risks */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Risks</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {step.risks.map((risk, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      
                      {/* Tips */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Tips</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {step.tips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0}
                      >
                        Previous Step
                      </Button>
                      <Button
                        onClick={() => handleStepComplete(step.id)}
                        disabled={completedSteps.has(step.id)}
                        data-testid={`complete-step-${step.id}`}
                      >
                        {completedSteps.has(step.id) ? "Completed" : "Mark as Complete"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(Math.min(migrationPlan.steps.length - 1, currentStep + 1))}
                        disabled={currentStep === migrationPlan.steps.length - 1}
                      >
                        Next Step
                      </Button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Alternative Tools */}
          {migrationPlan.alternatives.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Alternative Options</CardTitle>
                <CardDescription>
                  Other tools you might consider in the same category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {migrationPlan.alternatives.map((tool: any) => (
                    <Card key={tool.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{tool.name}</CardTitle>
                          <Badge variant="outline">{tool.category}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {tool.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {tool.popularityScore}%
                          </span>
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {tool.maturityScore}%
                          </span>
                        </div>
                        <Button
                          variant="link"
                          className="p-0 h-auto"
                          onClick={() => {
                            setToTool(tool.id);
                            setCompletedSteps(new Set());
                          }}
                        >
                          Use as target instead →
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}