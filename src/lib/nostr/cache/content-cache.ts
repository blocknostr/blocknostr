import { NostrEvent } from "../types";
import { 
  CACHE_EXPIRY, 
  OFFLINE_CACHE_EXPIRY, 
  STORAGE_KEYS, 
  CLEANUP_INTERVAL,
  QUOTA_CHECK_INTERVAL,
  QUOTA_WARNING_THRESHOLD,
  QUOTA_DANGER_THRESHOLD
} from "./config";
import { EventCache } from "./event-cache";
import { ProfileCache } from "./profile-cache";
import { ThreadCache } from "./thread-cache";
import { FeedCache } from "./feed-cache";
import { ListCache } from "./list-cache";
import { CacheConfig } from "./types";
import { EventFilter } from "./utils/event-filter";
import { storageQuota } from "../utils/storage-quota";

/**
 * Content cache service for Nostr events
 * Reduces relay requests by caching already loaded content
 * Supports offline functionality through persistence
 * Optimized for reduced memory footprint
 */
export class ContentCache {
  private eventCache: EventCache;
  private profileCache: ProfileCache;
  private threadCache: ThreadCache;
  private _feedCache: FeedCache;
  private muteListCache: ListCache;
  private blockListCache: ListCache;
  private offlineMode: boolean = false;
  private cleanupTimerId: number | null = null;
  private quotaCheckTimerId: number | null = null;
  
  constructor() {
    const config: CacheConfig = {
      standardExpiry: CACHE_EXPIRY,
      offlineExpiry: OFFLINE_CACHE_EXPIRY
    };
    
    // Initialize cache modules with specific size limits
    this.eventCache = new EventCache(config, 'EVENTS');
    this.profileCache = new ProfileCache(config, 'PROFILES');
    this.threadCache = new ThreadCache(config);
    this._feedCache = new FeedCache(config, 'FEEDS');
    this.muteListCache = new ListCache(STORAGE_KEYS.MUTE_LIST);
    this.blockListCache = new ListCache(STORAGE_KEYS.BLOCK_LIST);
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.offlineMode = false;
      this.updateOfflineMode();
      console.log('App is online - using standard caching policy');
    });
    
    window.addEventListener('offline', () => {
      this.offlineMode = true;
      this.updateOfflineMode();
      console.log('App is offline - using extended caching policy');
    });
    
    // Set initial offline status
    this.offlineMode = !navigator.onLine;
    this.updateOfflineMode();
    
    // Log storage metrics on startup and set up cleanup intervals
    setTimeout(() => {
      storageQuota.logStorageMetrics();
      this.setupAutomaticCleanup();
    }, 1000);
  }
  
  /**
   * Set up automatic cache cleanup processes
   */
  private setupAutomaticCleanup(): void {
    // Clear any existing timers
    if (this.cleanupTimerId) {
      clearInterval(this.cleanupTimerId);
    }
    if (this.quotaCheckTimerId) {
      clearInterval(this.quotaCheckTimerId);
    }
    
    // Set up regular cache cleanup
    this.cleanupTimerId = window.setInterval(() => {
      const totalRemoved = this.cleanupExpiredEntries();
      console.log(`[Cache] Removed ${totalRemoved} expired items during routine cleanup`);
    }, CLEANUP_INTERVAL);
    
    // Set up quota checking interval
    this.quotaCheckTimerId = window.setInterval(() => {
      this.checkAndOptimizeStorage();
    }, QUOTA_CHECK_INTERVAL);
  }
  
  /**
   * Check storage quota and optimize if needed
   */
  private async checkAndOptimizeStorage(): Promise<void> {
    try {
      const isApproachingQuota = await storageQuota.isApproachingQuota(QUOTA_WARNING_THRESHOLD);
      
      if (isApproachingQuota) {
        const isDangerLevel = await storageQuota.isApproachingQuota(QUOTA_DANGER_THRESHOLD);
        
        if (isDangerLevel) {
          // Aggressive cleanup for danger level quota
          console.warn("Storage quota in danger zone, performing aggressive cleanup");
          this.emergencyStorageCleanup();
        } else {
          // Standard cleanup for warning level
          console.warn("Storage quota approaching limit, running proactive cleanup");
          this.cleanupExpiredEntries();
        }
      }
    } catch (err) {
      console.error("Error checking quota:", err);
    }
  }
  
  /**
   * Emergency cleanup for critical quota situations
   */
  private emergencyStorageCleanup(): void {
    // 1. Clear all non-important items first
    let totalRemoved = 0;
    
    // Clear all feeds (can be reloaded)
    this._feedCache.clear();
    
    // Clear all non-important events
    const eventCount = this.eventCache.cleanupAllNonImportant();
    console.log(`[Emergency Cleanup] Removed ${eventCount} non-important events`);
    totalRemoved += eventCount;
    
    // Clear older threads
    const threadCount = this.threadCache.cleanupAllNonImportant();
    console.log(`[Emergency Cleanup] Removed ${threadCount} non-important threads`);
    totalRemoved += threadCount;
    
    // Keep profiles as they're smaller and more important
    const profileCount = this.profileCache.cleanupOldestNonImportant(50);
    console.log(`[Emergency Cleanup] Removed ${profileCount} old profiles`);
    totalRemoved += profileCount;
    
    console.warn(`[Emergency Cleanup] Removed ${totalRemoved} items total to free up storage`);
    
    // Log final storage state
    storageQuota.logStorageMetrics();
  }
  
  // Update offline mode status across all caches
  private updateOfflineMode(): void {
    this.eventCache.setOfflineMode(this.offlineMode);
    this.profileCache.setOfflineMode(this.offlineMode);
    this.threadCache.setOfflineMode(this.offlineMode);
    this._feedCache.setOfflineMode(this.offlineMode);
  }

  // Access to the feed cache instance
  get feedCache(): FeedCache {
    return this._feedCache;
  }
  
  // Event cache methods
  cacheEvent(event: NostrEvent, important: boolean = false): void {
    if (!event.id) return;
    
    // Determine importance based on event kind
    // Kind 0 (metadata) and Kind 3 (contacts) are generally more important
    const isImportantEvent = important || event.kind === 0 || event.kind === 3;
    
    this.eventCache.cacheItem(event.id, event, isImportantEvent);
  }
  
  getEvent(eventId: string): NostrEvent | null {
    return this.eventCache.getItem(eventId);
  }
  
  cacheEvents(events: NostrEvent[], important: boolean = false): void {
    // Check if approaching quota before caching large batches
    storageQuota.isApproachingQuota(QUOTA_WARNING_THRESHOLD).then(isApproaching => {
      // Determine batch size based on quota status
      const maxBatchSize = isApproaching ? 20 : 50;
      
      if (isApproaching && events.length > 10) {
        console.warn(`Approaching storage quota. Limiting batch size to ${maxBatchSize}.`);
        // Just cache a subset if approaching quota, prioritize newer events
        events = events
          .sort((a, b) => b.created_at - a.created_at)
          .slice(0, maxBatchSize);
      }

      // Process events in smaller batches
      const batchSize = maxBatchSize;
      const batches = Math.ceil(events.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, events.length);
        const batch = events.slice(start, end);
        
        try {
          // Cache each event with appropriate importance flag
          batch.forEach(event => {
            // Determine importance based on event kind
            const isImportantEvent = important || 
              event.kind === 0 || // Metadata
              event.kind === 3;   // Contacts
              
            if (event.id) {
              this.eventCache.cacheItem(event.id, event, isImportantEvent);
            }
          });
        } catch (error) {
          console.error(`Error caching events batch ${i+1}/${batches}:`, error);
          // Don't attempt to cache more if we hit an error
          break;
        }
      }
    }).catch(err => {
      console.error("Error checking storage quota:", err);
      // Attempt to cache despite error, but be conservative
      events.slice(0, 10).forEach(event => {
        if (event.id) {
          this.eventCache.cacheItem(event.id, event, false);
        }
      });
    });
  }
  
  getEventsByAuthors(authorPubkeys: string[]): NostrEvent[] {
    return this.eventCache.getEventsByAuthors(authorPubkeys);
  }
  
  // Profile cache methods
  cacheProfile(pubkey: string, profileData: any, important: boolean = false): void {
    if (!profileData) return;
    
    try {
      // Add creation timestamp to profile data for account age
      if (profileData && !profileData._createdAt && profileData.created_at) {
        profileData._createdAt = profileData.created_at;
      }
      
      // For NIP-05 verified accounts, mark as important
      const isVerifiedProfile = profileData.nip05 && typeof profileData.nip05 === 'string';
      const shouldMarkImportant = important || isVerifiedProfile;
      
      this.profileCache.cacheItem(pubkey, profileData, shouldMarkImportant);
    } catch (error) {
      console.error(`Error caching profile for ${pubkey}:`, error);
      
      // If we hit a quota error, clear some space and try again
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.cleanupExpiredEntries();
        try {
          // Try again with only essential profile data
          const essentialData = {
            name: profileData.name,
            display_name: profileData.display_name,
            picture: profileData.picture,
            nip05: profileData.nip05,
            _createdAt: profileData._createdAt || profileData.created_at
          };
          this.profileCache.cacheItem(pubkey, essentialData, isVerifiedProfile || important);
        } catch (retryError) {
          console.error(`Failed to cache profile even with reduced data:`, retryError);
        }
      }
    }
  }
  
  getProfile(pubkey: string): any | null {
    return this.profileCache.getItem(pubkey);
  }
  
  // Thread cache methods
  cacheThread(rootId: string, events: NostrEvent[], important: boolean = false): void {
    try {
      // Determine importance of thread based on engagement level
      const hasHighEngagement = events.length > 5;
      const shouldMarkImportant = important || hasHighEngagement;
      
      this.threadCache.cacheItem(rootId, events, shouldMarkImportant);
    } catch (error) {
      console.error(`Error caching thread ${rootId}:`, error);
      
      // If error, try with smaller set
      if (events.length > 5) {
        try {
          // Keep the root event and a few responses
          const essentialEvents = [
            events.find(e => e.id === rootId), // Root event
            ...events.filter(e => e.id !== rootId).slice(0, 4) // Top 4 responses
          ].filter(Boolean) as NostrEvent[];
          
          this.threadCache.cacheItem(rootId, essentialEvents, false);
        } catch (retryError) {
          console.error(`Failed to cache thread with reduced data:`, retryError);
        }
      }
    }
  }
  
  getThread(rootId: string): NostrEvent[] | null {
    return this.threadCache.getItem(rootId);
  }
  
  // Feed cache methods
  cacheFeed(feedType: string, events: NostrEvent[], options: {
    authorPubkeys?: string[],
    hashtag?: string,
    since?: number,
    until?: number,
    mediaOnly?: boolean
  }, important: boolean = false): void {
    // Check storage quota before caching large feeds
    storageQuota.isApproachingQuota(QUOTA_WARNING_THRESHOLD).then(isApproaching => {
      // Determine max events to cache based on quota status
      const maxEvents = isApproaching ? 10 : 30;
      
      if (isApproaching) {
        console.warn(`Approaching storage quota, limiting feed cache for ${feedType}`);
        // Just cache a subset if approaching quota
        events = events.slice(0, maxEvents);
      }

      try {
        // Only cache the most recent events
        const recentEvents = events
          .sort((a, b) => b.created_at - a.created_at)
          .slice(0, maxEvents);
          
        this._feedCache.cacheFeed(feedType, recentEvents, options, important);
      } catch (error) {
        console.error(`Error caching feed ${feedType}:`, error);
        this.cleanupExpiredEntries();
        
        // Try again with fewer events
        if (events.length > 5) {
          const reducedEvents = events.slice(0, 5);
          console.warn(`Retrying with ${reducedEvents.length} events (reduced from ${events.length})`);
          
          try {
            this._feedCache.cacheFeed(feedType, reducedEvents, options, false);
          } catch (retryError) {
            console.error(`Failed to cache even with reduced events:`, retryError);
          }
        }
      }
    }).catch(err => {
      console.error("Error checking storage quota:", err);
      // Be conservative with caching on error
      try {
        this._feedCache.cacheFeed(feedType, events.slice(0, 5), options, false);
      } catch (cacheError) {
        console.error("Fallback caching failed:", cacheError);
      }
    });
  }
  
  getFeed(feedType: string, options: {
    authorPubkeys?: string[],
    hashtag?: string,
    since?: number,
    until?: number,
    mediaOnly?: boolean
  }): NostrEvent[] | null {
    return this._feedCache.getFeed(feedType, options);
  }
  
  // Mute list methods
  cacheMuteList(pubkeys: string[]): void {
    try {
      this.muteListCache.cacheList(pubkeys);
    } catch (error) {
      console.error("Error caching mute list:", error);
    }
  }

  getMuteList(): string[] | null {
    return this.muteListCache.getList();
  }

  // Block list methods
  cacheBlockList(pubkeys: string[]): void {
    try {
      this.blockListCache.cacheList(pubkeys);
    } catch (error) {
      console.error("Error caching block list:", error);
    }
  }

  getBlockList(): string[] | null {
    return this.blockListCache.getList();
  }
  
  // Cleanup methods
  cleanupExpiredEntries(): number {
    console.log("Cleaning up expired cache entries...");
    
    // Run cleanup on all caches and collect stats
    const eventsRemoved = this.eventCache.cleanupExpiredEntries();
    const profilesRemoved = this.profileCache.cleanupExpiredEntries();
    const threadsRemoved = this.threadCache.cleanupExpiredEntries();
    const feedsRemoved = this._feedCache.cleanupExpiredEntries();
    
    const totalRemoved = eventsRemoved + profilesRemoved + threadsRemoved + feedsRemoved;
    
    console.log(`[Cache Cleanup] Removed ${totalRemoved} expired entries: ` +
      `${eventsRemoved} events, ${profilesRemoved} profiles, ` +
      `${threadsRemoved} threads, ${feedsRemoved} feeds`);
    
    // Log storage metrics after cleanup
    storageQuota.logStorageMetrics();
    
    return totalRemoved;
  }
  
  clearAll(): void {
    this.eventCache.clear();
    this.profileCache.clear();
    this.threadCache.clear();
    this._feedCache.clear();
    this.muteListCache.clear();
    this.blockListCache.clear();
    console.log("[Cache] All caches cleared");
  }
  
  isOffline(): boolean {
    return this.offlineMode;
  }
  
  // Get cache stats for monitoring
  getCacheStats(): Record<string, number> {
    return {
      events: this.eventCache.size(),
      profiles: this.profileCache.size(),
      threads: this.threadCache.size(),
      feeds: this._feedCache.size()
    };
  }
}

// Create and export singleton instance
const contentCache = new ContentCache();
export { contentCache };
