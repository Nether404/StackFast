import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Download, 
  Database, 
  Globe, 
  Lock,
  Info,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Package,
  Code,
  TrendingUp,
  Sparkles,
  Link,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SiGithub, SiNpm, SiProducthunt } from "react-icons/si";

interface DataSource {
  id: string;
  name: string;
  requiresAuth: boolean;
  type: string;
  description: string;
}

interface ImportResults {
  total: number;
  imported: number;
  updated: number;
  failed: number;
  skipped: number;
  duration: number;
  sources: Record<string, number>;
}

export function ExternalDataSources() {
  const [selectedSources, setSelectedSources] = useState<string[]>(['back4app', 'producthunt']);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [importProgress, setImportProgress] = useState<number>(0);
  const [dryRun, setDryRun] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(true);
  const { toast } = useToast();

  // Fetch available data sources
  const { data: dataSources = [], isLoading: sourcesLoading } = useQuery<DataSource[]>({
    queryKey: ["/api/external-sources/available"]
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/external-sources/import", {
        sources: selectedSources,
        apiKeys,
        dryRun
      });
      return response.json() as Promise<ImportResults>;
    },
    onSuccess: (data) => {
      if (dryRun) {
        toast({
          title: "Dry Run Complete",
          description: `Would import ${data.imported} new tools and update ${data.updated} existing tools.`
        });
      } else {
        toast({
          title: "Import Successful",
          description: `Imported ${data.imported} new tools and updated ${data.updated} existing tools in ${(data.duration / 1000).toFixed(1)}s`
        });
        queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      }
      setImportProgress(0);
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: "Failed to import tools from external sources. Please try again.",
        variant: "destructive"
      });
      setImportProgress(0);
    }
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/external-sources/sync", {
        sources: selectedSources,
        apiKeys,
        updateExisting
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Complete",
        description: `Synced ${data.imported + data.updated} tools from ${Object.keys(data.sources).length} sources`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync data sources. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleImport = async () => {
    setImportProgress(10);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    await importMutation.mutateAsync();
    clearInterval(progressInterval);
    setImportProgress(100);
    
    setTimeout(() => setImportProgress(0), 2000);
  };

  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev => 
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const getSourceIcon = (sourceId: string) => {
    switch (sourceId) {
      case 'github':
        return <SiGithub className="h-5 w-5" />;
      case 'npm':
        return <SiNpm className="h-5 w-5" />;
      case 'producthunt':
        return <SiProducthunt className="h-5 w-5" />;
      case 'back4app':
        return <Database className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  const getSourceStats = (sourceId: string) => {
    const stats: Record<string, { tools: string; update: string }> = {
      github: { tools: '10,000+', update: 'Real-time' },
      npm: { tools: '2M+', update: 'Daily' },
      back4app: { tools: '500+', update: 'Weekly' },
      producthunt: { tools: '1,000+', update: 'Daily' },
      devhunt: { tools: '500+', update: 'Daily' }
    };
    return stats[sourceId] || { tools: 'Unknown', update: 'Unknown' };
  };

  if (sourcesLoading) {
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
      <Card className="bg-github-surface border-github-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-github-text">External Data Sources</CardTitle>
              <CardDescription>
                Import tools from GitHub, npm, Product Hunt, and more
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-neon-orange border-neon-orange">
              <Sparkles className="h-3 w-3 mr-1" />
              Dynamic Data
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Comprehensive Tool Discovery</AlertTitle>
            <AlertDescription>
              Connect to multiple data sources to automatically discover and import thousands of developer tools. 
              This replaces the static tool list with a dynamic, always-updated database.
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            {/* Source Selection */}
            <div>
              <h3 className="text-sm font-medium text-github-text mb-4">Select Data Sources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataSources.map(source => {
                  const isSelected = selectedSources.includes(source.id);
                  const stats = getSourceStats(source.id);
                  
                  return (
                    <div
                      key={source.id}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-neon-orange/10 border-neon-orange" 
                          : "bg-github-canvas border-github-border hover:border-github-text-secondary"
                      }`}
                      onClick={() => toggleSource(source.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSource(source.id)}
                          className="mt-1"
                          data-testid={`checkbox-source-${source.id}`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getSourceIcon(source.id)}
                            <span className="font-medium text-github-text">{source.name}</span>
                            {source.requiresAuth && (
                              <Lock className="h-3 w-3 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-sm text-github-text-secondary mb-2">
                            {source.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {stats.tools} tools
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {stats.update} updates
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* API Keys Configuration */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="api-keys">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    API Configuration (Optional)
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Some sources work without authentication but have rate limits. 
                        Add API keys for higher limits and access to premium features.
                      </AlertDescription>
                    </Alert>
                    
                    {dataSources
                      .filter(source => source.requiresAuth && selectedSources.includes(source.id))
                      .map(source => (
                        <div key={source.id} className="space-y-2">
                          <Label htmlFor={`api-${source.id}`}>
                            {source.name} API Key
                          </Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                id={`api-${source.id}`}
                                type={showApiKeys[source.id] ? "text" : "password"}
                                placeholder={`Enter ${source.name} API key`}
                                value={apiKeys[source.id] || ''}
                                onChange={(e) => setApiKeys(prev => ({
                                  ...prev,
                                  [source.id]: e.target.value
                                }))}
                                data-testid={`input-api-${source.id}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowApiKeys(prev => ({
                                  ...prev,
                                  [source.id]: !prev[source.id]
                                }))}
                              >
                                {showApiKeys[source.id] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Import Options */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-github-text">Import Options</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dry-run">Dry Run</Label>
                  <p className="text-sm text-github-text-secondary">
                    Preview what would be imported without making changes
                  </p>
                </div>
                <Switch
                  id="dry-run"
                  checked={dryRun}
                  onCheckedChange={setDryRun}
                  data-testid="switch-dry-run"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="update-existing">Update Existing Tools</Label>
                  <p className="text-sm text-github-text-secondary">
                    Update tools that already exist in the database
                  </p>
                </div>
                <Switch
                  id="update-existing"
                  checked={updateExisting}
                  onCheckedChange={setUpdateExisting}
                  data-testid="switch-update-existing"
                />
              </div>
            </div>

            {/* Progress Bar */}
            {importProgress > 0 && (
              <div className="space-y-2">
                <Progress value={importProgress} className="h-2" />
                <p className="text-sm text-github-text-secondary">
                  {importProgress < 100 ? 'Importing tools...' : 'Import complete!'} {importProgress}%
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleImport}
                disabled={selectedSources.length === 0 || importMutation.isPending}
                className="flex-1"
                data-testid="button-import"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {dryRun ? 'Preview Import' : 'Import Tools'}
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => syncMutation.mutate()}
                disabled={selectedSources.length === 0 || syncMutation.isPending}
                data-testid="button-sync"
              >
                {syncMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Results Display */}
            {importMutation.data && (
              <Card className="bg-github-canvas border-github-border">
                <CardHeader>
                  <CardTitle className="text-sm">Import Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-sm text-github-text-secondary">New Tools</p>
                      <p className="text-xl font-bold text-green-500">{importMutation.data.imported}</p>
                    </div>
                    <div>
                      <p className="text-sm text-github-text-secondary">Updated</p>
                      <p className="text-xl font-bold text-blue-500">{importMutation.data.updated}</p>
                    </div>
                    <div>
                      <p className="text-sm text-github-text-secondary">Skipped</p>
                      <p className="text-xl font-bold text-yellow-500">{importMutation.data.skipped || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-github-text-secondary">Failed</p>
                      <p className="text-xl font-bold text-red-500">{importMutation.data.failed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-github-text-secondary">Duration</p>
                      <p className="text-xl font-bold text-github-text">
                        {(importMutation.data.duration / 1000).toFixed(1)}s
                      </p>
                    </div>
                  </div>
                  
                  {Object.keys(importMutation.data.sources).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-github-border">
                      <p className="text-sm text-github-text-secondary mb-2">By Source:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(importMutation.data.sources).map(([source, count]) => (
                          <Badge key={source} variant="secondary">
                            {source}: {count} tools
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {importMutation.data.skipped > 0 && (
                    <Alert className="mt-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        {importMutation.data.skipped} tools were skipped because they already exist in the database. 
                        {!updateExisting && " Enable 'Update Existing Tools' to refresh their data."}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {importMutation.data.imported === 0 && importMutation.data.skipped === 0 && (
                    <Alert className="mt-4" variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No new tools found. This may happen if the source has no new tools or if there was an error fetching data.
                        Try selecting different sources or check your API keys.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}