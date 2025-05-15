import { CacheEntry, CacheConfig, StorageKeys } from './types';

/**
 * Base class for all cache implementations
 * Provides common functionality for caching and retrieval
 */
export abstract class BaseCache<T> {
  protected cache: Map<string, CacheEntry<T>> = new Map();
  protected config: CacheConfig;
  protected storageKey?: string;
  protected offlineMode: boolean = false;
  protected maxStorageRetries: number = 3;
  
  constructor(config: CacheConfig, storageKey?: string) {
    this.config = config;
    this.storageKey = storageKey;
  }
  
  /**
   * Set the offline mode status
   */
  setOfflineMode(offline: boolean): void {
    this.offlineMode = offline;
  }
  
  /**
   * Cache an item
   */
  cacheItem(key: string, data: T, important: boolean = false): void {
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
   * Get an item from cache
   */
  getItem(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
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
   * Clear expired cache entries
   */
  cleanupExpiredEntries(): void {
    const now = Date.now();
    
    this.cache.forEach((entry, key) => {
      const expiry = this.offlineMode || entry.important ? 
        this.config.offlineExpiry : this.config.standardExpiry;
      
      if (now - entry.timestamp > expiry && !this.offlineMode) {
        this.cache.delete(key);
      }
    });
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    
    if (this.storageKey) {
      try {
        localStorage.removeItem(this.storageKey);
      } catch (error) {
        console.warn(`Error clearing storage for ${this.storageKey}:`, error);
      }
    }
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
        Object.entries(parsedItems).forEach(([key, entry]) => {
          this.cache.set(key, entry);
        });
      }
    } catch (error) {
      console.error(`Failed to load ${this.storageKey} from storage:`, error);
    }
  }
}
