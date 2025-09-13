import React from 'react';
import { BaseErrorBoundary } from './base-error-boundary';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';

interface ComponentErrorBoundaryProps {
  children: React.ReactNode;
  componentName?: string;
  inline?: boolean;
  dismissible?: boolean;
  fallbackComponent?: React.ReactNode;
  onDismiss?: () => void;
}

export function ComponentErrorBoundary({ 
  children, 
  componentName = 'Component',
  inline = false,
  dismissible = false,
  fallbackComponent,
  onDismiss
}: ComponentErrorBoundaryProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) {
    return fallbackComponent || null;
  }

  const inlineFallback = (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
      <AlertTriangle className="w-3 h-3" />
      <span>Error in {componentName}</span>
    </div>
  );

  const blockFallback = (
    <Alert className="border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800 flex items-center justify-between">
        <div className="flex-1">
          <span className="font-medium">{componentName} Error:</span>
          <span className="ml-1">This component failed to load properly.</span>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <Button size="sm" variant="outline" className="h-6 px-2 text-xs border-red-300 text-red-700 hover:bg-red-100">
            <RefreshCw className="w-3 h-3" />
          </Button>
          {dismissible && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleDismiss}
              className="h-6 w-6 p-0 text-red-700 hover:bg-red-100"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );

  return (
    <BaseErrorBoundary
      level="component"
      name={componentName}
      fallback={inline ? inlineFallback : blockFallback}
      maxRetries={2}
    >
      {children}
    </BaseErrorBoundary>
  );
}

// Specialized component error boundaries for common use cases

export function DataTableErrorBoundary({ children }: { children: React.ReactNode }) {
  const fallback = (
    <div className="w-full p-8 text-center border border-red-200 rounded bg-red-50">
      <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
      <h3 className="font-medium text-red-800 mb-1">Table Error</h3>
      <p className="text-sm text-red-700 mb-3">
        Unable to display table data. Please try refreshing the page.
      </p>
      <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
        <RefreshCw className="w-3 h-3 mr-1" />
        Retry
      </Button>
    </div>
  );

  return (
    <BaseErrorBoundary
      level="component"
      name="Data Table"
      fallback={fallback}
      maxRetries={2}
    >
      {children}
    </BaseErrorBoundary>
  );
}

export function ChartErrorBoundary({ children }: { children: React.ReactNode }) {
  const fallback = (
    <div className="w-full h-64 flex items-center justify-center border border-red-200 rounded bg-red-50">
      <div className="text-center">
        <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
        <p className="text-sm text-red-700">Chart unavailable</p>
        <Button size="sm" variant="outline" className="mt-2 border-red-300 text-red-700 hover:bg-red-100">
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </Button>
      </div>
    </div>
  );

  return (
    <BaseErrorBoundary
      level="component"
      name="Chart"
      fallback={fallback}
      maxRetries={2}
    >
      {children}
    </BaseErrorBoundary>
  );
}

export function FormErrorBoundary({ children }: { children: React.ReactNode }) {
  const fallback = (
    <Alert className="border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">Form Error:</span>
            <span className="ml-1">Unable to load form. Please refresh the page.</span>
          </div>
          <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );

  return (
    <BaseErrorBoundary
      level="component"
      name="Form"
      fallback={fallback}
      maxRetries={1}
    >
      {children}
    </BaseErrorBoundary>
  );
}