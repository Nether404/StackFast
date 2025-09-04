import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { CommandPalette } from "@/components/command-palette";
import { AddToolDialog } from "@/components/add-tool-dialog";
import { useState } from "react";

// Pages
import DashboardPage from "@/pages/dashboard";
import CompatibilityMatrixPage from "@/pages/compatibility-matrix";
import ToolDatabasePage from "@/pages/tool-database";
import ComparePage from "@/pages/compare";
import MigrationWizard from "@/pages/migration-wizard";
import { StackBuilder } from "@/pages/stack-builder";
import AnalyticsPage from "@/pages/analytics";
import BlueprintBuilder from "@/pages/blueprint-builder";
import DocumentationPage from "@/pages/documentation";
import NotFound from "@/pages/not-found";

function Router() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [addToolOpen, setAddToolOpen] = useState(false);

  const handleAddTool = () => {
    setAddToolOpen(true);
  };

  const handleOpenCommandPalette = () => {
    setCommandPaletteOpen(true);
  };

  return (
    <div className="min-h-screen bg-github-dark text-github-text">
      {/* Sidebar */}
      <Sidebar 
        onAddTool={handleAddTool}
        onOpenCommandPalette={handleOpenCommandPalette}
      />
      
      {/* Main Content Area */}
      <div className="lg:pl-64">
        <Header onOpenCommandPalette={handleOpenCommandPalette} />
        
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <Switch>
            {/* Main routes */}
            <Route path="/" component={DashboardPage} />
            <Route path="/quickstart">
              {/* Quickstart page - to be implemented */}
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">Quick Start Guide</h1>
                <p className="text-github-text-secondary">Get started with TechStack Explorer in minutes.</p>
              </div>
            </Route>
            <Route path="/stack-builder" component={StackBuilder} />
            <Route path="/blueprint" component={BlueprintBuilder} />
            <Route path="/tools">
              <ToolDatabasePage searchQuery="" categoryFilter="" />
            </Route>
            <Route path="/tools/:id">
              {/* Tool detail page - to be implemented */}
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">Tool Details</h1>
              </div>
            </Route>
            <Route path="/compare" component={ComparePage} />
            <Route path="/compatibility">
              <CompatibilityMatrixPage searchQuery="" />
            </Route>
            <Route path="/analytics" component={AnalyticsPage} />
            <Route path="/migration" component={MigrationWizard} />
            
            {/* Help/Support routes */}
            <Route path="/docs" component={DocumentationPage} />
            <Route path="/help">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">Help & Support</h1>
                <p className="text-github-text-secondary">Get help with TechStack Explorer.</p>
              </div>
            </Route>
            <Route path="/settings">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">Settings</h1>
                <p className="text-github-text-secondary">Configure your TechStack Explorer experience.</p>
              </div>
            </Route>
            
            {/* 404 */}
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      
      {/* Global Modals */}
      <CommandPalette 
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onAddTool={handleAddTool}
      />
      <AddToolDialog 
        open={addToolOpen} 
        onOpenChange={setAddToolOpen} 
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
