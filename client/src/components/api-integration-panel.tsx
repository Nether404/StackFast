import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Zap,
  Globe,
  Lock,
  Info,
  Loader2,
  TrendingUp
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { Tool } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ApiIntegrationPanelProps {
  tools: Tool[];
}

interface IntegrationStatus {
  available: boolean;
  requiresAuth: boolean;
  lastSync?: string;
  rateLimit?: number;
}

export function ApiIntegrationPanel({ tools }: ApiIntegrationPanelProps) {
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const { toast } = useToast();

  // Fetch available integrations
  const { data: availableIntegrations = [], isLoading: integrationsLoading } = useQuery<string[]>({
    queryKey: ["/api/integrations/available"]
  });

  // Single tool sync mutation
  const syncTool = useMutation({
    mutationFn: async ({ toolId, toolName }: { toolId: string; toolName: string }) => {
      const response = await apiRequest("POST", `/api/integrations/sync/${toolId}`, { toolName });
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Sync Successful",
        description: `${variables.toolName} has been updated with latest data`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
    },
    onError: (error, variables) => {
      toast({
        title: "Sync Failed",
        description: `Failed to sync ${variables.toolName}. Please try again.`,
        variant: "destructive"
      });
    }
  });

  // Batch sync mutation
  const batchSync = useMutation({
    mutationFn: async (toolNames: string[]) => {
      const response = await apiRequest("POST", "/api/integrations/batch-sync", { toolNames });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Batch Sync Complete",
        description: `Successfully synced ${data.success} tools. ${data.failed} failed.`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      setSyncProgress(0);
      setSelectedTools([]);
    }
  });

  // Get tools with available integrations
  const integratedTools = tools.filter(tool => 
    availableIntegrations.includes(tool.name)
  );

  // Calculate statistics
  const stats = {
    totalIntegrations: availableIntegrations.length,
    connectedTools: integratedTools.filter(t => t.apiLastSync).length,
    recentSyncs: integratedTools.filter(t => {
      if (!t.apiLastSync) return false;
      const hoursSinceSync = (Date.now() - new Date(t.apiLastSync).getTime()) / (1000 * 60 * 60);
      return hoursSinceSync < 24;
    }).length,
    needsUpdate: integratedTools.filter(t => {
      if (!t.apiLastSync) return true;
      const daysSinceSync = (Date.now() - new Date(t.apiLastSync).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceSync > 7;
    }).length
  };

  const handleSyncAll = async () => {
    setSyncProgress(0);
    const totalTools = selectedTools.length || integratedTools.length;
    const toolsToSync = selectedTools.length > 0 
      ? selectedTools 
      : integratedTools.map(t => t.name);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    await batchSync.mutateAsync(toolsToSync);
    clearInterval(progressInterval);
    setSyncProgress(100);
    
    setTimeout(() => setSyncProgress(0), 2000);
  };

  const toggleToolSelection = (toolName: string) => {
    setSelectedTools(prev => 
      prev.includes(toolName)
        ? prev.filter(t => t !== toolName)
        : [...prev, toolName]
    );
  };

  const getLastSyncStatus = (lastSync?: Date | null) => {
    if (!lastSync) return { text: "Never synced", color: "text-gray-500" };
    
    const hoursSinceSync = (Date.now() - new Date(lastSync).getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceSync < 1) return { text: "Just synced", color: "text-green-500" };
    if (hoursSinceSync < 24) return { text: formatDistanceToNow(new Date(lastSync), { addSuffix: true }), color: "text-blue-500" };
    if (hoursSinceSync < 168) return { text: formatDistanceToNow(new Date(lastSync), { addSuffix: true }), color: "text-yellow-500" };
    return { text: formatDistanceToNow(new Date(lastSync), { addSuffix: true }), color: "text-orange-500" };
  };

  if (integrationsLoading) {
    return (
      <Card className="bg-github-surface border-github-border">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-github-text-secondary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-github-surface border-github-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-github-text-secondary">
              Available APIs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-github-text">{stats.totalIntegrations}</span>
              <Globe className="h-4 w-4 text-github-text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-github-surface border-github-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-github-text-secondary">
              Connected Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-green-500">{stats.connectedTools}</span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-github-surface border-github-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-github-text-secondary">
              Recent Syncs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-500">{stats.recentSyncs}</span>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-xs text-github-text-secondary mt-1">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="bg-github-surface border-github-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-github-text-secondary">
              Needs Update
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-orange-500">{stats.needsUpdate}</span>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-xs text-github-text-secondary mt-1">Over 7 days old</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-github-surface">
          <TabsTrigger value="integrations" data-testid="tab-integrations">
            <Zap className="h-4 w-4 mr-2" />
            API Integrations
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Lock className="h-4 w-4 mr-2" />
            API Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <Card className="bg-github-surface border-github-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-github-text">Connected Tools</CardTitle>
                  <CardDescription>
                    Sync tool data from official APIs to get real-time updates
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {selectedTools.length > 0 && (
                    <Badge variant="outline">
                      {selectedTools.length} selected
                    </Badge>
                  )}
                  <Button 
                    onClick={handleSyncAll}
                    disabled={batchSync.isPending}
                    data-testid="button-sync-all"
                  >
                    {batchSync.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {selectedTools.length > 0 ? `Sync Selected (${selectedTools.length})` : "Sync All"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {syncProgress > 0 && (
                <div className="mb-4">
                  <Progress value={syncProgress} className="h-2" />
                  <p className="text-sm text-github-text-secondary mt-1">
                    Syncing tools... {syncProgress}%
                  </p>
                </div>
              )}
              
              <div className="space-y-3">
                {integratedTools.map(tool => {
                  const syncStatus = getLastSyncStatus(tool.apiLastSync);
                  const isSelected = selectedTools.includes(tool.name);
                  
                  return (
                    <div 
                      key={tool.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        isSelected 
                          ? "bg-neon-orange/10 border-neon-orange/30" 
                          : "bg-github-canvas border-github-border hover:bg-github-surface"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleToolSelection(tool.name)}
                          className="h-4 w-4 rounded border-github-border"
                          data-testid={`checkbox-${tool.id}`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-github-text">{tool.name}</span>
                            {tool.apiLastSync && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div className={`text-sm ${syncStatus.color}`}>
                            {syncStatus.text}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {tool.popularityScore && tool.popularityScore > 8 && (
                          <Badge variant="outline" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => syncTool.mutate({ toolId: tool.id, toolName: tool.name })}
                          disabled={syncTool.isPending}
                          data-testid={`button-sync-${tool.id}`}
                        >
                          {syncTool.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-github-surface border-github-border">
            <CardHeader>
              <CardTitle className="text-github-text">API Configuration</CardTitle>
              <CardDescription>
                Configure API keys for premium integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>API Keys Required</AlertTitle>
                <AlertDescription>
                  Some integrations require API keys for full functionality. Keys are stored securely and never exposed.
                </AlertDescription>
              </Alert>
              
              <div className="mt-4 space-y-4">
                <div className="p-4 rounded-lg bg-github-canvas border border-github-border">
                  <h3 className="font-medium text-github-text mb-2">Available Integrations:</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableIntegrations.map(integration => (
                      <Badge key={integration} variant="secondary">
                        {integration}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="text-sm text-github-text-secondary">
                  <p>• GitHub API: Public access, no key required</p>
                  <p>• OpenAI API: Requires API key for model listings</p>
                  <p>• Stripe API: Requires API key for product data</p>
                  <p>• Vercel API: Requires token for deployment stats</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}