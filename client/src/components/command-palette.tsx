import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  Layers,
  Sparkles,
  Database,
  GitCompare,
  Grid3x3,
  BarChart3,
  Plus,
  Search,
  Settings,
  HelpCircle,
  BookOpen,
  Zap,
  FileText,
  Code,
  Cpu,
  Layout,
  Server,
  CreditCard,
  Hash,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { ToolWithCategory } from "@shared/schema";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTool: () => void;
}

export function CommandPalette({ open, onOpenChange, onAddTool }: CommandPaletteProps) {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const { data: tools = [] } = useQuery<ToolWithCategory[]>({
    queryKey: ["/api/tools/quality"],
    enabled: open,
  });

  const navigate = useCallback((href: string) => {
    setLocation(href);
    onOpenChange(false);
  }, [setLocation, onOpenChange]);

  const runAction = useCallback((action: () => void) => {
    action();
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onOpenChange, open]);

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, any> = {
      "IDE/Development": Cpu,
      "AI Coding Tools": Sparkles,
      "Backend/Database": Server,
      "Frontend/Design": Layout,
      "DevOps/Deployment": Layers,
      "Payment Platforms": CreditCard,
    };
    return iconMap[category] || Hash;
  };

  const topTools = tools
    .filter(tool => tool.popularityScore >= 7)
    .slice(0, 5);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search for tools, pages, or actions..."
        value={search}
        onValueChange={setSearch}
        data-testid="command-palette-input"
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => runAction(onAddTool)}
            className="flex items-center gap-2"
            data-testid="command-action-add-tool"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Tool</span>
          </CommandItem>
          <CommandItem
            onSelect={() => navigate("/stack-builder")}
            className="flex items-center gap-2"
            data-testid="command-action-build-stack"
          >
            <Layers className="h-4 w-4" />
            <span>Build Tech Stack</span>
            <Badge variant="secondary" className="ml-auto">⌘B</Badge>
          </CommandItem>
          <CommandItem
            onSelect={() => navigate("/blueprint")}
            className="flex items-center gap-2"
            data-testid="command-action-generate-blueprint"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate AI Blueprint</span>
            <Badge className="ml-auto bg-purple-600/20 text-purple-400">AI</Badge>
          </CommandItem>
          <CommandItem
            onSelect={() => navigate("/compare")}
            className="flex items-center gap-2"
            data-testid="command-action-compare"
          >
            <GitCompare className="h-4 w-4" />
            <span>Compare Tools</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigate">
          <CommandItem
            onSelect={() => navigate("/")}
            className="flex items-center gap-2"
            data-testid="command-nav-dashboard"
          >
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() => navigate("/quickstart")}
            className="flex items-center gap-2"
            data-testid="command-nav-quickstart"
          >
            <Zap className="h-4 w-4" />
            <span>Quick Start Guide</span>
            <Badge className="ml-auto bg-green-600/20 text-green-400">New</Badge>
          </CommandItem>
          <CommandItem
            onSelect={() => navigate("/tools")}
            className="flex items-center gap-2"
            data-testid="command-nav-tools"
          >
            <Database className="h-4 w-4" />
            <span>Tool Database</span>
          </CommandItem>
          <CommandItem
            onSelect={() => navigate("/compatibility")}
            className="flex items-center gap-2"
            data-testid="command-nav-matrix"
          >
            <Grid3x3 className="h-4 w-4" />
            <span>Compatibility Matrix</span>
          </CommandItem>
          <CommandItem
            onSelect={() => navigate("/analytics")}
            className="flex items-center gap-2"
            data-testid="command-nav-analytics"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics & Insights</span>
          </CommandItem>
        </CommandGroup>

        {/* Popular Tools */}
        {topTools.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Popular Tools">
              {topTools.map((tool) => {
                const Icon = getCategoryIcon(tool.category?.name || "");
                return (
                  <CommandItem
                    key={tool.id}
                    onSelect={() => navigate(`/tools/${tool.id}`)}
                    className="flex items-center gap-2"
                    data-testid={`command-tool-${tool.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="h-4 w-4 text-github-text-secondary" />
                    <span>{tool.name}</span>
                    <ArrowRight className="h-3 w-3 ml-auto text-github-text-secondary" />
                    <span className="text-xs text-github-text-secondary">{tool.category?.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        {/* Help & Support */}
        <CommandGroup heading="Help">
          <CommandItem
            onSelect={() => navigate("/docs")}
            className="flex items-center gap-2"
            data-testid="command-help-docs"
          >
            <BookOpen className="h-4 w-4" />
            <span>Documentation</span>
          </CommandItem>
          <CommandItem
            onSelect={() => navigate("/help")}
            className="flex items-center gap-2"
            data-testid="command-help-support"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Help & Support</span>
          </CommandItem>
          <CommandItem
            onSelect={() => navigate("/settings")}
            className="flex items-center gap-2"
            data-testid="command-help-settings"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}