import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage?: number;
  prevPage?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links: {
    first: string;
    last: string;
    next?: string;
    prev?: string;
  };
}

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(50),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc')
});

/**
 * Middleware to parse and validate pagination parameters
 */
export function paginationMiddleware(defaultLimit: number = 50, maxLimit: number = 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = paginationSchema.extend({
        limit: z.coerce.number().min(1).max(maxLimit).default(defaultLimit)
      });

      const parsed = schema.parse(req.query);
      
      const pagination: PaginationParams = {
        page: parsed.page,
        limit: parsed.limit,
        offset: (parsed.page - 1) * parsed.limit
      };

      // Add pagination info to request
      (req as any).pagination = pagination;
      (req as any).sort = parsed.sort;
      (req as any).order = parsed.order;

      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Invalid pagination parameters',
        details: error instanceof z.ZodError ? error.errors : undefined
      });
    }
  };
}

/**
 * Helper function to create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  pagination: PaginationParams,
  baseUrl: string,
  additionalParams: Record<string, any> = {}
): PaginatedResponse<T> {
  const { page, limit } = pagination;
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  // Build query string for links
  const buildUrl = (pageNum: number) => {
    const params = new URLSearchParams({
      page: pageNum.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(additionalParams).map(([key, value]) => [key, String(value)])
      )
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const meta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : undefined,
    prevPage: hasPrev ? page - 1 : undefined
  };

  const links = {
    first: buildUrl(1),
    last: buildUrl(totalPages),
    next: hasNext ? buildUrl(page + 1) : undefined,
    prev: hasPrev ? buildUrl(page - 1) : undefined
  };

  return {
    data,
    meta,
    links
  };
}

/**
 * Helper function to apply pagination to array data
 */
export function paginateArray<T>(
  data: T[],
  pagination: PaginationParams
): { items: T[]; total: number } {
  const { offset, limit } = pagination;
  const total = data.length;
  const items = data.slice(offset, offset + limit);
  
  return { items, total };
}

/**
 * Middleware to add pagination helpers to response object
 */
export function paginationHelpers() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add helper method to response object
    (res as any).paginate = function<T>(
      data: T[],
      total: number,
      baseUrl?: string
    ): Response {
      const pagination = (req as any).pagination as PaginationParams;
      if (!pagination) {
        throw new Error('Pagination middleware must be used before paginationHelpers');
      }

      const url = baseUrl || `${req.protocol}://${req.get('host')}${req.path}`;
      const additionalParams: Record<string, any> = {};
      
      // Include sort and order if present
      if ((req as any).sort) additionalParams.sort = (req as any).sort;
      if ((req as any).order) additionalParams.order = (req as any).order;
      
      // Include other query parameters (excluding pagination ones)
      Object.entries(req.query).forEach(([key, value]) => {
        if (!['page', 'limit', 'sort', 'order'].includes(key)) {
          additionalParams[key] = value;
        }
      });

      const paginatedResponse = createPaginatedResponse(
        data,
        total,
        pagination,
        url,
        additionalParams
      );

      return this.json({
        success: true,
        ...paginatedResponse
      });
    };

    next();
  };
}

/**
 * Utility function to calculate pagination info without creating full response
 */
export function calculatePagination(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : undefined,
    prevPage: hasPrev ? page - 1 : undefined
  };
}

/**
 * Helper to validate and normalize sort parameters
 */
export function validateSortParams(
  sort: string | undefined,
  allowedFields: string[],
  defaultSort: string = 'id'
): { field: string; isValid: boolean } {
  if (!sort) {
    return { field: defaultSort, isValid: true };
  }

  const isValid = allowedFields.includes(sort);
  return {
    field: isValid ? sort : defaultSort,
    isValid
  };
}

/**
 * SQL helper for applying pagination to database queries
 */
export function applySqlPagination(pagination: PaginationParams) {
  return {
    limit: pagination.limit,
    offset: pagination.offset
  };
}

/**
 * Helper for cursor-based pagination (for large datasets)
 */
export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
  direction: 'forward' | 'backward';
}

export function parseCursorPagination(req: Request, defaultLimit: number = 50): CursorPaginationParams {
  const cursor = req.query.cursor as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || defaultLimit, 1000);
  const direction = (req.query.direction as string) === 'backward' ? 'backward' : 'forward';

  return { cursor, limit, direction };
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: {
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}