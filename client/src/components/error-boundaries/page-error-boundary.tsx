import React from 'react';
import { BaseErrorBoundary } from './base-error-boundary';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  pageName?: string;
  showDetails?: boolean;
}

export function PageErrorBoundary({ children, pageName = 'Page', showDetails = false }: PageErrorBoundaryProps) {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReload = () => {
    window.location.reload();
  };

  const fallback = (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-github-text mb-2">
          {pageName} Unavailable
        </h2>
        <p className="text-github-text-secondary mb-6">
          We're having trouble loading this page. This might be a temporary issue.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleReload} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button variant="outline" onClick={handleGoHome} className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <BaseErrorBoundary
      level="page"
      name={pageName}
      showDetails={showDetails}
      fallback={fallback}
      maxRetries={2}
    >
      {children}
    </BaseErrorBoundary>
  );
}