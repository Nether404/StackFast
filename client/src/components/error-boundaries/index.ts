export { BaseErrorBoundary, withErrorBoundary, useErrorHandler } from './base-error-boundary';
export { PageErrorBoundary } from './page-error-boundary';
export { SectionErrorBoundary } from './section-error-boundary';
export { 
  ComponentErrorBoundary,
  DataTableErrorBoundary,
  ChartErrorBoundary,
  FormErrorBoundary
} from './component-error-boundary';
export { GlobalErrorBoundary } from './global-error-boundary';
export { 
  QueryErrorBoundary,
  ToolsQueryErrorBoundary,
  CompatibilityQueryErrorBoundary,
  AnalyticsQueryErrorBoundary,
  NetworkAwareErrorBoundary
} from './query-error-boundary';

// Re-export for convenience
export type { ErrorInfo } from './base-error-boundary';