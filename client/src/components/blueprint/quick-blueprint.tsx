import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

interface QuickBlueprintProps {
  onBlueprintGenerated?: (blueprint: any) => void;
}

export function QuickBlueprint({ onBlueprintGenerated }: QuickBlueprintProps) {
  const [idea, setIdea] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastBlueprint, setLastBlueprint] = useState<any>(null);

  const generateBlueprint = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/v1/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawIdea: idea,
          timeline: 'mvp',
          budget: 'medium'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate blueprint');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setLastBlueprint(data.blueprint);
      setIsGenerating(false);
      if (onBlueprintGenerated) {
        onBlueprintGenerated(data.blueprint);
      }
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <Card className="bg-gradient-to-br from-github-surface to-github-dark border-github-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-neon-orange" />
          Quick Blueprint Generator
        </CardTitle>
        <CardDescription>
          Transform your idea into an intelligent tech stack blueprint with compatibility analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Describe your project idea..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              disabled={isGenerating}
            />
            <Button 
              onClick={handleGenerate}
              disabled={!idea.trim() || isGenerating}
              className="min-w-[120px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating
                </>
              ) : (
                <>
                  Generate
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {lastBlueprint && (
            <div className="p-4 rounded-lg bg-github-surface/50 border border-github-border space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{lastBlueprint.title}</h4>
                <Badge variant="outline" className="text-xs">
                  {lastBlueprint.stackAnalysis?.harmonyScore || 0}% harmony
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {lastBlueprint.techStack?.split(', ').map((tool: string) => (
                  <Badge key={tool} variant="secondary" className="text-xs">
                    {tool}
                  </Badge>
                ))}
              </div>

              {lastBlueprint.recommendedWorkflow && (
                <p className="text-xs text-muted-foreground">
                  Workflow: {lastBlueprint.recommendedWorkflow.name}
                </p>
              )}

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => window.location.href = '/?tab=blueprint'}
              >
                View Full Blueprint
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}