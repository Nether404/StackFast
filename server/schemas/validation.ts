import { z } from "zod";
import { 
  insertToolSchema, 
  insertToolCategorySchema, 
  insertCompatibilitySchema 
} from "@shared/schema";

// Enhanced parameter validation schemas
export const paramSchemas = {
  id: z.object({
    id: z.string().uuid('Invalid ID format')
  }),
  
  toolId: z.object({
    id: z.string().uuid('Invalid tool ID format')
  }),
  
  compatibilityIds: z.object({
    toolOneId: z.string().uuid('Invalid tool one ID format'),
    toolTwoId: z.string().uuid('Invalid tool two ID format')
  }),
  
  compatibilityId: z.object({
    id: z.string().uuid('Invalid compatibility ID format')
  })
};

// Enhanced query validation schemas
export const querySchemas = {
  pagination: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a positive number').transform(Number).optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a positive number').transform(Number).optional(),
    offset: z.string().regex(/^\d+$/, 'Offset must be a positive number').transform(Number).optional()
  }),
  
  search: z.object({
    q: z.string().min(1, 'Query must not be empty').max(100, 'Query too long').optional(),
    query: z.string().min(1, 'Query must not be empty').max(100, 'Query too long').optional(),
    category: z.string().max(50, 'Category name too long').optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a positive number').transform(Number).optional(),
    offset: z.string().regex(/^\d+$/, 'Offset must be a positive number').transform(Number).optional()
  }),
  
  toolSearch: z.object({
    query: z.string().min(1).max(100).optional(),
    q: z.string().min(1).max(100).optional(),
    category: z.string().max(50).optional(),
    minPopularity: z.string().regex(/^\d*\.?\d+$/, 'Invalid popularity score').transform(Number).optional(),
    minMaturity: z.string().regex(/^\d*\.?\d+$/, 'Invalid maturity score').transform(Number).optional(),
    min_popularity: z.string().regex(/^\d*\.?\d+$/, 'Invalid popularity score').transform(Number).optional(),
    min_maturity: z.string().regex(/^\d*\.?\d+$/, 'Invalid maturity score').transform(Number).optional(),
    hasFreeTier: z.string().optional(),
    frameworks: z.string().optional(),
    languages: z.string().optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a positive number').transform(Number).optional(),
    summary: z.string().optional()
  })
};

// Enhanced body validation schemas
export const bodySchemas = {
  createTool: insertToolSchema.extend({
    name: z.string().min(1, 'Tool name is required').max(100, 'Tool name too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    url: z.string().url('Invalid URL format').optional().or(z.literal('')),
    frameworks: z.array(z.string().max(50)).max(20, 'Too many frameworks').optional(),
    languages: z.array(z.string().max(50)).max(20, 'Too many languages').optional(),
    features: z.array(z.string().max(100)).max(50, 'Too many features').optional(),
    integrations: z.array(z.string().max(100)).max(50, 'Too many integrations').optional(),
    maturityScore: z.number().min(0).max(100).optional(),
    popularityScore: z.number().min(0).max(100).optional(),
    pricing: z.string().max(200, 'Pricing description too long').optional(),
    notes: z.string().max(1000, 'Notes too long').optional()
  }),
  
  updateTool: insertToolSchema.partial().extend({
    name: z.string().min(1, 'Tool name is required').max(100, 'Tool name too long').optional(),
    description: z.string().max(1000, 'Description too long').optional(),
    url: z.string().url('Invalid URL format').optional().or(z.literal('')),
    frameworks: z.array(z.string().max(50)).max(20, 'Too many frameworks').optional(),
    languages: z.array(z.string().max(50)).max(20, 'Too many languages').optional(),
    features: z.array(z.string().max(100)).max(50, 'Too many features').optional(),
    integrations: z.array(z.string().max(100)).max(50, 'Too many integrations').optional(),
    maturityScore: z.number().min(0).max(100).optional(),
    popularityScore: z.number().min(0).max(100).optional(),
    pricing: z.string().max(200, 'Pricing description too long').optional(),
    notes: z.string().max(1000, 'Notes too long').optional()
  }),
  
  createCategory: insertToolCategorySchema.extend({
    name: z.string().min(1, 'Category name is required').max(100, 'Category name too long'),
    description: z.string().max(500, 'Description too long').optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional()
  }),
  
  createCompatibility: insertCompatibilitySchema.extend({
    compatibilityScore: z.number().min(0, 'Score must be at least 0').max(100, 'Score must be at most 100'),
    notes: z.string().max(1000, 'Notes too long').optional(),
    integrationDifficulty: z.enum(['easy', 'medium', 'hard'], {
      errorMap: () => ({ message: 'Integration difficulty must be easy, medium, or hard' })
    }).optional(),
    setupSteps: z.array(z.string().max(200)).max(20, 'Too many setup steps').optional(),
    codeExample: z.string().max(2000, 'Code example too long').optional(),
    dependencies: z.array(z.string().max(100)).max(20, 'Too many dependencies').optional()
  }),
  
  updateCompatibility: insertCompatibilitySchema.partial().extend({
    compatibilityScore: z.number().min(0, 'Score must be at least 0').max(100, 'Score must be at most 100').optional(),
    notes: z.string().max(1000, 'Notes too long').optional(),
    integrationDifficulty: z.enum(['easy', 'medium', 'hard'], {
      errorMap: () => ({ message: 'Integration difficulty must be easy, medium, or hard' })
    }).optional(),
    setupSteps: z.array(z.string().max(200)).max(20, 'Too many setup steps').optional(),
    codeExample: z.string().max(2000, 'Code example too long').optional(),
    dependencies: z.array(z.string().max(100)).max(20, 'Too many dependencies').optional()
  }),
  
  stackValidation: z.object({
    toolIds: z.array(z.string().uuid('Invalid tool ID format')).min(2, 'At least 2 tools required').max(20, 'Too many tools')
  }),
  
  stackRecommendations: z.object({
    toolIds: z.array(z.string().uuid('Invalid tool ID format')).max(20, 'Too many tools'),
    category: z.string().max(50, 'Category name too long').optional()
  }),
  
  toolRecommendations: z.object({
    idea: z.string().min(10, 'Project idea must be at least 10 characters').max(500, 'Project idea too long'),
    maxResults: z.number().min(1).max(20).optional(),
    avoidTools: z.array(z.string().max(100)).max(50, 'Too many tools to avoid').optional()
  }),
  
  compatibilityReport: z.object({
    tools: z.array(z.string().min(1, 'Tool name required').max(100, 'Tool name too long')).min(2, 'At least 2 tools required').max(20, 'Too many tools')
  }),
  
  stackAnalysis: z.object({
    toolIds: z.array(z.string().uuid('Invalid tool ID format')).optional(),
    toolNames: z.array(z.string().min(1).max(100)).optional()
  }).refine(data => data.toolIds || data.toolNames, {
    message: 'Either toolIds or toolNames must be provided'
  }),
  
  userFeedback: z.object({
    type: z.enum(['bug_report', 'feature_request', 'general_feedback', 'rating'], {
      errorMap: () => ({ message: 'Invalid feedback type' })
    }),
    message: z.string().max(2000, 'Feedback message too long').optional(),
    rating: z.number().min(1).max(5).optional(),
    metadata: z.record(z.any()).optional()
  }),
  
  userInteraction: z.object({
    action: z.string().min(1, 'Action is required').max(100, 'Action name too long'),
    target: z.string().min(1, 'Target is required').max(200, 'Target name too long'),
    metadata: z.record(z.any()).optional()
  })
};

// File upload validation
export const fileSchemas = {
  csvUpload: z.object({
    file: z.object({
      mimetype: z.string().refine(type => 
        ['text/csv', 'application/csv', 'text/plain'].includes(type), 
        'File must be a CSV'
      ),
      size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB')
    })
  })
};

// Security validation helpers
export const securitySchemas = {
  // Validate that strings don't contain potential script injections
  safeString: z.string().refine(
    (str) => !/<script|javascript:|data:|vbscript:/i.test(str),
    'String contains potentially dangerous content'
  ),
  
  // Validate URLs are safe
  safeUrl: z.string().url().refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    'URL must use HTTP or HTTPS protocol'
  ),
  
  // Validate JSON doesn't contain dangerous content
  safeJson: z.any().refine(
    (obj) => {
      const str = JSON.stringify(obj);
      return !/<script|javascript:|data:|vbscript:/i.test(str);
    },
    'JSON contains potentially dangerous content'
  )
};