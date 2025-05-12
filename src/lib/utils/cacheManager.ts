
type CacheItem<T> = {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheManager {
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  /**
   * Get an item from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if item is expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }
  
  /**
   * Set an item in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const timestamp = Date.now();
    const expiresAt = timestamp + ttl;
    
    this.cache.set(key, {
      data,
      timestamp,
      expiresAt
    });
  }
  
  /**
   * Check if key exists in cache and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }
    
    // Check if item is expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Remove item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get all keys that match a prefix
   */
  getKeysWithPrefix(prefix: string): string[] {
    return Array.from(this.cache.keys()).filter(key => key.startsWith(prefix));
  }
  
  /**
   * Delete all keys that match a prefix
   */
  deleteKeysWithPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.getKeysWithPrefix(prefix)) {
      if (this.cache.delete(key)) {
        count++;
      }
    }
    return count;
  }
  
  /**
   * Set default TTL for cache items
   */
  setDefaultTTL(ttlMs: number): void {
    this.defaultTTL = ttlMs;
  }
}

// Export a singleton instance
export const cacheManager = new CacheManager();

// Helper function to get or create cached data
export async function getOrCreateCached<T>(
  key: string, 
  fetchFn: () => Promise<T>, 
  ttl?: number
): Promise<T> {
  // Check if we have a cached version
  const cached = cacheManager.get<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch fresh data
  const data = await fetchFn();
  
  // Cache the result
  cacheManager.set(key, data, ttl);
  
  return data;
}
