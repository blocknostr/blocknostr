
import { BaseCache } from "./base-cache";
import { CacheConfig } from "./types";
import { STORAGE_KEYS } from "./config";
import { cacheManager } from "@/lib/utils/cacheManager";

/**
 * Enhanced Profile Cache with multi-tiered caching strategy
 */
export class ProfileCache extends BaseCache<any> {
  // Memory-only cache for frequently accessed profiles
  private hotCache: Map<string, any> = new Map();
  
  // Track profile access frequency for better cache management
  private accessCounts: Map<string, number> = new Map();
  
  // Short TTL for hot cache (2 minutes)
  private readonly HOT_CACHE_TTL = 2 * 60 * 1000;
  
  // Background refresh timer
  private backgroundRefreshTimer: number | null = null;
  
  // Prefetch queue
  private prefetchQueue: string[] = [];
  
  constructor(config: CacheConfig) {
    super(config, STORAGE_KEYS.PROFILES);
    this.loadFromStorage();
    
    // Schedule periodic background refresh for frequently accessed profiles
    this.startBackgroundRefresh();
  }
  
  /**
   * Get profile with enhanced caching strategy
   * Checks hot cache first, then regular cache
   */
  getItem(pubkey: string): any | null {
    // Update access count for this pubkey
    this.trackAccess(pubkey);
    
    // Check hot cache first (fastest)
    if (this.hotCache.has(pubkey)) {
      return this.hotCache.get(pubkey);
    }
    
    // Fall back to regular cache
    const profile = super.getItem(pubkey);
    
    // If frequently accessed, promote to hot cache
    if (profile && this.isFrequentlyAccessed(pubkey)) {
      this.hotCache.set(pubkey, profile);
      setTimeout(() => this.hotCache.delete(pubkey), this.HOT_CACHE_TTL);
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
    if (this.isFrequentlyAccessed(pubkey)) {
      this.hotCache.set(pubkey, data);
    }
    
    // Add related profiles to prefetch queue if available
    this.queueRelatedProfilesToPreFetch(data);
  }
  
  /**
   * Track profile access frequency
   */
  private trackAccess(pubkey: string): void {
    const currentCount = this.accessCounts.get(pubkey) || 0;
    this.accessCounts.set(pubkey, currentCount + 1);
    
    // Periodically normalize access counts to prevent overflow
    if (this.accessCounts.size > 1000) {
      this.normalizeAccessCounts();
    }
  }
  
  /**
   * Check if a profile is frequently accessed
   */
  private isFrequentlyAccessed(pubkey: string): boolean {
    const count = this.accessCounts.get(pubkey) || 0;
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
   * Start background refresh for frequently accessed profiles
   */
  private startBackgroundRefresh(): void {
    if (this.backgroundRefreshTimer) {
      clearInterval(this.backgroundRefreshTimer);
    }
    
    // Refresh frequently accessed profiles every 5 minutes
    this.backgroundRefreshTimer = window.setInterval(() => {
      this.processPrefetchQueue();
    }, 5 * 60 * 1000);
  }
  
  /**
   * Add related profiles to prefetch queue
   */
  private queueRelatedProfilesToPreFetch(profileData: any): void {
    if (!profileData) return;
    
    // Extract related profiles from profile data (followers, following, etc.)
    const relatedPubkeys: string[] = [];
    
    // Extract from mentions in profile description
    if (profileData.about) {
      const mentionMatches = profileData.about.match(/nostr:npub[a-z0-9]{59}/g) || [];
      mentionMatches.forEach((match: string) => {
        const pubkey = match.replace('nostr:', '');
        relatedPubkeys.push(pubkey);
      });
    }
    
    // Check for other related profiles in custom fields
    if (profileData.relatedProfiles && Array.isArray(profileData.relatedProfiles)) {
      profileData.relatedProfiles.forEach((pubkey: string) => {
        relatedPubkeys.push(pubkey);
      });
    }
    
    // Add to prefetch queue (up to 5 related profiles)
    const uniquePubkeys = [...new Set(relatedPubkeys)].slice(0, 5);
    this.prefetchQueue.push(...uniquePubkeys);
    
    // Cap prefetch queue size
    if (this.prefetchQueue.length > 20) {
      this.prefetchQueue = this.prefetchQueue.slice(-20);
    }
  }
  
  /**
   * Process the prefetch queue
   */
  private processPrefetchQueue(): void {
    // Process up to 5 profiles at a time from the queue
    const toProcess = this.prefetchQueue.splice(0, 5);
    
    if (toProcess.length === 0) return;
    
    // Just log for now - in a real implementation, this would make API calls
    console.log(`Background prefetching ${toProcess.length} profiles`, toProcess);
    
    // In real implementation, this would fetch profiles and cache them
    // For example:
    // toProcess.forEach(pubkey => {
    //   nostrService.getUserProfile(pubkey)
    //     .then(profile => this.cacheItem(pubkey, profile))
    //     .catch(err => console.warn(`Failed to prefetch profile ${pubkey}`, err));
    // });
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.backgroundRefreshTimer) {
      clearInterval(this.backgroundRefreshTimer);
      this.backgroundRefreshTimer = null;
    }
    
    this.hotCache.clear();
    this.accessCounts.clear();
    this.prefetchQueue = [];
  }
}
