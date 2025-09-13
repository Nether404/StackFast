import React from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { BaseErrorBoundary } from './base-error-boundary';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  showRetry?: boolean;
}

export function QueryErrorBoundary({ 
  children, 
  fallbackMessage = "Failed to load data",
  showRetry = true 
}: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <BaseErrorBoundary
          level="section"
          name="Data Query"
          onError={(error) => {
            console.error('Query Error Boundary caught error:', error);
          }}
          fallback={
            <Card className="w-full border-red-200 bg-red-50/50">
              <CardContent className="p-4">
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="font-medium">Data Loading Error:</span>
                        <span className="ml-1">{fallbackMessage}</span>
                      </div>
                      {showRetry && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={reset}
                          className="border-red-300 text-red-700 hover:bg-red-100"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          }
        >
          {children}
        </BaseErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

// Specialized query error boundaries for different data types

export function ToolsQueryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorBoundary 
      fallbackMessage="Unable to load tools data. Please check your connection and try again."
    >
      {children}
    </QueryErrorBoundary>
  );
}

export function CompatibilityQueryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorBoundary 
      fallbackMessage="Unable to load compatibility data. The matrix may be temporarily unavailable."
    >
      {children}
    </QueryErrorBoundary>
  );
}

export function AnalyticsQueryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorBoundary 
      fallbackMessage="Analytics data is currently unavailable. Please try again later."
    >
      {children}
    </QueryErrorBoundary>
  );
}

// Network-aware error boundary
export function NetworkAwareErrorBoundary({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <Card className="w-full border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <Alert className="border-orange-200 bg-orange-50">
            <WifiOff className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <span className="font-medium">No Internet Connection:</span>
                  <span className="ml-1">Please check your network connection and try again.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-orange-600" />
                  <span className="text-xs">Offline</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <QueryErrorBoundary>
      {children}
    </QueryErrorBoundary>
  );
}