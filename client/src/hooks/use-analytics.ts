import { useCallback } from 'react';

interface TrackEventOptions {
  action: string;
  target: string;
  metadata?: Record<string, any>;
}

interface AnalyticsHook {
  trackEvent: (options: TrackEventOptions) => Promise<void>;
  trackPageView: (page: string) => Promise<void>;
  trackToolView: (toolId: string, toolName: string) => Promise<void>;
  trackSearch: (searchTerm: string, resultsCount?: number) => Promise<void>;
  trackCompatibilityCheck: (toolOneId: string, toolTwoId: string) => Promise<void>;
  trackError: (error: Error, context?: Record<string, any>) => Promise<void>;
}

export function useAnalytics(): AnalyticsHook {
  const trackEvent = useCallback(async ({ action, target, metadata }: TrackEventOptions) => {
    try {
      await fetch('/api/analytics/interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          target,
          metadata: {
            ...metadata,
            page: window.location.pathname,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          }
        }),
      });
    } catch (error) {
      // Silently fail for analytics tracking
      console.debug('Failed to track event:', error);
    }
  }, []);

  const trackPageView = useCallback(async (page: string) => {
    await trackEvent({
      action: 'page_view',
      target: page,
      metadata: {
        referrer: document.referrer,
        title: document.title
      }
    });
  }, [trackEvent]);

  const trackToolView = useCallback(async (toolId: string, toolName: string) => {
    await trackEvent({
      action: 'tool_view',
      target: `tool_${toolId}`,
      metadata: {
        toolId,
        toolName
      }
    });
  }, [trackEvent]);

  const trackSearch = useCallback(async (searchTerm: string, resultsCount?: number) => {
    await trackEvent({
      action: 'search',
      target: 'search_input',
      metadata: {
        searchTerm,
        resultsCount
      }
    });
  }, [trackEvent]);

  const trackCompatibilityCheck = useCallback(async (toolOneId: string, toolTwoId: string) => {
    await trackEvent({
      action: 'compatibility_check',
      target: 'compatibility_matrix',
      metadata: {
        toolOneId,
        toolTwoId
      }
    });
  }, [trackEvent]);

  const trackError = useCallback(async (error: Error, context?: Record<string, any>) => {
    await trackEvent({
      action: 'error_occurred',
      target: 'application',
      metadata: {
        errorMessage: error.message,
        errorStack: error.stack,
        ...context
      }
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackToolView,
    trackSearch,
    trackCompatibilityCheck,
    trackError
  };
}