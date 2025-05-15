import { BaseCache } from "./base-cache";
import { CacheConfig } from "./types";
import { STORAGE_KEYS } from "./config";

/**
 * Enhanced Profile Cache with multi-tiered caching strategy
 * Optimized to prioritize critical profile data
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
  
  constructor(config: CacheConfig, cacheType?: 'EVENTS' | 'PROFILES' | 'FEEDS' | 'THREADS') {
    super(config, STORAGE_KEYS.PROFILES, cacheType);
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
    this.updateAccessCount(pubkey);
    
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
    // Optimize profile data before caching
    const optimizedData = this.optimizeProfileData(data, important);
    
    // Update regular cache
    super.cacheItem(pubkey, optimizedData, important);
    
    // If frequently accessed, add to hot cache too
    if (this.isFrequentlyAccessed(pubkey)) {
      this.hotCache.set(pubkey, optimizedData);
    }
    
    // Add related profiles to prefetch queue if available
    this.queueRelatedProfilesToPreFetch(optimizedData);
  }
  
  /**
   * Optimize profile data to reduce size
   * Only keep essential fields for non-important profiles
   */
  private optimizeProfileData(data: any, important: boolean): any {
    if (!data) return data;
    
    // For important profiles, keep all data
    if (important) return data;
    
    // For non-important profiles, only keep essential fields
    return {
      name: data.name,
      display_name: data.display_name,
      picture: data.picture,
      nip05: data.nip05,
      _createdAt: data._createdAt || data.created_at,
      // NIP-01 compliance - keep mandatory fields
      created_at: data.created_at,
      kind: data.kind
    };
  }
  
  /**
   * Track profile access frequency
   */
  private updateAccessCount(pubkey: string): void {
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
    
    // Add to prefetch queue (up to 3 related profiles - reduced from 5)
    const uniquePubkeys = [...new Set(relatedPubkeys)].slice(0, 3);
    this.prefetchQueue.push(...uniquePubkeys);
    
    // Cap prefetch queue size to 10 (reduced from 20)
    if (this.prefetchQueue.length > 10) {
      this.prefetchQueue = this.prefetchQueue.slice(-10);
    }
  }
  
  /**
   * Process the prefetch queue
   */
  private processPrefetchQueue(): void {
    // Process up to 3 profiles at a time from the queue (reduced from 5)
    const toProcess = this.prefetchQueue.splice(0, 3);
    
    if (toProcess.length === 0) return;
    
    console.log(`Background prefetching ${toProcess.length} profiles`);
    
    // In real implementation, this would fetch profiles and cache them
    // For example:
    // toProcess.forEach(pubkey => {
    //   nostrService.getUserProfile(pubkey)
    //     .then(profile => this.cacheItem(pubkey, profile))
    //     .catch(err => console.warn(`Failed to prefetch profile ${pubkey}`, err));
    // });
  }
  
  /**
   * Clean up oldest non-important profiles
   * Used during emergency cleanup
   */
  cleanupOldestNonImportant(count: number): number {
    const nonImportantProfiles: Array<[string, number]> = [];
    
    // Collect non-important profiles with their timestamps
    this.cache.forEach((entry, key) => {
      if (!entry.important) {
        nonImportantProfiles.push([key, entry.timestamp]);
      }
    });
    
    if (nonImportantProfiles.length === 0) return 0;
    
    // Sort by timestamp (oldest first)
    nonImportantProfiles.sort((a, b) => a[1] - b[1]);
    
    // Delete the oldest profiles up to the requested count
    const toDelete = nonImportantProfiles.slice(0, Math.min(count, nonImportantProfiles.length));
    
    for (const [key] of toDelete) {
      this.cache.delete(key);
      this.accessTimestamps.delete(key);
    }
    
    return toDelete.length;
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
