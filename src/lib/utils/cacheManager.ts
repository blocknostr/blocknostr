
type CacheItem<T> = {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheManager {
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes in milliseconds
  private persistentKeys: Set<string> = new Set();
  
  constructor() {
    // Load persisted cache on initialization
    this.loadFromLocalStorage();
    
    // Set up auto-save for persistent items
    setInterval(() => this.persistToLocalStorage(), 30000);
    
    // Set up cleanup interval for expired items
    setInterval(() => this.cleanupExpiredEntries(), 60000);
    
    // Save cache before page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.persistToLocalStorage();
      });
    }
  }
  
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
  set<T>(key: string, data: T, ttl: number = this.defaultTTL, persistent: boolean = false): void {
    const timestamp = Date.now();
    const expiresAt = timestamp + ttl;
    
    this.cache.set(key, {
      data,
      timestamp,
      expiresAt
    });
    
    // Mark as persistent if requested
    if (persistent) {
      this.persistentKeys.add(key);
      // Persist immediately for important data
      this.persistToLocalStorage();
    }
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
    this.persistentKeys.delete(key);
    return this.cache.delete(key);
  }
  
  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.persistentKeys.clear();
    
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('cache_manager_data');
    }
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
    const keys = this.getKeysWithPrefix(prefix);
    let count = 0;
    
    for (const key of keys) {
      this.persistentKeys.delete(key);
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
  
  /**
   * Refresh expiration for an item
   */
  refreshExpiry(key: string, ttl: number = this.defaultTTL): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }
    
    item.expiresAt = Date.now() + ttl;
    return true;
  }
  
  /**
   * Get item with metadata
   */
  getWithMeta<T>(key: string): { data: T, timestamp: number, expiresAt: number } | null {
    const item = this.cache.get(key);
    
    if (!item || Date.now() > item.expiresAt) {
      if (item) this.cache.delete(key);
      return null;
    }
    
    return item as { data: T, timestamp: number, expiresAt: number };
  }
  
  /**
   * Mark a key as persistent (will be saved to localStorage)
   */
  markAsPersistent(key: string): void {
    if (this.has(key)) {
      this.persistentKeys.add(key);
    }
  }
  
  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.persistentKeys.delete(key);
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Save persistent items to localStorage
   */
  private persistToLocalStorage(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      // Only save persistent items
      const dataToSave: Record<string, CacheItem<any>> = {};
      
      for (const key of this.persistentKeys) {
        const item = this.cache.get(key);
        if (item) {
          dataToSave[key] = item;
        }
      }
      
      if (Object.keys(dataToSave).length > 0) {
        localStorage.setItem('cache_manager_data', JSON.stringify(dataToSave));
      }
    } catch (error) {
      console.error('Failed to persist cache to localStorage:', error);
    }
  }
  
  /**
   * Load cache from localStorage
   */
  private loadFromLocalStorage(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const savedData = localStorage.getItem('cache_manager_data');
      if (!savedData) return;
      
      const parsedData = JSON.parse(savedData) as Record<string, CacheItem<any>>;
      
      for (const [key, item] of Object.entries(parsedData)) {
        if (Date.now() <= item.expiresAt) {
          this.cache.set(key, item);
          this.persistentKeys.add(key);
        }
      }
    } catch (error) {
      console.error('Failed to load cache from localStorage:', error);
    }
  }
}

// Export a singleton instance
export const cacheManager = new CacheManager();

// Helper function to get or create cached data
export async function getOrCreateCached<T>(
  key: string, 
  fetchFn: () => Promise<T>, 
  ttl?: number,
  persistent: boolean = false
): Promise<T> {
  // Check if we have a cached version
  const cached = cacheManager.get<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch fresh data
  const data = await fetchFn();
  
  // Cache the result
  cacheManager.set(key, data, ttl, persistent);
  
  return data;
}

// Helper to batch fetch multiple items
export async function batchGetOrCreateCached<T>(
  keys: string[],
  fetchFn: (keys: string[]) => Promise<Record<string, T>>,
  ttl?: number,
  persistent: boolean = false
): Promise<Record<string, T>> {
  // Check what we already have in cache
  const result: Record<string, T> = {};
  const missingKeys: string[] = [];
  
  for (const key of keys) {
    const cached = cacheManager.get<T>(key);
    if (cached !== null) {
      result[key] = cached;
    } else {
      missingKeys.push(key);
    }
  }
  
  // If all items were cached, return them
  if (missingKeys.length === 0) {
    return result;
  }
  
  // Fetch missing data
  const fetchedData = await fetchFn(missingKeys);
  
  // Cache results
  for (const [key, value] of Object.entries(fetchedData)) {
    cacheManager.set(key, value, ttl, persistent);
    result[key] = value;
  }
  
  return result;
}
