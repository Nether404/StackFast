import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  GitBranch,
  Zap,
  AlertTriangle
} from 'lucide-react';

interface CompatibilityPair {
  toolA: string;
  toolB: string;
  score: number;
  difficulty: 'easy' | 'medium' | 'hard';
  notes: string;
}

interface StackHarmonyProps {
  harmonyScore: number;
  compatibilityMatrix: CompatibilityPair[];
  conflicts?: string[];
  warnings?: string[];
  integrationComplexity?: 'low' | 'medium' | 'high';
}

export function StackHarmony({ 
  harmonyScore, 
  compatibilityMatrix, 
  conflicts = [],
  warnings = [],
  integrationComplexity = 'medium'
}: StackHarmonyProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 border-green-500/20';
    if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/20';
    if (score >= 40) return 'bg-orange-500/10 border-orange-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <Zap className="h-3 w-3 text-green-500" />;
      case 'medium': return <GitBranch className="h-3 w-3 text-yellow-500" />;
      case 'hard': return <AlertTriangle className="h-3 w-3 text-red-500" />;
      default: return null;
    }
  };

  const getComplexityBadge = (complexity: string) => {
    const variants = {
      low: 'default',
      medium: 'secondary',
      high: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[complexity as keyof typeof variants] || 'secondary'}>
        {complexity} complexity
      </Badge>
    );
  };

  const getHarmonyLabel = (score: number) => {
    if (score >= 90) return 'Excellent Harmony';
    if (score >= 75) return 'Good Harmony';
    if (score >= 60) return 'Moderate Harmony';
    if (score >= 40) return 'Low Harmony';
    return 'Poor Harmony';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Stack Harmony Analysis</CardTitle>
          {integrationComplexity && getComplexityBadge(integrationComplexity)}
        </div>
        <CardDescription>
          Compatibility analysis of your selected tech stack
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Harmony Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-lg font-semibold ${getScoreColor(harmonyScore)}`}>
              {getHarmonyLabel(harmonyScore)}
            </span>
            <span className="text-2xl font-bold">{harmonyScore}%</span>
          </div>
          <Progress value={harmonyScore} className="h-3" />
        </div>

        {/* Compatibility Matrix */}
        <div>
          <h4 className="text-sm font-medium mb-3">Tool Compatibility Breakdown</h4>
          <div className="space-y-2">
            {compatibilityMatrix.map((pair, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg border ${getScoreBg(pair.score)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{pair.toolA}</span>
                    <span className="text-muted-foreground">↔</span>
                    <span className="font-medium">{pair.toolB}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getDifficultyIcon(pair.difficulty)}
                    <span className={`font-semibold ${getScoreColor(pair.score)}`}>
                      {pair.score}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{pair.notes}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Conflicts */}
        {conflicts.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Conflicts detected:</strong>
              <ul className="mt-1 list-disc list-inside">
                {conflicts.map((conflict, idx) => (
                  <li key={idx} className="text-sm">{conflict}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warnings:</strong>
              <ul className="mt-1 list-disc list-inside">
                {warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm">{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {harmonyScore >= 80 && conflicts.length === 0 && (
          <Alert className="border-green-500/20 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              This stack has excellent compatibility! All tools work well together with minimal integration effort required.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}