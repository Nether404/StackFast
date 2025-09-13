import React from 'react';
import { BaseErrorBoundary } from './base-error-boundary';
import { AlertTriangle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';

interface SectionErrorBoundaryProps {
  children: React.ReactNode;
  sectionName?: string;
  fallbackMessage?: string;
  showRetry?: boolean;
  gracefulDegradation?: React.ReactNode;
}

export function SectionErrorBoundary({ 
  children, 
  sectionName = 'Section', 
  fallbackMessage,
  showRetry = true,
  gracefulDegradation
}: SectionErrorBoundaryProps) {
  const [showGracefulFallback, setShowGracefulFallback] = useState(false);

  const fallback = (
    <Card className="w-full border-red-200 bg-red-50/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-red-800">
              {sectionName} temporarily unavailable
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {fallbackMessage || `We're having trouble loading the ${sectionName.toLowerCase()}. You can try refreshing or continue using other features.`}
            </p>
            
            <div className="flex flex-wrap gap-2 mt-3">
              {showRetry && (
                <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              )}
              
              {gracefulDegradation && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowGracefulFallback(!showGracefulFallback)}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  {showGracefulFallback ? (
                    <>
                      <EyeOff className="w-3 h-3 mr-1" />
                      Hide Alternative
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 mr-1" />
                      Show Alternative
                    </>
                  )}
                </Button>
              )}
            </div>

            {showGracefulFallback && gracefulDegradation && (
              <div className="mt-4 p-3 bg-white rounded border border-red-200">
                <div className="text-xs text-red-600 mb-2 font-medium">
                  Alternative View:
                </div>
                {gracefulDegradation}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <BaseErrorBoundary
      level="section"
      name={sectionName}
      fallback={fallback}
      maxRetries={3}
    >
      {children}
    </BaseErrorBoundary>
  );
}