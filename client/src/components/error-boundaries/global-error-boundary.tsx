import React, { useEffect } from 'react';
import { BaseErrorBoundary } from './base-error-boundary';
import { setupGlobalErrorHandlers } from '@/lib/error-handler';
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

export function GlobalErrorBoundary({ children }: GlobalErrorBoundaryProps) {
  useEffect(() => {
    // Set up global error handlers when the app starts
    setupGlobalErrorHandlers();
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReportError = () => {
    // In a real app, this would open a support ticket or error reporting form
    const subject = encodeURIComponent('TechStack Explorer - Application Error');
    const body = encodeURIComponent(`
I encountered an application error while using TechStack Explorer.

Time: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Please describe what you were doing when the error occurred:
[Please describe your actions here]
    `);
    
    window.open(`mailto:support@techstack-explorer.com?subject=${subject}&body=${body}`);
  };

  const globalFallback = (
    <div className="min-h-screen bg-github-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-github-canvas border-github-border">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-3xl text-github-text mb-2">
            Application Error
          </CardTitle>
          <CardDescription className="text-lg text-github-text-secondary">
            TechStack Explorer has encountered an unexpected error and needs to restart.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>What happened?</strong> The application crashed due to an unexpected error. 
              This is likely a temporary issue that can be resolved by reloading the page.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-semibold text-github-text">What you can do:</h3>
            <div className="grid gap-3">
              <Button onClick={handleReload} className="flex items-center justify-center gap-2 w-full">
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </Button>
              <Button variant="outline" onClick={handleGoHome} className="flex items-center justify-center gap-2 w-full">
                <Home className="w-4 h-4" />
                Go to Homepage
              </Button>
            </div>
          </div>

          <div className="border-t border-github-border pt-4">
            <h3 className="font-semibold text-github-text mb-3">Still having issues?</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={handleReportError}
                className="flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Report Error
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('/docs', '_blank')}
                className="flex items-center justify-center gap-2"
              >
                <Bug className="w-4 h-4" />
                View Documentation
              </Button>
            </div>
          </div>

          <div className="text-center text-sm text-github-text-secondary">
            <p>Error ID: {Date.now().toString(36)}</p>
            <p>Time: {new Date().toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <BaseErrorBoundary
      level="page"
      name="Application"
      fallback={globalFallback}
      maxRetries={0} // Don't retry at the global level
      showDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        // Global error reporting
        console.error('Global application error:', error, errorInfo);
        
        // In production, this would send to error tracking service
        if (process.env.NODE_ENV === 'production') {
          // Example: Sentry.captureException(error, { contexts: { errorInfo } });
        }
      }}
    >
      {children}
    </BaseErrorBoundary>
  );
}