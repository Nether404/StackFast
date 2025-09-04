import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation } from '@tanstack/react-query';
import { 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  DollarSign,
  GitBranch,
  Package,
  Zap,
  FileText,
  Download
} from 'lucide-react';

interface MigrationPath {
  fromTool: string;
  toTool: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  steps: string[];
  dataPortability: number;
  featureParity: number;
  risks: string[];
  benefits: string[];
  costImplication: string;
}

interface MigrationWizardProps {
  tools: any[];
}

export function MigrationWizard({ tools }: MigrationWizardProps) {
  const [fromTool, setFromTool] = useState<string>('');
  const [toTool, setToTool] = useState<string>('');
  const [migrationPath, setMigrationPath] = useState<MigrationPath | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const getMigrationPath = useMutation({
    mutationFn: async ({ from, to }: { from: string; to: string }) => {
      const response = await fetch(`/api/v1/migration/${from}/${to}`);
      if (!response.ok) throw new Error('Failed to get migration path');
      return response.json();
    },
    onSuccess: (data) => {
      setMigrationPath(data);
      setCurrentStep(0);
    }
  });

  const exportMigrationPlan = () => {
    if (!migrationPath) return;
    
    const plan = {
      migration: migrationPath,
      generatedAt: new Date().toISOString(),
      estimatedCompletion: calculateCompletionDate(migrationPath.estimatedTime)
    };
    
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration-${fromTool}-to-${toTool}.json`;
    a.click();
  };

  const calculateCompletionDate = (timeEstimate: string): string => {
    const days = parseInt(timeEstimate) || 7;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-500/10 text-green-500 border-green-500/20',
      medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      hard: 'bg-red-500/10 text-red-500 border-red-500/20'
    };
    
    return (
      <Badge className={colors[difficulty as keyof typeof colors] || ''}>
        {difficulty} migration
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Migration Wizard</CardTitle>
        <CardDescription>
          Plan and execute tool migrations with detailed guidance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tool Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">From Tool</label>
            <Select value={fromTool} onValueChange={setFromTool}>
              <SelectTrigger>
                <SelectValue placeholder="Select current tool" />
              </SelectTrigger>
              <SelectContent>
                {tools.map((tool) => (
                  <SelectItem key={tool.id} value={tool.name}>
                    {tool.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">To Tool</label>
            <Select value={toTool} onValueChange={setToTool}>
              <SelectTrigger>
                <SelectValue placeholder="Select target tool" />
              </SelectTrigger>
              <SelectContent>
                {tools
                  .filter(t => t.name !== fromTool)
                  .map((tool) => (
                    <SelectItem key={tool.id} value={tool.name}>
                      {tool.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={() => getMigrationPath.mutate({ from: fromTool, to: toTool })}
          disabled={!fromTool || !toTool || getMigrationPath.isPending}
          className="w-full"
        >
          {getMigrationPath.isPending ? (
            <>Analyzing migration path...</>
          ) : (
            <>
              Generate Migration Plan
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        {/* Migration Path Details */}
        {migrationPath && (
          <div className="space-y-6">
            {/* Overview */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-github-surface border">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{fromTool}</h3>
                  <ArrowRight className="h-4 w-4" />
                  <h3 className="font-semibold">{toTool}</h3>
                </div>
                <div className="flex gap-2">
                  {getDifficultyBadge(migrationPath.difficulty)}
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {migrationPath.estimatedTime}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportMigrationPlan}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Plan
              </Button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Data Portability</span>
                  <span className="font-medium">{migrationPath.dataPortability}%</span>
                </div>
                <Progress value={migrationPath.dataPortability} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Feature Parity</span>
                  <span className="font-medium">{migrationPath.featureParity}%</span>
                </div>
                <Progress value={migrationPath.featureParity} className="h-2" />
              </div>
            </div>

            {/* Detailed Information */}
            <Tabs defaultValue="steps" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="steps">Steps</TabsTrigger>
                <TabsTrigger value="risks">Risks</TabsTrigger>
                <TabsTrigger value="benefits">Benefits</TabsTrigger>
                <TabsTrigger value="cost">Cost</TabsTrigger>
              </TabsList>

              <TabsContent value="steps" className="space-y-3">
                <h4 className="font-medium">Migration Steps</h4>
                <div className="space-y-2">
                  {migrationPath.steps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        index === currentStep ? 'bg-neon-orange/10 border-neon-orange' : ''
                      }`}
                    >
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        index < currentStep ? 'bg-green-500 text-white' :
                        index === currentStep ? 'bg-neon-orange text-white' :
                        'bg-gray-600 text-gray-300'
                      }`}>
                        {index < currentStep ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setCurrentStep(Math.min(migrationPath.steps.length - 1, currentStep + 1))}
                    disabled={currentStep === migrationPath.steps.length - 1}
                  >
                    Next Step
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="risks" className="space-y-3">
                <h4 className="font-medium">Potential Risks</h4>
                {migrationPath.risks.length > 0 ? (
                  <div className="space-y-2">
                    {migrationPath.risks.map((risk, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{risk}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No significant risks identified</p>
                )}
              </TabsContent>

              <TabsContent value="benefits" className="space-y-3">
                <h4 className="font-medium">Expected Benefits</h4>
                <div className="space-y-2">
                  {migrationPath.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <p className="text-sm">{benefit}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="cost" className="space-y-3">
                <h4 className="font-medium">Cost Implications</h4>
                <div className="p-4 rounded-lg bg-github-surface border">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">Migration Cost Analysis</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{migrationPath.costImplication}</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}