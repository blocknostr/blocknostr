
/**
 * Simple cache implementation for content
 * Stores content with expiration to avoid re-fetching
 */
class ContentCache {
  private cache: Map<string, { content: any; expires: number }> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL

  /**
   * Get a cached item
   * @param key Cache key
   * @returns The cached content or undefined if not found or expired
   */
  get(key: string): any | undefined {
    const item = this.cache.get(key);
    if (!item) {
      return undefined;
    }

    // Check if item has expired
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return undefined;
    }

    return item.content;
  }

  /**
   * Set an item in the cache
   * @param key Cache key
   * @param content Content to cache
   * @param ttl Time to live in milliseconds (optional)
   */
  set(key: string, content: any, ttl: number = this.defaultTTL): void {
    const expires = Date.now() + ttl;
    this.cache.set(key, { content, expires });
  }

  /**
   * Check if an item exists in the cache and is not expired
   * @param key Cache key
   * @returns Boolean indicating if item exists and is valid
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }
    
    // Check if item has expired
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Remove an item from the cache
   * @param key Cache key
   */
  remove(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean expired items from the cache
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// Export a singleton instance
export const contentCache = new ContentCache();
