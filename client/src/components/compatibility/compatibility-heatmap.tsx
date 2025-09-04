import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, EyeOff } from 'lucide-react';

interface CompatibilityScore {
  toolOneId: string;
  toolTwoId: string;
  compatibilityScore: number;
  notes?: string;
}

interface Tool {
  id: string;
  name: string;
  categoryId?: string;
}

interface CompatibilityHeatmapProps {
  tools: Tool[];
  compatibilities: CompatibilityScore[];
  selectedTools?: string[];
  onToolSelect?: (toolId: string) => void;
}

export function CompatibilityHeatmap({ 
  tools, 
  compatibilities,
  selectedTools = [],
  onToolSelect
}: CompatibilityHeatmapProps) {
  const [showLabels, setShowLabels] = React.useState(true);

  // Create a map for quick compatibility lookup
  const compatibilityMap = useMemo(() => {
    const map = new Map<string, number>();
    compatibilities.forEach(comp => {
      const key1 = `${comp.toolOneId}-${comp.toolTwoId}`;
      const key2 = `${comp.toolTwoId}-${comp.toolOneId}`;
      map.set(key1, comp.compatibilityScore);
      map.set(key2, comp.compatibilityScore);
    });
    return map;
  }, [compatibilities]);

  // Get compatibility score between two tools
  const getCompatibilityScore = (tool1Id: string, tool2Id: string): number => {
    if (tool1Id === tool2Id) return 100;
    const key = `${tool1Id}-${tool2Id}`;
    return compatibilityMap.get(key) || 50; // Default to neutral if no data
  };

  // Get color based on compatibility score
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'bg-green-600';
    if (score >= 75) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 45) return 'bg-orange-500';
    if (score >= 30) return 'bg-red-500';
    return 'bg-red-600';
  };

  // Get text color for contrast
  const getTextColor = (score: number): string => {
    return score >= 60 ? 'text-white' : 'text-white';
  };

  // Sort tools by category for better visualization
  const sortedTools = useMemo(() => {
    return [...tools].sort((a, b) => {
      if (a.categoryId === b.categoryId) {
        return a.name.localeCompare(b.name);
      }
      return (a.categoryId || '').localeCompare(b.categoryId || '');
    });
  }, [tools]);

  // Limit display to avoid overwhelming the UI
  const displayTools = sortedTools.slice(0, 12);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Compatibility Matrix</CardTitle>
            <CardDescription>
              Visual heatmap showing compatibility scores between tools
            </CardDescription>
          </div>
          <button
            onClick={() => setShowLabels(!showLabels)}
            className="p-2 rounded-lg hover:bg-github-surface transition-colors"
            title={showLabels ? "Hide labels" : "Show labels"}
          >
            {showLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Tool names on top */}
            <div className="flex mb-2">
              <div className="w-32"></div>
              {displayTools.map((tool) => (
                <div
                  key={tool.id}
                  className="flex-1 text-center"
                  style={{ minWidth: '60px' }}
                >
                  <div className="text-xs text-muted-foreground transform -rotate-45 origin-bottom-left whitespace-nowrap">
                    {tool.name.substring(0, 12)}
                  </div>
                </div>
              ))}
            </div>

            {/* Matrix rows */}
            {displayTools.map((rowTool) => (
              <div key={rowTool.id} className="flex items-center mb-1">
                {/* Tool name on left */}
                <div className="w-32 pr-2 text-sm font-medium text-right truncate">
                  {rowTool.name}
                </div>

                {/* Compatibility cells */}
                {displayTools.map((colTool) => {
                  const score = getCompatibilityScore(rowTool.id, colTool.id);
                  const isSelected = selectedTools.includes(rowTool.id) && selectedTools.includes(colTool.id);
                  const isDiagonal = rowTool.id === colTool.id;

                  return (
                    <TooltipProvider key={colTool.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`
                              flex-1 aspect-square flex items-center justify-center
                              text-xs font-medium cursor-pointer transition-all
                              ${isDiagonal ? 'bg-gray-700' : getScoreColor(score)}
                              ${getTextColor(score)}
                              ${isSelected ? 'ring-2 ring-neon-orange' : ''}
                              hover:scale-110 hover:z-10
                              mx-0.5 rounded-sm
                            `}
                            style={{ minWidth: '60px', height: '60px' }}
                            onClick={() => {
                              if (!isDiagonal && onToolSelect) {
                                onToolSelect(colTool.id);
                              }
                            }}
                          >
                            {showLabels && !isDiagonal && (
                              <span>{Math.round(score)}</span>
                            )}
                            {isDiagonal && '—'}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <div className="font-medium">
                              {rowTool.name} ↔ {colTool.name}
                            </div>
                            {!isDiagonal && (
                              <div className="mt-1">
                                Compatibility: {Math.round(score)}%
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Poor</span>
            <div className="flex gap-1">
              <div className="w-6 h-6 bg-red-600 rounded-sm"></div>
              <div className="w-6 h-6 bg-red-500 rounded-sm"></div>
              <div className="w-6 h-6 bg-orange-500 rounded-sm"></div>
              <div className="w-6 h-6 bg-yellow-500 rounded-sm"></div>
              <div className="w-6 h-6 bg-green-500 rounded-sm"></div>
              <div className="w-6 h-6 bg-green-600 rounded-sm"></div>
            </div>
            <span className="text-xs text-muted-foreground">Excellent</span>
          </div>
        </div>

        {tools.length > 12 && (
          <div className="mt-4 text-center">
            <Badge variant="secondary" className="text-xs">
              Showing top 12 of {tools.length} tools
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}