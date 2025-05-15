
import { NostrEvent } from "../types";
import { BaseCache } from "./base-cache";
import { CacheConfig } from "./types";

/**
 * Cache service for thread data
 */
export class ThreadCache extends BaseCache<NostrEvent[]> {
  constructor(config: CacheConfig) {
    super(config);
  }
  
  /**
   * Clear all non-important threads
   * Used during emergency cleanup
   */
  cleanupAllNonImportant(): number {
    let removedCount = 0;
    
    this.cache.forEach((entry, key) => {
      if (!entry.important) {
        this.cache.delete(key);
        this.accessTimestamps.delete(key);
        removedCount++;
      }
    });
    
    return removedCount;
  }
}
