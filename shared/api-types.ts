/**
 * Comprehensive API response types for type safety
 */

import type { 
  Tool, 
  ToolWithCategory, 
  ToolCategory, 
  Compatibility, 
  CompatibilityMatrix,
  StackTemplate,
  MigrationPath
} from "./schema";

// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

// Paginated response structure
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Tools API responses
export interface ToolsResponse extends ApiResponse<ToolWithCategory[]> {}
export interface ToolResponse extends ApiResponse<ToolWithCategory> {}
export interface PaginatedToolsResponse extends ApiResponse<PaginatedResponse<ToolWithCategory>> {}

// Categories API responses
export interface CategoriesResponse extends ApiResponse<ToolCategory[]> {}
export interface CategoryResponse extends ApiResponse<ToolCategory> {}

// Compatibility API responses
export interface CompatibilityMatrixResponse extends ApiResponse<CompatibilityMatrix[]> {}
export interface CompatibilityResponse extends ApiResponse<Compatibility> {}

// Stack templates API responses
export interface StackTemplatesResponse extends ApiResponse<StackTemplate[]> {}
export interface StackTemplateResponse extends ApiResponse<StackTemplate> {}

// Migration paths API responses
export interface MigrationPathsResponse extends ApiResponse<MigrationPath[]> {}
export interface MigrationPathResponse extends ApiResponse<MigrationPath> {}

// Analytics API responses
export interface AnalyticsResponse extends ApiResponse<{
  totalTools: number;
  totalCategories: number;
  totalCompatibilities: number;
  averageCompatibilityScore: number;
  topCategories: Array<{
    name: string;
    count: number;
  }>;
  recentlyAdded: ToolWithCategory[];
}> {}

// Health check response
export interface HealthResponse extends ApiResponse<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  database: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
  };
  cache: {
    status: 'active' | 'inactive';
    hitRate?: number;
  };
}> {}

// Rate limit status response
export interface RateLimitResponse extends ApiResponse<{
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}> {}

// Export data response
export interface ExportResponse extends ApiResponse<string> {}

// Audit logs response
export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId: string;
  changes: Record<string, any>;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

export interface AuditLogsResponse extends ApiResponse<PaginatedResponse<AuditLog>> {}

// Search and filter types
export interface SearchParams {
  query?: string;
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'popularity' | 'maturity' | 'recent';
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  minPopularity?: number;
  minMaturity?: number;
  hasFreeTier?: boolean;
  hasIntegrations?: boolean;
  languages?: string[];
  frameworks?: string[];
}

// Request body types
export interface CreateToolRequest {
  name: string;
  description?: string;
  categoryId: string;
  url?: string;
  frameworks?: string[];
  languages?: string[];
  features?: string[];
  integrations?: string[];
  maturityScore: number;
  popularityScore: number;
  pricing?: string;
  notes?: string;
}

export interface UpdateToolRequest extends Partial<CreateToolRequest> {}

export interface CreateCompatibilityRequest {
  toolOneId: string;
  toolTwoId: string;
  compatibilityScore: number;
  notes?: string;
  verifiedIntegration?: boolean;
  integrationDifficulty?: 'easy' | 'medium' | 'hard';
  setupSteps?: string[];
  codeExample?: string;
  dependencies?: string[];
}

export interface UpdateCompatibilityRequest extends Partial<CreateCompatibilityRequest> {}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

// Utility types for better type safety
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiEndpoint<TResponse = any, TRequest = any> {
  method: ApiMethod;
  path: string;
  response: TResponse;
  request?: TRequest;
}

// Common error types
export type ApiError = {
  code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'INTERNAL_ERROR' | 'RATE_LIMITED';
  message: string;
  details?: any;
};

// Type guards for runtime type checking
export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return typeof obj === 'object' && obj !== null && typeof obj.success === 'boolean';
}

export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined;
}

export function isErrorResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: false; error: ApiError } {
  return response.success === false && response.error !== undefined;
}