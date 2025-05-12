
import { CacheConfig } from "../types";

/**
 * In-memory cache for frequently accessed profiles
 * Provides faster access than localStorage for hot profiles
 */
export class HotCache<T> {
  private cache: Map<string, T> = new Map();
  private accessCounts: Map<string, number> = new Map();
  
  // Short TTL for hot cache (2 minutes)
  private readonly HOT_CACHE_TTL = 2 * 60 * 1000;
  
  constructor(private config: CacheConfig) {}
  
  /**
   * Get an item from hot cache
   */
  getItem(key: string): T | null {
    // Track access
    this.trackAccess(key);
    
    return this.cache.get(key) || null;
  }
  
  /**
   * Check if an item exists in hot cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }
  
  /**
   * Add an item to hot cache with TTL
   */
  setItem(key: string, data: T): void {
    this.cache.set(key, data);
    
    // Auto-expire after TTL
    setTimeout(() => this.cache.delete(key), this.HOT_CACHE_TTL);
  }
  
  /**
   * Track profile access frequency
   */
  trackAccess(key: string): void {
    const currentCount = this.accessCounts.get(key) || 0;
    this.accessCounts.set(key, currentCount + 1);
    
    // Periodically normalize access counts to prevent overflow
    if (this.accessCounts.size > 1000) {
      this.normalizeAccessCounts();
    }
  }
  
  /**
   * Check if a profile is frequently accessed
   */
  isFrequentlyAccessed(key: string): boolean {
    const count = this.accessCounts.get(key) || 0;
    // Consider "frequently accessed" if accessed more than 3 times
    return count > 3;
  }
  
  /**
   * Normalize access counts to prevent overflow
   */
  private normalizeAccessCounts(): void {
    // Divide all counts by 2
    this.accessCounts.forEach((count, key) => {
      this.accessCounts.set(key, Math.max(1, Math.floor(count / 2)));
    });
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessCounts.clear();
  }
}
