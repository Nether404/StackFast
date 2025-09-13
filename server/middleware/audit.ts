import { Request, Response, NextFunction } from "express";
import { logger } from "./error-handler";

// Audit log entry interface
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
  changes?: Record<string, any>;
  previousValues?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
  duration?: number;
  requestId: string;
}

// In-memory audit log storage (in production, this should be a database)
const auditLogs: AuditLogEntry[] = [];
const MAX_AUDIT_LOGS = 10000; // Keep last 10k entries in memory

// Generate audit log ID
function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create audit log entry
export function createAuditLog(
  req: Request,
  action: string,
  resource: string,
  resourceId?: string,
  changes?: Record<string, any>,
  previousValues?: Record<string, any>
): AuditLogEntry {
  return {
    id: generateAuditId(),
    timestamp: new Date(),
    userId: (req as any).userId, // Will be set by auth middleware if implemented
    sessionId: (req as any).sessionId,
    action,
    resource,
    resourceId,
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    changes,
    previousValues,
    success: true,
    requestId: req.requestId || 'unknown'
  };
}

// Log audit entry
export function logAuditEntry(entry: AuditLogEntry): void {
  // Add to in-memory storage
  auditLogs.push(entry);
  
  // Keep only the last MAX_AUDIT_LOGS entries
  if (auditLogs.length > MAX_AUDIT_LOGS) {
    auditLogs.splice(0, auditLogs.length - MAX_AUDIT_LOGS);
  }
  
  // Log to structured logger
  logger.info('Audit log entry', {
    auditId: entry.id,
    action: entry.action,
    resource: entry.resource,
    resourceId: entry.resourceId,
    userId: entry.userId,
    ip: entry.ip,
    success: entry.success,
    changes: entry.changes ? Object.keys(entry.changes) : undefined
  }, entry.requestId);
}

// Audit middleware for tracking operations
export function auditMiddleware(
  action: string,
  resource: string,
  options: {
    captureBody?: boolean;
    captureResponse?: boolean;
    resourceIdFromParams?: string;
    resourceIdFromBody?: string;
  } = {}
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Capture original response methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    
    let responseData: any;
    let auditEntry: AuditLogEntry;
    
    // Override response methods to capture data
    res.json = function(body: any) {
      responseData = body;
      return originalJson(body);
    };
    
    res.send = function(body: any) {
      if (!responseData) {
        responseData = body;
      }
      return originalSend(body);
    };
    
    // Create initial audit entry
    const resourceId = options.resourceIdFromParams ? req.params[options.resourceIdFromParams] :
                      options.resourceIdFromBody ? req.body?.[options.resourceIdFromBody] :
                      undefined;
    
    auditEntry = createAuditLog(
      req,
      action,
      resource,
      resourceId,
      options.captureBody ? req.body : undefined
    );
    
    // Handle response completion
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      auditEntry.duration = duration;
      auditEntry.success = res.statusCode < 400;
      
      if (!auditEntry.success) {
        auditEntry.errorMessage = `HTTP ${res.statusCode}`;
      }
      
      // Capture response data if requested
      if (options.captureResponse && responseData) {
        auditEntry.changes = {
          ...auditEntry.changes,
          response: responseData
        };
      }
      
      logAuditEntry(auditEntry);
    });
    
    // Handle errors
    res.on('error', (error) => {
      auditEntry.success = false;
      auditEntry.errorMessage = error.message;
      auditEntry.duration = Date.now() - startTime;
      
      logAuditEntry(auditEntry);
    });
    
    next();
  };
}

// Get audit logs (for admin endpoints)
export function getAuditLogs(filters: {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
} = {}): { logs: AuditLogEntry[]; total: number } {
  let filteredLogs = [...auditLogs];
  
  // Apply filters
  if (filters.userId) {
    filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
  }
  
  if (filters.action) {
    filteredLogs = filteredLogs.filter(log => log.action === filters.action);
  }
  
  if (filters.resource) {
    filteredLogs = filteredLogs.filter(log => log.resource === filters.resource);
  }
  
  if (filters.startDate) {
    filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
  }
  
  if (filters.endDate) {
    filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
  }
  
  // Sort by timestamp (newest first)
  filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  const total = filteredLogs.length;
  
  // Apply pagination
  const offset = filters.offset || 0;
  const limit = filters.limit || 100;
  
  filteredLogs = filteredLogs.slice(offset, offset + limit);
  
  return { logs: filteredLogs, total };
}

// Security event logging
export function logSecurityEvent(
  req: Request,
  eventType: 'RATE_LIMIT_EXCEEDED' | 'VALIDATION_FAILED' | 'SUSPICIOUS_ACTIVITY' | 'ACCESS_DENIED',
  details: Record<string, any> = {}
): void {
  const securityEvent = {
    id: generateAuditId(),
    timestamp: new Date(),
    eventType,
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    path: req.path,
    method: req.method,
    details,
    requestId: req.requestId || 'unknown'
  };
  
  logger.warn('Security event', securityEvent, req.requestId);
  
  // In production, this should also be sent to a security monitoring system
}

// Middleware to track failed requests for security monitoring
export function securityMonitoringMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);
  
  res.json = function(body: any) {
    // Log security events for failed requests
    if (res.statusCode >= 400) {
      const eventType = res.statusCode === 429 ? 'RATE_LIMIT_EXCEEDED' :
                       res.statusCode === 400 ? 'VALIDATION_FAILED' :
                       res.statusCode === 403 ? 'ACCESS_DENIED' :
                       'SUSPICIOUS_ACTIVITY';
      
      logSecurityEvent(req, eventType, {
        statusCode: res.statusCode,
        response: body,
        headers: req.headers
      });
    }
    
    return originalJson(body);
  };
  
  next();
}

// Export audit logs for external systems (admin only)
export function exportAuditLogs(format: 'json' | 'csv' = 'json'): string {
  const logs = auditLogs.slice(-1000); // Last 1000 entries
  
  if (format === 'csv') {
    const headers = [
      'id', 'timestamp', 'userId', 'action', 'resource', 'resourceId',
      'method', 'path', 'ip', 'userAgent', 'success', 'duration', 'errorMessage'
    ];
    
    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        log.timestamp.toISOString(),
        log.userId || '',
        log.action,
        log.resource,
        log.resourceId || '',
        log.method,
        log.path,
        log.ip,
        `"${log.userAgent}"`,
        log.success,
        log.duration || '',
        log.errorMessage || ''
      ].join(','))
    ];
    
    return csvRows.join('\n');
  }
  
  return JSON.stringify(logs, null, 2);
}