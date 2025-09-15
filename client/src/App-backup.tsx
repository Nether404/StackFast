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
import { GlobalErrorBoundary } from "@/components/error-boundaries/global-error-boundary";
import { PageErrorBoundary } from "@/components/error-boundaries/page-error-boundary";
import { SectionErrorBoundary } from "@/components/error-boundaries/section-error-boundary";
import { useState } from "react";

// Pages
import DashboardPage from "@/pages/dashboard";
import QuickStartPage from "@/pages/quickstart";
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
      <SectionErrorBoundary sectionName="Navigation Sidebar">
        <Sidebar 
          onAddTool={handleAddTool}
          onOpenCommandPalette={handleOpenCommandPalette}
        />
      </SectionErrorBoundary>
      
      {/* Main Content Area */}
      <div className="lg:pl-64">
        <SectionErrorBoundary sectionName="Header">
          <Header onOpenCommandPalette={handleOpenCommandPalette} />
        </SectionErrorBoundary>
        
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <Switch>
            {/* Main routes */}
            <Route path="/">
              <PageErrorBoundary pageName="Dashboard">
                <DashboardPage />
              </PageErrorBoundary>
            </Route>
            <Route path="/quickstart">
              <PageErrorBoundary pageName="Quick Start">
                <QuickStartPage />
              </PageErrorBoundary>
            </Route>
            <Route path="/stack-builder">
              <PageErrorBoundary pageName="Stack Builder">
                <StackBuilder />
              </PageErrorBoundary>
            </Route>
            <Route path="/blueprint">
              <PageErrorBoundary pageName="Blueprint Builder">
                <BlueprintBuilder />
              </PageErrorBoundary>
            </Route>
            <Route path="/tools">
              <PageErrorBoundary pageName="Tool Database">
                <ToolDatabasePage searchQuery="" categoryFilter="" />
              </PageErrorBoundary>
            </Route>
            <Route path="/tools/:id">
              <PageErrorBoundary pageName="Tool Details">
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-3xl font-bold mb-4">Tool Details</h1>
                </div>
              </PageErrorBoundary>
            </Route>
            <Route path="/compare">
              <PageErrorBoundary pageName="Tool Comparison">
                <ComparePage />
              </PageErrorBoundary>
            </Route>
            <Route path="/compatibility">
              <PageErrorBoundary pageName="Compatibility Matrix">
                <CompatibilityMatrixPage searchQuery="" />
              </PageErrorBoundary>
            </Route>
            <Route path="/analytics">
              <PageErrorBoundary pageName="Analytics">
                <AnalyticsPage />
              </PageErrorBoundary>
            </Route>
            <Route path="/migration">
              <PageErrorBoundary pageName="Migration Wizard">
                <MigrationWizard />
              </PageErrorBoundary>
            </Route>
            
            {/* Help/Support routes */}
            <Route path="/docs">
              <PageErrorBoundary pageName="Documentation">
                <DocumentationPage />
              </PageErrorBoundary>
            </Route>
            <Route path="/help">
              <PageErrorBoundary pageName="Help & Support">
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-3xl font-bold mb-4">Help & Support</h1>
                  <p className="text-github-text-secondary">Get help with TechStack Explorer.</p>
                </div>
              </PageErrorBoundary>
            </Route>
            <Route path="/settings">
              <PageErrorBoundary pageName="Settings">
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-3xl font-bold mb-4">Settings</h1>
                  <p className="text-github-text-secondary">Configure your TechStack Explorer experience.</p>
                </div>
              </PageErrorBoundary>
            </Route>
            
            {/* 404 */}
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      
      {/* Global Modals */}
      <SectionErrorBoundary sectionName="Command Palette">
        <CommandPalette 
          open={commandPaletteOpen}
          onOpenChange={setCommandPaletteOpen}
          onAddTool={handleAddTool}
        />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="Add Tool Dialog">
        <AddToolDialog 
          open={addToolOpen} 
          onOpenChange={setAddToolOpen} 
        />
      </SectionErrorBoundary>
    </div>
  );
}

function App() {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
