import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Layers,
  Sparkles,
  Database,
  GitCompare,
  Grid3x3,
  BarChart3,
  ChevronRight,
  Menu,
  X,
  Command,
  Settings,
  HelpCircle,
  Plus,
  Zap,
  BookOpen,
  Cpu,
} from "lucide-react";

interface SidebarProps {
  onAddTool: () => void;
  onOpenCommandPalette: () => void;
}

const navigation = [
  {
    title: "Getting Started",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: Home,
        description: "Overview and quick actions",
        badge: null,
      },
      {
        name: "Quick Start",
        href: "/quickstart",
        icon: Zap,
        description: "Start building in seconds",
        badge: "New",
      },
    ],
  },
  {
    title: "Build",
    items: [
      {
        name: "Stack Builder",
        href: "/stack-builder",
        icon: Layers,
        description: "Build your tech stack",
        badge: null,
      },
      {
        name: "AI Blueprint",
        href: "/blueprint",
        icon: Sparkles,
        description: "Generate with AI",
        badge: "AI",
      },
    ],
  },
  {
    title: "Explore",
    items: [
      {
        name: "Tool Database",
        href: "/tools",
        icon: Database,
        description: "Browse all tools",
        badge: null,
      },
      {
        name: "Compare",
        href: "/compare",
        icon: GitCompare,
        description: "Compare tools side-by-side",
        badge: null,
      },
      {
        name: "Compatibility",
        href: "/compatibility",
        icon: Grid3x3,
        description: "View compatibility matrix",
        badge: null,
      },
    ],
  },
  {
    title: "Insights",
    items: [
      {
        name: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        description: "Trends and statistics",
        badge: null,
      },
    ],
  },
];

const bottomNavigation = [
  {
    name: "Documentation",
    href: "/docs",
    icon: BookOpen,
  },
  {
    name: "Help",
    href: "/help",
    icon: HelpCircle,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({ onAddTool, onOpenCommandPalette }: SidebarProps) {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return location === href;
    return location.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-github-surface border border-github-border hover:bg-github-border transition-colors"
        data-testid="button-mobile-menu"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-github-surface border-r border-github-border transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-github-border">
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-neon-orange rounded-lg flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-github-text">TechStack</span>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block p-1.5 rounded-md hover:bg-github-border transition-colors"
              data-testid="button-collapse-sidebar"
            >
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform",
                  isCollapsed ? "" : "rotate-180"
                )}
              />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="px-3 py-4 space-y-2">
            <Button
              onClick={onAddTool}
              className="w-full bg-neon-orange hover:bg-neon-orange/90 justify-start"
              size="sm"
              data-testid="sidebar-button-add-tool"
            >
              <Plus className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">Add Tool</span>}
            </Button>
            <Button
              onClick={onOpenCommandPalette}
              variant="outline"
              className="w-full justify-start border-github-border hover:bg-github-border"
              size="sm"
              data-testid="sidebar-button-command"
            >
              <Command className="h-4 w-4" />
              {!isCollapsed && (
                <>
                  <span className="ml-2 flex-1 text-left">Quick Search</span>
                  <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-github-border bg-github-dark px-1.5 text-[10px] font-medium text-github-text-secondary">
                    ⌘K
                  </kbd>
                </>
              )}
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3">
            <div className="space-y-6 pb-4">
              {navigation.map((group) => (
                <div key={group.title}>
                  {!isCollapsed && (
                    <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-github-text-secondary">
                      {group.title}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link key={item.name} href={item.href}>
                          <button
                            className={cn(
                              "w-full flex items-center rounded-lg px-2 py-2 text-sm transition-colors group",
                              active
                                ? "bg-github-dark text-neon-orange"
                                : "text-github-text-secondary hover:bg-github-dark hover:text-github-text"
                            )}
                            onClick={() => setIsMobileOpen(false)}
                            data-testid={`sidebar-nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Icon className={cn("h-4 w-4 flex-shrink-0", active && "text-neon-orange")} />
                            {!isCollapsed && (
                              <>
                                <div className="ml-3 flex-1 text-left">
                                  <div className="flex items-center gap-2">
                                    <span>{item.name}</span>
                                    {item.badge && (
                                      <Badge
                                        variant="secondary"
                                        className={cn(
                                          "h-5 text-[10px]",
                                          item.badge === "AI" && "bg-purple-600/20 text-purple-400 border-purple-600/30",
                                          item.badge === "New" && "bg-green-600/20 text-green-400 border-green-600/30"
                                        )}
                                      >
                                        {item.badge}
                                      </Badge>
                                    )}
                                  </div>
                                  {!active && (
                                    <p className="text-xs text-github-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </>
                            )}
                          </button>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Bottom Navigation */}
          <div className="border-t border-github-border p-3 space-y-1">
            {bottomNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <button
                    className="w-full flex items-center rounded-lg px-2 py-2 text-sm text-github-text-secondary hover:bg-github-dark hover:text-github-text transition-colors"
                    data-testid={`sidebar-bottom-${item.name.toLowerCase()}`}
                  >
                    <Icon className="h-4 w-4" />
                    {!isCollapsed && <span className="ml-3">{item.name}</span>}
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}