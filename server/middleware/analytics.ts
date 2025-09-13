import { Request, Response, NextFunction } from "express";
import { logger } from "./error-handler";

// Analytics event types
export enum AnalyticsEventType {
  PAGE_VIEW = 'page_view',
  TOOL_VIEW = 'tool_view',
  TOOL_SEARCH = 'tool_search',
  COMPATIBILITY_CHECK = 'compatibility_check',
  MATRIX_VIEW = 'matrix_view',
  TOOL_CREATE = 'tool_create',
  TOOL_UPDATE = 'tool_update',
  TOOL_DELETE = 'tool_delete',
  COMPATIBILITY_UPDATE = 'compatibility_update',
  EXPORT_CSV = 'export_csv',
  IMPORT_CSV = 'import_csv',
  STACK_VALIDATION = 'stack_validation',
  STACK_RECOMMENDATION = 'stack_recommendation',
  MIGRATION_PATH_VIEW = 'migration_path_view',
  ERROR_OCCURRED = 'error_occurred',
  FEEDBACK_SUBMITTED = 'feedback_submitted'
}

// Analytics event interface
export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  endpoint: string;
  method: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  metadata?: Record<string, any>;
  duration?: number;
  success: boolean;
  errorMessage?: string;
}

// User interaction tracking interface
export interface UserInteraction {
  id: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  action: string;
  target: string;
  metadata?: Record<string, any>;
  page?: string;
  userAgent?: string;
  ipAddress?: string;
}

// User feedback interface
export interface UserFeedback {
  id: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  type: 'bug_report' | 'feature_request' | 'general_feedback' | 'rating';
  rating?: number; // 1-5 scale
  message?: string;
  page?: string;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

// Analytics aggregation interfaces
export interface AnalyticsAggregation {
  timeWindow: string;
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  topEvents: Array<{ type: string; count: number }>;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  errorRate: number;
  averageDuration: number;
}

export interface UsageInsights {
  totalUsers: number;
  activeUsers: number; // last 24 hours
  totalSessions: number;
  averageSessionDuration: number;
  topFeatures: Array<{ feature: string; usage: number }>;
  topTools: Array<{ toolId: string; toolName: string; views: number }>;
  searchTerms: Array<{ term: string; count: number }>;
  userFeedbackSummary: {
    totalFeedback: number;
    averageRating: number;
    feedbackByType: Record<string, number>;
  };
}

// In-memory storage for analytics (in production, use a proper analytics database)
class AnalyticsStore {
  private events: AnalyticsEvent[] = [];
  private interactions: UserInteraction[] = [];
  private feedback: UserFeedback[] = [];
  private maxStoredEvents = 10000; // Keep last 10k events in memory

  addEvent(event: AnalyticsEvent): void {
    this.events.push(event);
    if (this.events.length > this.maxStoredEvents) {
      this.events.shift();
    }
  }

  addInteraction(interaction: UserInteraction): void {
    this.interactions.push(interaction);
    if (this.interactions.length > this.maxStoredEvents) {
      this.interactions.shift();
    }
  }

  addFeedback(feedback: UserFeedback): void {
    this.feedback.push(feedback);
    if (this.feedback.length > this.maxStoredEvents) {
      this.feedback.shift();
    }
  }

  getEvents(limit: number = 1000, timeWindow?: number): AnalyticsEvent[] {
    let filteredEvents = this.events;
    
    if (timeWindow) {
      const cutoff = Date.now() - timeWindow;
      filteredEvents = this.events.filter(e => e.timestamp.getTime() > cutoff);
    }
    
    return filteredEvents.slice(-limit);
  }

  getInteractions(limit: number = 1000, timeWindow?: number): UserInteraction[] {
    let filteredInteractions = this.interactions;
    
    if (timeWindow) {
      const cutoff = Date.now() - timeWindow;
      filteredInteractions = this.interactions.filter(i => i.timestamp.getTime() > cutoff);
    }
    
    return filteredInteractions.slice(-limit);
  }

  getFeedback(limit: number = 1000): UserFeedback[] {
    return this.feedback.slice(-limit);
  }

  getAggregatedAnalytics(timeWindow: number = 86400000): AnalyticsAggregation { // 24 hours default
    const cutoff = Date.now() - timeWindow;
    const recentEvents = this.events.filter(e => e.timestamp.getTime() > cutoff);

    if (recentEvents.length === 0) {
      return {
        timeWindow: `${timeWindow / 1000}s`,
        totalEvents: 0,
        uniqueUsers: 0,
        uniqueSessions: 0,
        topEvents: [],
        topEndpoints: [],
        errorRate: 0,
        averageDuration: 0
      };
    }

    // Count unique users and sessions
    const uniqueUsers = new Set(recentEvents.filter(e => e.userId).map(e => e.userId)).size;
    const uniqueSessions = new Set(recentEvents.filter(e => e.sessionId).map(e => e.sessionId)).size;

    // Top events
    const eventCounts = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEvents = Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));

    // Top endpoints
    const endpointCounts = recentEvents.reduce((acc, event) => {
      acc[event.endpoint] = (acc[event.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEndpoints = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    // Error rate
    const errorEvents = recentEvents.filter(e => !e.success);
    const errorRate = errorEvents.length / recentEvents.length;

    // Average duration
    const eventsWithDuration = recentEvents.filter(e => e.duration !== undefined);
    const averageDuration = eventsWithDuration.length > 0
      ? eventsWithDuration.reduce((sum, e) => sum + (e.duration || 0), 0) / eventsWithDuration.length
      : 0;

    return {
      timeWindow: `${timeWindow / 1000}s`,
      totalEvents: recentEvents.length,
      uniqueUsers,
      uniqueSessions,
      topEvents,
      topEndpoints,
      errorRate,
      averageDuration
    };
  }

  getUsageInsights(): UsageInsights {
    const last24Hours = 86400000;
    const recentEvents = this.events.filter(e => e.timestamp.getTime() > Date.now() - last24Hours);
    const recentInteractions = this.interactions.filter(i => i.timestamp.getTime() > Date.now() - last24Hours);

    // User metrics
    const totalUsers = new Set(this.events.filter(e => e.userId).map(e => e.userId)).size;
    const activeUsers = new Set(recentEvents.filter(e => e.userId).map(e => e.userId)).size;
    const totalSessions = new Set(this.events.filter(e => e.sessionId).map(e => e.sessionId)).size;

    // Session duration calculation (simplified)
    const sessionDurations: Record<string, { start: number; end: number }> = {};
    this.events.forEach(event => {
      if (event.sessionId) {
        const timestamp = event.timestamp.getTime();
        if (!sessionDurations[event.sessionId]) {
          sessionDurations[event.sessionId] = { start: timestamp, end: timestamp };
        } else {
          sessionDurations[event.sessionId].end = Math.max(sessionDurations[event.sessionId].end, timestamp);
        }
      }
    });

    const averageSessionDuration = Object.values(sessionDurations).length > 0
      ? Object.values(sessionDurations).reduce((sum, session) => sum + (session.end - session.start), 0) / Object.values(sessionDurations).length
      : 0;

    // Top features
    const featureCounts = recentEvents.reduce((acc, event) => {
      const feature = this.mapEventToFeature(event.type);
      acc[feature] = (acc[feature] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topFeatures = Object.entries(featureCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([feature, usage]) => ({ feature, usage }));

    // Top tools (from tool view events)
    const toolViews = recentEvents.filter(e => e.type === AnalyticsEventType.TOOL_VIEW);
    const toolCounts = toolViews.reduce((acc, event) => {
      const toolId = event.metadata?.toolId;
      const toolName = event.metadata?.toolName || toolId;
      if (toolId) {
        const key = `${toolId}:${toolName}`;
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topTools = Object.entries(toolCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([key, views]) => {
        const [toolId, toolName] = key.split(':');
        return { toolId, toolName, views };
      });

    // Search terms
    const searchEvents = recentEvents.filter(e => e.type === AnalyticsEventType.TOOL_SEARCH);
    const searchCounts = searchEvents.reduce((acc, event) => {
      const term = event.metadata?.searchTerm;
      if (term) {
        acc[term] = (acc[term] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const searchTerms = Object.entries(searchCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([term, count]) => ({ term, count }));

    // Feedback summary
    const feedbackByType = this.feedback.reduce((acc, feedback) => {
      acc[feedback.type] = (acc[feedback.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ratingsWithValues = this.feedback.filter(f => f.rating !== undefined);
    const averageRating = ratingsWithValues.length > 0
      ? ratingsWithValues.reduce((sum, f) => sum + (f.rating || 0), 0) / ratingsWithValues.length
      : 0;

    return {
      totalUsers,
      activeUsers,
      totalSessions,
      averageSessionDuration: averageSessionDuration / 1000, // Convert to seconds
      topFeatures,
      topTools,
      searchTerms,
      userFeedbackSummary: {
        totalFeedback: this.feedback.length,
        averageRating,
        feedbackByType
      }
    };
  }

  private mapEventToFeature(eventType: AnalyticsEventType): string {
    const featureMap: Record<AnalyticsEventType, string> = {
      [AnalyticsEventType.PAGE_VIEW]: 'Navigation',
      [AnalyticsEventType.TOOL_VIEW]: 'Tool Browsing',
      [AnalyticsEventType.TOOL_SEARCH]: 'Search',
      [AnalyticsEventType.COMPATIBILITY_CHECK]: 'Compatibility Analysis',
      [AnalyticsEventType.MATRIX_VIEW]: 'Compatibility Matrix',
      [AnalyticsEventType.TOOL_CREATE]: 'Tool Management',
      [AnalyticsEventType.TOOL_UPDATE]: 'Tool Management',
      [AnalyticsEventType.TOOL_DELETE]: 'Tool Management',
      [AnalyticsEventType.COMPATIBILITY_UPDATE]: 'Compatibility Management',
      [AnalyticsEventType.EXPORT_CSV]: 'Data Export',
      [AnalyticsEventType.IMPORT_CSV]: 'Data Import',
      [AnalyticsEventType.STACK_VALIDATION]: 'Stack Analysis',
      [AnalyticsEventType.STACK_RECOMMENDATION]: 'Recommendations',
      [AnalyticsEventType.MIGRATION_PATH_VIEW]: 'Migration Planning',
      [AnalyticsEventType.ERROR_OCCURRED]: 'Error Handling',
      [AnalyticsEventType.FEEDBACK_SUBMITTED]: 'User Feedback'
    };

    return featureMap[eventType] || 'Other';
  }
}

export const analyticsStore = new AnalyticsStore();

// Analytics tracking middleware
export function analyticsTrackingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Generate session ID if not present
  if (!req.headers['x-session-id']) {
    req.sessionId = req.headers['x-session-id'] as string || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  } else {
    req.sessionId = req.headers['x-session-id'] as string;
  }

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const success = res.statusCode < 400;

    // Determine event type based on endpoint and method
    const eventType = determineEventType(req.originalUrl, req.method);

    const event: AnalyticsEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      timestamp: new Date(),
      userId: req.user?.id,
      sessionId: req.sessionId,
      requestId: req.requestId,
      endpoint: req.originalUrl || req.url,
      method: req.method,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
      referrer: req.headers['referer'],
      metadata: extractMetadata(req, res),
      duration,
      success,
      errorMessage: success ? undefined : `HTTP ${res.statusCode}`
    };

    analyticsStore.addEvent(event);

    // Log significant events
    if (!success || duration > 2000) {
      logger.info(`Analytics event: ${eventType}`, {
        endpoint: event.endpoint,
        duration: event.duration,
        success: event.success,
        userId: event.userId,
        sessionId: event.sessionId
      }, req.requestId);
    }
  });

  next();
}

// Determine event type based on endpoint and method
function determineEventType(endpoint: string, method: string): AnalyticsEventType {
  const path = endpoint.toLowerCase();

  // API endpoints
  if (path.startsWith('/api/')) {
    if (path.includes('/tools/') && method === 'GET') {
      return AnalyticsEventType.TOOL_VIEW;
    }
    if (path.includes('/tools') && method === 'GET' && path.includes('search')) {
      return AnalyticsEventType.TOOL_SEARCH;
    }
    if (path.includes('/tools') && method === 'POST') {
      return AnalyticsEventType.TOOL_CREATE;
    }
    if (path.includes('/tools') && method === 'PUT') {
      return AnalyticsEventType.TOOL_UPDATE;
    }
    if (path.includes('/tools') && method === 'DELETE') {
      return AnalyticsEventType.TOOL_DELETE;
    }
    if (path.includes('/compatibility-matrix')) {
      return AnalyticsEventType.MATRIX_VIEW;
    }
    if (path.includes('/compatibility') && method === 'PUT') {
      return AnalyticsEventType.COMPATIBILITY_UPDATE;
    }
    if (path.includes('/compatibility') && method === 'GET') {
      return AnalyticsEventType.COMPATIBILITY_CHECK;
    }
    if (path.includes('/export-csv')) {
      return AnalyticsEventType.EXPORT_CSV;
    }
    if (path.includes('/import-csv')) {
      return AnalyticsEventType.IMPORT_CSV;
    }
    if (path.includes('/stack/validate')) {
      return AnalyticsEventType.STACK_VALIDATION;
    }
    if (path.includes('/stack/recommend') || path.includes('/recommendations')) {
      return AnalyticsEventType.STACK_RECOMMENDATION;
    }
    if (path.includes('/migration-path')) {
      return AnalyticsEventType.MIGRATION_PATH_VIEW;
    }
  }

  // Default to page view for non-API requests
  return AnalyticsEventType.PAGE_VIEW;
}

// Extract metadata from request/response
function extractMetadata(req: Request, res: Response): Record<string, any> {
  const metadata: Record<string, any> = {};

  // Extract tool ID from URL params
  if (req.params.id) {
    metadata.toolId = req.params.id;
  }

  // Extract search terms from query params
  if (req.query.search || req.query.q) {
    metadata.searchTerm = req.query.search || req.query.q;
  }

  // Extract pagination info
  if (req.query.page || req.query.limit) {
    metadata.pagination = {
      page: req.query.page,
      limit: req.query.limit
    };
  }

  // Extract request body size for POST/PUT requests
  if (req.method === 'POST' || req.method === 'PUT') {
    metadata.requestBodySize = req.headers['content-length'] || 0;
  }

  // Extract response size
  const responseSize = res.get('content-length');
  if (responseSize) {
    metadata.responseSize = parseInt(responseSize, 10);
  }

  return metadata;
}

// User interaction tracking function
export function trackUserInteraction(
  action: string,
  target: string,
  metadata?: Record<string, any>,
  req?: Request
): void {
  const interaction: UserInteraction = {
    id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: req?.user?.id,
    sessionId: req?.sessionId || 'unknown',
    timestamp: new Date(),
    action,
    target,
    metadata,
    page: req?.originalUrl,
    userAgent: req?.headers['user-agent'],
    ipAddress: req?.ip || req?.connection.remoteAddress
  };

  analyticsStore.addInteraction(interaction);
}

// User feedback submission function
export function submitUserFeedback(
  type: UserFeedback['type'],
  message?: string,
  rating?: number,
  metadata?: Record<string, any>,
  req?: Request
): UserFeedback {
  const feedback: UserFeedback = {
    id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: req?.user?.id,
    sessionId: req?.sessionId,
    timestamp: new Date(),
    type,
    rating,
    message,
    page: req?.originalUrl,
    userAgent: req?.headers['user-agent'],
    ipAddress: req?.ip || req?.connection.remoteAddress,
    metadata
  };

  analyticsStore.addFeedback(feedback);
  
  logger.info(`User feedback submitted: ${type}`, {
    feedbackId: feedback.id,
    rating: feedback.rating,
    userId: feedback.userId,
    sessionId: feedback.sessionId
  });

  return feedback;
}

// Analytics data access functions
export function getAnalyticsData() {
  return {
    events: analyticsStore.getEvents(1000),
    interactions: analyticsStore.getInteractions(1000),
    feedback: analyticsStore.getFeedback(1000),
    aggregated: analyticsStore.getAggregatedAnalytics(),
    insights: analyticsStore.getUsageInsights()
  };
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
    }
  }
}