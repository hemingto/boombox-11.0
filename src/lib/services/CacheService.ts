/**
 * @fileoverview In-memory cache service for availability data
 * @source New caching layer for performance optimization
 * @refactor Memory-based cache with TTL and invalidation support
 */

import { CachedAvailabilityData } from '@/types/availability.types';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

interface CacheConfig {
  defaultTtl: number; // Default TTL in seconds
  maxSize: number;    // Maximum number of cache entries
  cleanupInterval: number; // Cleanup interval in seconds
}

class CacheService {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTtl: 300, // 5 minutes default
      maxSize: 1000,   // 1000 entries max
      cleanupInterval: 60, // Clean up every minute
      ...config
    };

    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now > entry.timestamp + (entry.ttl * 1000)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const now = Date.now();
    const effectiveTtl = ttl || this.config.defaultTtl;

    // Remove oldest entries if at max size
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: effectiveTtl,
      key
    });
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let deletedCount = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Check if key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Math.floor((now - entry.timestamp) / 1000),
      ttl: entry.ttl
    }));

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // TODO: Implement hit rate tracking
      entries
    };
  }

  /**
   * Evict oldest entries to make room
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + (entry.ttl * 1000)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
    }

    if (expiredKeys.length > 0) {
      console.log(`[CacheService] Cleaned up ${expiredKeys.length} expired entries`);
    }
  }

  /**
   * Start periodic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, this.config.cleanupInterval * 1000);
  }

  /**
   * Stop cleanup timer (for testing or shutdown)
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Destroy cache service
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.cache.clear();
  }
}

// Cache TTL configurations for different data types
export const CACHE_TTL = {
  MONTHLY_AVAILABILITY: 300,    // 5 minutes
  DAILY_AVAILABILITY: 60,       // 1 minute (more volatile)
  RESOURCE_AVAILABILITY: 900,   // 15 minutes
  BUSINESS_CONFIG: 3600,        // 1 hour
} as const;

// Singleton cache instance
export const cacheService = new CacheService({
  defaultTtl: 300,
  maxSize: 1000,
  cleanupInterval: 60
});

// Cache invalidation helper
export class CacheInvalidationService {
  /**
   * Invalidate cache when a booking is created/modified
   */
  static async invalidateBookingCache(date: string): Promise<void> {
    // Clear specific date cache
    await cacheService.deletePattern(`availability:daily:*date:${date}*`);
    
    // Clear month cache containing this date
    const month = date.substring(0, 7); // "2024-01"
    await cacheService.deletePattern(`availability:monthly:*${month}*`);
    
    console.log(`[CacheInvalidation] Invalidated booking cache for date: ${date}`);
  }

  /**
   * Invalidate cache when driver availability changes
   */
  static async invalidateDriverCache(driverId: number, affectedDates: string[]): Promise<void> {
    for (const date of affectedDates) {
      await cacheService.deletePattern(`availability:daily:*date:${date}*`);
      await cacheService.deletePattern(`availability:resources:*${date}*`);
    }
    
    console.log(`[CacheInvalidation] Invalidated driver cache for driver ${driverId}, dates: ${affectedDates.join(', ')}`);
  }

  /**
   * Invalidate cache when mover availability changes
   */
  static async invalidateMoverCache(moverId: number, affectedDates: string[]): Promise<void> {
    for (const date of affectedDates) {
      await cacheService.deletePattern(`availability:daily:*date:${date}*`);
      await cacheService.deletePattern(`availability:resources:*${date}*`);
    }
    
    console.log(`[CacheInvalidation] Invalidated mover cache for mover ${moverId}, dates: ${affectedDates.join(', ')}`);
  }

  /**
   * Invalidate all availability cache
   */
  static async invalidateAllAvailabilityCache(): Promise<void> {
    await cacheService.deletePattern('availability:*');
    console.log('[CacheInvalidation] Invalidated all availability cache');
  }
}

export { CacheService }; 