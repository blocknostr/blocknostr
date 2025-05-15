
import { CacheEntry, CacheConfig, StorageKeys } from './types';
import { CACHE_SIZE_LIMITS } from './config';

/**
 * Base class for all cache implementations
 * Provides common functionality for caching and retrieval
 * Optimized for reduced memory footprint
 */
export abstract class BaseCache<T> {
  protected cache: Map<string, CacheEntry<T>> = new Map();
  protected config: CacheConfig;
  protected storageKey?: string;
  protected offlineMode: boolean = false;
  protected maxStorageRetries: number = 3;
  protected maxItems: number = 1000; // Default max items
  
  // Track access frequency for LRU eviction policy
  protected accessTimestamps: Map<string, number> = new Map();
  
  constructor(config: CacheConfig, storageKey?: string, cacheType?: 'EVENTS' | 'PROFILES' | 'FEEDS' | 'THREADS') {
    this.config = config;
    this.storageKey = storageKey;
    
    // Set size limit based on cache type
    if (cacheType && CACHE_SIZE_LIMITS[cacheType]) {
      this.maxItems = CACHE_SIZE_LIMITS[cacheType];
    }
  }
  
  /**
   * Set the offline mode status
   */
  setOfflineMode(offline: boolean): void {
    this.offlineMode = offline;
  }
  
  /**
   * Cache an item with size management
   */
  cacheItem(key: string, data: T, important: boolean = false): void {
    // Update access timestamp for this key
    this.trackAccess(key);
    
    // Check if we need to evict items before adding a new one
    if (this.cache.size >= this.maxItems) {
      this.evictLeastRecentlyUsed();
    }
    
    // Add/update the item in cache
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      important
    });
    
    if (important && this.storageKey) {
      this.persistToStorage();
    }
  }
  
  /**
   * Get an item from cache with access tracking
   */
  getItem(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Track access for LRU policy
    this.trackAccess(key);
    
    // In offline mode or if important, we keep entries longer
    const expiry = this.offlineMode || entry.important ? 
      this.config.offlineExpiry : this.config.standardExpiry;
    
    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > expiry) {
      if (!this.offlineMode && !entry.important) {
        this.cache.delete(key);
      }
      return this.offlineMode ? entry.data : null;
    }
    
    return entry.data;
  }
  
  /**
   * Track access time for LRU eviction policy
   */
  protected trackAccess(key: string): void {
    this.accessTimestamps.set(key, Date.now());
  }
  
  /**
   * Evict least recently used items when cache is full
   */
  protected evictLeastRecentlyUsed(): void {
    // Skip if cache isn't full yet
    if (this.cache.size < this.maxItems) return;
    
    // Find items to evict (non-important items first)
    const candidatesForEviction: Array<[string, number]> = [];
    
    // First try to remove expired non-important items
    const now = Date.now();
    this.cache.forEach((entry, key) => {
      if (!entry.important && now - entry.timestamp > this.config.standardExpiry) {
        candidatesForEviction.push([key, 0]); // Priority 0 for expired items
      }
    });
    
    // If we still need to evict more, use LRU for non-important items
    if (candidatesForEviction.length < Math.floor(this.maxItems * 0.1)) { // Evict at least 10%
      this.accessTimestamps.forEach((timestamp, key) => {
        if (this.cache.has(key) && !this.cache.get(key)?.important) {
          candidatesForEviction.push([key, timestamp]);
        }
      });
    }
    
    // Sort by access time (oldest first) and evict oldest 20%
    if (candidatesForEviction.length > 0) {
      candidatesForEviction.sort((a, b) => a[1] - b[1]);
      const evictionCount = Math.max(
        1, 
        Math.floor(Math.min(candidatesForEviction.length, this.maxItems * 0.2))
      );
      
      // Evict the oldest items
      for (let i = 0; i < evictionCount; i++) {
        const keyToEvict = candidatesForEviction[i][0];
        this.cache.delete(keyToEvict);
        this.accessTimestamps.delete(keyToEvict);
      }
      
      console.log(`[Cache] Evicted ${evictionCount} items from cache based on LRU policy`);
    }
  }
  
  /**
   * Clear expired cache entries
   */
  cleanupExpiredEntries(): number {
    const now = Date.now();
    let removedCount = 0;
    
    this.cache.forEach((entry, key) => {
      const expiry = entry.important ? this.config.offlineExpiry : this.config.standardExpiry;
      
      if (now - entry.timestamp > expiry && !this.offlineMode) {
        this.cache.delete(key);
        this.accessTimestamps.delete(key);
        removedCount++;
      }
    });
    
    return removedCount;
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessTimestamps.clear();
    
    if (this.storageKey) {
      try {
        localStorage.removeItem(this.storageKey);
      } catch (error) {
        console.warn(`Error clearing storage for ${this.storageKey}:`, error);
      }
    }
  }
  
  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Persist cache to local storage
   */
  protected persistToStorage(): void {
    if (!this.storageKey) return;
    
    try {
      // Only get important items to keep storage size manageable
      const importantItems = Array.from(this.cache.entries())
        .filter(([_, entry]) => entry.important)
        .slice(0, 100) // Limit to 100 important items max for storage
        .reduce((obj, [key, entry]) => {
          obj[key] = entry;
          return obj;
        }, {} as Record<string, CacheEntry<T>>);
      
      if (Object.keys(importantItems).length > 0) {
        this.attemptStorageSave(importantItems);
      }
    } catch (error) {
      console.error(`Failed to persist ${this.storageKey} to storage:`, error);
    }
  }
  
  /**
   * Attempt to save to storage with quota management
   */
  private attemptStorageSave(data: Record<string, CacheEntry<T>>, retryCount = 0): boolean {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.storageKey!, serialized);
      return true;
    } catch (error: any) {
      // Check if this is a quota exceeded error
      if (error.name === 'QuotaExceededError' || 
          error.message?.includes('quota') || 
          error.message?.includes('storage')) {
        
        if (retryCount >= this.maxStorageRetries) {
          console.warn(`Storage quota exceeded for ${this.storageKey}, giving up after ${retryCount} retries`);
          return false;
        }
        
        // Storage optimization: shrink the dataset by 50% on each retry
        const entries = Object.entries(data);
        const reducedItems = entries.slice(0, Math.floor(entries.length / 2));
        
        if (reducedItems.length > 0) {
          const reducedData = reducedItems.reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
          }, {} as Record<string, CacheEntry<T>>);
          
          console.warn(`Storage quota exceeded. Retrying with ${reducedItems.length} items (reduced from ${entries.length})`);
          return this.attemptStorageSave(reducedData, retryCount + 1);
        }
        
        return false;
      }
      
      console.error(`Error saving to storage: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Load cache from local storage
   */
  protected loadFromStorage(): void {
    if (!this.storageKey) return;
    
    try {
      const cachedItems = localStorage.getItem(this.storageKey);
      if (cachedItems) {
        const parsedItems = JSON.parse(cachedItems) as Record<string, CacheEntry<T>>;
        
        // Enforce size limit even during loading
        const entries = Object.entries(parsedItems).slice(0, this.maxItems);
        entries.forEach(([key, entry]) => {
          this.cache.set(key, entry);
          // Initialize access timestamps
          this.accessTimestamps.set(key, Date.now());
        });
        
        console.log(`[Cache] Loaded ${entries.length} items from storage for ${this.storageKey}`);
      }
    } catch (error) {
      console.error(`Failed to load ${this.storageKey} from storage:`, error);
    }
  }
}
