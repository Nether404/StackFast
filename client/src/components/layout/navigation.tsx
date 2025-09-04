import { Home, Database, GitCompare, BarChart3, Package, Grid3x3, Sparkles, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationTabs = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
  },
  {
    id: "stack-builder",
    label: "Stack Builder",
    icon: Package,
  },
  {
    id: "blueprint",
    label: "Blueprint Builder",
    icon: Sparkles,
  },
  {
    id: "compare",
    label: "Compare Tools",
    icon: GitCompare,
  },
  {
    id: "database",
    label: "Tool Database",
    icon: Database,
  },
  {
    id: "matrix",
    label: "Compatibility Matrix",
    icon: Grid3x3,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    id: "migration",
    label: "Migration Wizard",
    icon: ArrowRightLeft,
  },
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <div className="mb-6">
      <nav className="flex space-x-1 bg-github-surface rounded-lg p-1">
        {navigationTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "category-tab flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "active text-white"
                  : "text-github-text-secondary hover:text-github-text"
              )}
              data-testid={`tab-${tab.id}`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
