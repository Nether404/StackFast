import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ErrorLogger } from '@/lib/error-handler';

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  maxRetries?: number;
  level?: 'page' | 'section' | 'component';
  name?: string;
}

export class BaseErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, name = 'Unknown' } = this.props;
    
    // Log error to our error tracking system
    ErrorLogger.log({
      message: `Error in ${name}: ${error.message}`,
      code: 'REACT_ERROR_BOUNDARY',
      details: {
        componentStack: errorInfo.componentStack,
        errorBoundary: name,
        stack: error.stack,
        retryCount: this.state.retryCount
      },
      timestamp: new Date()
    });

    // Update state with error info
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary: ${name}`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    const { name } = this.props;
    
    // Create error report
    const errorReport = {
      id: errorId,
      boundary: name,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // In a real app, this would send to an error reporting service
    console.log('Error Report:', errorReport);
    
    // Copy to clipboard for now
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
    alert('Error report copied to clipboard');
  };

  render() {
    const { hasError, error, errorInfo, retryCount } = this.state;
    const { children, fallback, showDetails = false, maxRetries = 3, level = 'component', name = 'Component' } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Different UI based on error boundary level
      if (level === 'page') {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-github-dark">
            <Card className="w-full max-w-2xl bg-github-canvas border-github-border">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl text-github-text">Something went wrong</CardTitle>
                <CardDescription className="text-github-text-secondary">
                  We encountered an unexpected error while loading this page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Error:</strong> {error.message}
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {retryCount < maxRetries && (
                    <Button onClick={this.handleRetry} className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Try Again ({maxRetries - retryCount} attempts left)
                    </Button>
                  )}
                  <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Go Home
                  </Button>
                  <Button variant="outline" onClick={this.handleReload} className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Reload Page
                  </Button>
                </div>

                {showDetails && errorInfo && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-github-text-secondary hover:text-github-text">
                      Technical Details
                    </summary>
                    <div className="mt-2 p-3 bg-github-canvas-subtle rounded border text-xs font-mono">
                      <div className="mb-2">
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-github-text-secondary">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                      {error.stack && (
                        <div>
                          <strong>Error Stack:</strong>
                          <pre className="mt-1 whitespace-pre-wrap text-github-text-secondary">
                            {error.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                <div className="text-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={this.handleReportError}
                    className="text-github-text-secondary hover:text-github-text"
                  >
                    <Bug className="w-4 h-4 mr-2" />
                    Report Error
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      if (level === 'section') {
        return (
          <Card className="w-full bg-github-canvas border-github-border border-red-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-github-text">Error in {name}</h3>
                  <p className="text-sm text-github-text-secondary mt-1">
                    {error.message}
                  </p>
                  <div className="flex gap-2 mt-3">
                    {retryCount < maxRetries && (
                      <Button size="sm" onClick={this.handleRetry}>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Retry
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={this.handleReload}>
                      Reload
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }

      // Component level - minimal UI
      return (
        <div className="p-4 border border-red-200 rounded bg-red-50 text-red-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Error in {name}</span>
          </div>
          <p className="text-xs mt-1 text-red-600">{error.message}</p>
          {retryCount < maxRetries && (
            <Button size="sm" variant="outline" onClick={this.handleRetry} className="mt-2">
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      );
    }

    return children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <BaseErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </BaseErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for error boundary context
export function useErrorHandler() {
  return {
    reportError: (error: Error, context?: string) => {
      ErrorLogger.log({
        message: error.message,
        code: 'MANUAL_ERROR_REPORT',
        details: { context, stack: error.stack },
        timestamp: new Date()
      });
    }
  };
}