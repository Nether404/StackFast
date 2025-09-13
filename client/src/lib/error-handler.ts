import { toast } from "@/hooks/use-toast";

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
  timestamp: Date;
}

export class ErrorLogger {
  private static errors: AppError[] = [];
  private static maxErrors = 100;

  static log(error: AppError) {
    this.errors.unshift(error);
    if (this.errors.length > this.maxErrors) {
      this.errors.pop();
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Error Logger]', error);
    }
  }

  static getErrors(): AppError[] {
    return [...this.errors];
  }

  static clearErrors() {
    this.errors = [];
  }
}

export function handleApiError(error: any, context?: string) {
  const appError: AppError = {
    message: error.message || 'An unexpected error occurred',
    code: error.code,
    statusCode: error.statusCode || error.status,
    details: error.details || error.response?.data,
    timestamp: new Date()
  };

  ErrorLogger.log(appError);

  // Show user-friendly error messages
  let userMessage = appError.message;
  
  if (appError.statusCode === 404) {
    userMessage = context ? `${context} not found` : 'Resource not found';
  } else if (appError.statusCode === 403) {
    userMessage = 'You don\'t have permission to perform this action';
  } else if (appError.statusCode === 401) {
    userMessage = 'Your session has expired. Please log in again';
  } else if (appError.statusCode === 500) {
    userMessage = 'Server error. Please try again later';
  } else if (appError.statusCode === 429) {
    userMessage = 'Too many requests. Please slow down';
  } else if (error.code === 'NETWORK_ERROR') {
    userMessage = 'Network error. Please check your connection';
  }

  toast({
    title: 'Error',
    description: userMessage,
    variant: 'destructive',
  });

  return appError;
}

export function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let retries = 0;

    const attempt = async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        retries++;
        
        if (retries >= maxRetries) {
          reject(error);
          return;
        }

        const delay = baseDelay * Math.pow(2, retries - 1);
        console.log(`Retrying after ${delay}ms... (attempt ${retries}/${maxRetries})`);
        
        setTimeout(attempt, delay);
      }
    };

    attempt();
  });
}

// Global error boundary handler
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    handleApiError({
      message: 'An unexpected error occurred',
      details: event.reason
    });
    event.preventDefault();
  });

  // Handle general errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    ErrorLogger.log({
      message: event.message,
      details: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      },
      timestamp: new Date()
    });
  });
}

// React Query error handler
export function queryErrorHandler(error: any) {
  // Only show error if it's not a cancelled query
  if (error?.message !== 'Query was cancelled') {
    handleApiError(error, 'Data fetch');
  }
}

// Enhanced error recovery mechanisms
export class ErrorRecoveryManager {
  private static retryAttempts = new Map<string, number>();
  private static maxRetries = 3;
  
  static canRetry(errorKey: string): boolean {
    const attempts = this.retryAttempts.get(errorKey) || 0;
    return attempts < this.maxRetries;
  }
  
  static recordRetry(errorKey: string): void {
    const attempts = this.retryAttempts.get(errorKey) || 0;
    this.retryAttempts.set(errorKey, attempts + 1);
  }
  
  static resetRetries(errorKey: string): void {
    this.retryAttempts.delete(errorKey);
  }
  
  static clearAllRetries(): void {
    this.retryAttempts.clear();
  }
}

// Graceful degradation helpers - moved to React components

// Error boundary integration
export function reportErrorToBoundary(error: Error, errorInfo?: any): void {
  ErrorLogger.log({
    message: error.message,
    code: 'BOUNDARY_ERROR',
    details: {
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      errorBoundary: errorInfo?.errorBoundary
    },
    timestamp: new Date()
  });
}

// Mutation error handler with retry
export async function mutationWithRetry<T>(
  mutationFn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    context?: string;
  }
): Promise<T> {
  try {
    return await retryWithBackoff(mutationFn, options?.maxRetries);
  } catch (error) {
    handleApiError(error, options?.context);
    throw error;
  }
}