import { Request, Response, NextFunction } from "express";

// Simple in-memory cache with TTL
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry> = new Map();
  
  set(key: string, data: any, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if cache has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  // Clean up expired entries periodically
  cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new SimpleCache();

// Clean expired entries every minute
setInterval(() => apiCache.cleanExpired(), 60000);

// Cache middleware
export function cacheMiddleware(ttlSeconds: number = 300) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const cacheKey = `${req.originalUrl || req.url}`;
    const cachedData = apiCache.get(cacheKey);
    
    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedData);
    }
    
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to cache the response
    res.json = function(body: any) {
      // Cache successful responses only
      if (res.statusCode === 200) {
        apiCache.set(cacheKey, body, ttlSeconds);
        res.setHeader('X-Cache', 'MISS');
      }
      
      return originalJson(body);
    };
    
    next();
  };
}

// Cache invalidation helper
export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    apiCache.clear();
    return;
  }
  
  // Clear specific cache entries matching pattern
  const cacheMap = (apiCache as any).cache as Map<string, CacheEntry>;
  for (const key of cacheMap.keys()) {
    if (key.includes(pattern)) {
      cacheMap.delete(key);
    }
  }
}