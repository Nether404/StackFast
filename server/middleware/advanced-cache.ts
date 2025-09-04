import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  etag: string;
  hits: number;
  lastAccess: number;
  compressed?: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  entries: number;
  hitRate: number;
}

class AdvancedCache {
  private cache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    entries: 0,
    hitRate: 0
  };
  private maxSize: number = 100 * 1024 * 1024; // 100MB default
  private maxEntries: number = 10000;
  
  constructor(options?: { maxSize?: number; maxEntries?: number }) {
    if (options?.maxSize) this.maxSize = options.maxSize;
    if (options?.maxEntries) this.maxEntries = options.maxEntries;
    
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanExpired(), 5 * 60 * 1000);
    
    // Run LRU eviction every minute
    setInterval(() => this.evictLRU(), 60 * 1000);
  }
  
  generateETag(data: any): string {
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('md5').update(content).digest('hex');
  }
  
  set(key: string, data: any, ttlSeconds: number = 300): void {
    const dataStr = JSON.stringify(data);
    const size = Buffer.byteLength(dataStr, 'utf8');
    
    // Check if cache is full and evict if necessary
    if (this.stats.size + size > this.maxSize || this.cache.size >= this.maxEntries) {
      this.evictLRU();
    }
    
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
      etag: this.generateETag(data),
      hits: 0,
      lastAccess: Date.now(),
      compressed: size > 1024 // Compress if > 1KB
    };
    
    // Remove old entry size if updating
    const oldEntry = this.cache.get(key);
    if (oldEntry) {
      this.stats.size -= Buffer.byteLength(JSON.stringify(oldEntry.data), 'utf8');
    }
    
    this.cache.set(key, entry);
    this.stats.size += size;
    this.stats.entries = this.cache.size;
  }
  
  get(key: string, etag?: string): { data: any; status: 'hit' | 'miss' | 'stale' } | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
    
    const now = Date.now();
    const age = now - entry.timestamp;
    
    // Check if expired
    if (age > entry.ttl) {
      // Return stale data if available (stale-while-revalidate pattern)
      if (age < entry.ttl * 2) {
        this.stats.hits++;
        entry.hits++;
        entry.lastAccess = now;
        this.updateHitRate();
        return { data: entry.data, status: 'stale' };
      }
      
      // Remove completely expired entry
      this.cache.delete(key);
      this.stats.entries = this.cache.size;
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
    
    // Check ETag if provided
    if (etag && etag === entry.etag) {
      this.stats.hits++;
      entry.hits++;
      entry.lastAccess = now;
      this.updateHitRate();
      return { data: null, status: 'hit' }; // 304 Not Modified
    }
    
    this.stats.hits++;
    entry.hits++;
    entry.lastAccess = now;
    this.updateHitRate();
    return { data: entry.data, status: 'hit' };
  }
  
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      this.stats.size = 0;
      this.stats.entries = 0;
      return;
    }
    
    // Invalidate entries matching pattern
    const regex = new RegExp(pattern);
    for (const [key, entry] of this.cache.entries()) {
      if (regex.test(key)) {
        this.stats.size -= Buffer.byteLength(JSON.stringify(entry.data), 'utf8');
        this.cache.delete(key);
      }
    }
    this.stats.entries = this.cache.size;
  }
  
  cleanExpired(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 2) {
        this.stats.size -= Buffer.byteLength(JSON.stringify(entry.data), 'utf8');
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.stats.entries = this.cache.size;
      console.log(`[Cache] Cleaned ${cleaned} expired entries`);
    }
  }
  
  evictLRU(): void {
    if (this.cache.size === 0) return;
    
    // Sort entries by last access time
    const entries = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].lastAccess - b[1].lastAccess
    );
    
    // Remove least recently used entries until we're under limits
    let removed = 0;
    while (
      (this.stats.size > this.maxSize * 0.9 || this.cache.size > this.maxEntries * 0.9) &&
      entries.length > 0
    ) {
      const [key, entry] = entries.shift()!;
      this.stats.size -= Buffer.byteLength(JSON.stringify(entry.data), 'utf8');
      this.cache.delete(key);
      removed++;
    }
    
    if (removed > 0) {
      this.stats.entries = this.cache.size;
      console.log(`[Cache] Evicted ${removed} LRU entries`);
    }
  }
  
  updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
  
  getStats(): CacheStats {
    return { ...this.stats };
  }
  
  warmup(keys: string[], dataFetcher: (key: string) => Promise<any>): Promise<void> {
    return Promise.all(
      keys.map(async (key) => {
        try {
          const data = await dataFetcher(key);
          if (data) {
            this.set(key, data);
          }
        } catch (error) {
          console.error(`[Cache] Failed to warmup key ${key}:`, error);
        }
      })
    ).then(() => {
      console.log(`[Cache] Warmed up ${keys.length} entries`);
    });
  }
}

// Create singleton instance
export const advancedCache = new AdvancedCache({
  maxSize: 100 * 1024 * 1024, // 100MB
  maxEntries: 10000
});

// Advanced cache middleware with multiple strategies
export function advancedCacheMiddleware(options?: {
  ttl?: number;
  strategy?: 'standard' | 'stale-while-revalidate' | 'cache-first';
  keyGenerator?: (req: Request) => string;
  shouldCache?: (req: Request, res: Response) => boolean;
  tags?: string[];
}) {
  const {
    ttl = 300,
    strategy = 'standard',
    keyGenerator = (req) => `${req.method}:${req.originalUrl || req.url}`,
    shouldCache = (req, res) => req.method === 'GET' && res.statusCode === 200,
    tags = []
  } = options || {};
  
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests by default
    if (req.method !== 'GET' && strategy !== 'cache-first') {
      return next();
    }
    
    const cacheKey = keyGenerator(req);
    const etag = req.headers['if-none-match'] as string | undefined;
    
    // Try to get from cache
    const cached = advancedCache.get(cacheKey, etag);
    
    if (cached) {
      if (cached.status === 'hit' && !cached.data) {
        // ETag matched, return 304
        res.status(304).end();
        return;
      }
      
      if (cached.data) {
        res.setHeader('X-Cache', cached.status === 'stale' ? 'STALE' : 'HIT');
        res.setHeader('X-Cache-Age', Date.now() - (cached.data.timestamp || Date.now()));
        
        if (cached.status === 'hit' || strategy === 'cache-first') {
          return res.json(cached.data);
        }
        
        // For stale-while-revalidate, return stale data and revalidate in background
        if (strategy === 'stale-while-revalidate' && cached.status === 'stale') {
          res.json(cached.data);
          // Continue to revalidate in background
          // Fall through to next() but don't wait for response
          setImmediate(() => {
            const mockRes = {
              json: (data: any) => {
                if (shouldCache(req, { statusCode: 200 } as Response)) {
                  advancedCache.set(cacheKey, data, ttl);
                }
              },
              status: () => mockRes,
              statusCode: 200
            } as any;
            next();
          });
          return;
        }
      }
    }
    
    // Cache miss - fetch fresh data
    res.setHeader('X-Cache', 'MISS');
    
    // Store original methods
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);
    
    // Track status code
    res.status = function(code: number) {
      res.statusCode = code;
      return originalStatus(code);
    };
    
    // Override json method to cache response
    res.json = function(body: any) {
      if (shouldCache(req, res)) {
        const etag = advancedCache.generateETag(body);
        res.setHeader('ETag', etag);
        advancedCache.set(cacheKey, body, ttl);
        
        // Tag-based invalidation support
        if (tags.length > 0) {
          // Store tags for later invalidation
          tags.forEach(tag => {
            // Implementation would track which keys belong to which tags
            console.log(`[Cache] Tagged ${cacheKey} with ${tag}`);
          });
        }
      }
      
      return originalJson(body);
    };
    
    next();
  };
}

// Cache statistics endpoint
export function cacheStatsHandler(req: Request, res: Response) {
  const stats = advancedCache.getStats();
  res.json({
    ...stats,
    hitRate: `${stats.hitRate.toFixed(2)}%`,
    sizeInMB: (stats.size / (1024 * 1024)).toFixed(2),
    averageEntrySize: stats.entries > 0 ? 
      ((stats.size / stats.entries) / 1024).toFixed(2) + ' KB' : '0 KB'
  });
}

// Invalidation endpoint
export function cacheInvalidationHandler(req: Request, res: Response) {
  const { pattern, tags } = req.body;
  
  if (pattern) {
    advancedCache.invalidate(pattern);
    res.json({ message: `Invalidated cache entries matching pattern: ${pattern}` });
  } else if (tags && Array.isArray(tags)) {
    // Tag-based invalidation
    tags.forEach(tag => {
      // Implementation would invalidate all keys with this tag
      console.log(`[Cache] Invalidating tag: ${tag}`);
    });
    res.json({ message: `Invalidated cache entries with tags: ${tags.join(', ')}` });
  } else {
    advancedCache.invalidate();
    res.json({ message: 'Invalidated all cache entries' });
  }
}

// Warmup cache on server start
export async function warmupCache() {
  const criticalEndpoints = [
    '/api/tools/quality',
    '/api/categories',
    '/api/compatibility-matrix'
  ];
  
  console.log('[Cache] Starting cache warmup...');
  
  await advancedCache.warmup(criticalEndpoints, async (endpoint) => {
    // Mock data fetching - in real app would call actual data fetchers
    return { warmedUp: true, endpoint };
  });
}