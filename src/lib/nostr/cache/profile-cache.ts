
import { BaseCache } from "./base-cache";
import { CacheConfig } from "./types";
import { STORAGE_KEYS } from "./config";
import { HotCache } from "./profile/hot-cache";
import { PrefetchQueue } from "./profile/prefetch-queue";

/**
 * Enhanced Profile Cache with multi-tiered caching strategy
 */
export class ProfileCache extends BaseCache<any> {
  // Memory-only cache for frequently accessed profiles
  private hotCache: HotCache<any>;
  
  // Prefetch queue for background loading
  private prefetchQueue: PrefetchQueue;
  
  constructor(config: CacheConfig) {
    super(config, STORAGE_KEYS.PROFILES);
    
    // Initialize hot cache
    this.hotCache = new HotCache<any>(config);
    
    // Initialize prefetch queue
    this.prefetchQueue = new PrefetchQueue();
    this.prefetchQueue.setPrefetchHandler(this.handlePrefetch.bind(this));
    
    this.loadFromStorage();
  }
  
  /**
   * Get profile with enhanced caching strategy
   * Checks hot cache first, then regular cache
   */
  getItem(pubkey: string): any | null {
    // Update access count for this pubkey
    this.hotCache.trackAccess(pubkey);
    
    // Check hot cache first (fastest)
    if (this.hotCache.has(pubkey)) {
      return this.hotCache.getItem(pubkey);
    }
    
    // Fall back to regular cache
    const profile = super.getItem(pubkey);
    
    // If frequently accessed, promote to hot cache
    if (profile && this.hotCache.isFrequentlyAccessed(pubkey)) {
      this.hotCache.setItem(pubkey, profile);
    }
    
    return profile;
  }
  
  /**
   * Cache a profile with enhanced strategy
   */
  cacheItem(pubkey: string, data: any, important: boolean = false): void {
    // Update regular cache
    super.cacheItem(pubkey, data, important);
    
    // If frequently accessed, add to hot cache too
    if (this.hotCache.isFrequentlyAccessed(pubkey)) {
      this.hotCache.setItem(pubkey, data);
    }
    
    // Add related profiles to prefetch queue if available
    if (data) {
      const relatedPubkeys = this.prefetchQueue.extractRelatedProfiles(data);
      this.prefetchQueue.queueProfiles(relatedPubkeys);
    }
  }
  
  /**
   * Handle prefetch requests from queue
   * This would be connected to nostrService in a real implementation
   */
  private handlePrefetch(pubkeys: string[]): void {
    // In real implementation, this would fetch profiles and cache them
    // For example:
    // pubkeys.forEach(pubkey => {
    //   nostrService.getUserProfile(pubkey)
    //     .then(profile => this.cacheItem(pubkey, profile))
    //     .catch(err => console.warn(`Failed to prefetch profile ${pubkey}`, err));
    // });
    
    console.log("Would prefetch profiles:", pubkeys);
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    this.hotCache.clear();
    this.prefetchQueue.dispose();
  }
}
