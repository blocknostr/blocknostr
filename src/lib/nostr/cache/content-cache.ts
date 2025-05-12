
import { NostrEvent } from "../types";
import { CACHE_EXPIRY, OFFLINE_CACHE_EXPIRY, STORAGE_KEYS } from "./config";
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
 */
export class ContentCache {
  private eventCache: EventCache;
  private profileCache: ProfileCache;
  private threadCache: ThreadCache;
  private _feedCache: FeedCache;
  private muteListCache: ListCache;
  private blockListCache: ListCache;
  private offlineMode: boolean = false;
  
  constructor() {
    const config: CacheConfig = {
      standardExpiry: CACHE_EXPIRY,
      offlineExpiry: OFFLINE_CACHE_EXPIRY
    };
    
    // Initialize cache modules
    this.eventCache = new EventCache(config);
    this.profileCache = new ProfileCache(config);
    this.threadCache = new ThreadCache(config);
    this._feedCache = new FeedCache(config);
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
    
    // Log storage metrics on startup
    setTimeout(() => {
      storageQuota.logStorageMetrics();
    }, 1000);
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
    this.eventCache.cacheItem(event.id, event, important);
  }
  
  getEvent(eventId: string): NostrEvent | null {
    return this.eventCache.getItem(eventId);
  }
  
  cacheEvents(events: NostrEvent[], important: boolean = false): void {
    // Check if approaching quota before caching large batches
    storageQuota.isApproachingQuota(80).then(isApproaching => {
      if (isApproaching && events.length > 10) {
        console.warn(`Approaching storage quota. Limiting batch size.`);
        // Just cache a subset if approaching quota
        this.eventCache.cacheEvents(events.slice(0, 10), important);
        return;
      }

      // Limit batch size to avoid quota issues
      const batchSize = 50;
      const batches = Math.ceil(events.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, events.length);
        const batch = events.slice(start, end);
        
        try {
          this.eventCache.cacheEvents(batch, important);
        } catch (error) {
          console.error(`Error caching events batch ${i+1}/${batches}:`, error);
          // Don't attempt to cache more if we hit an error
          break;
        }
      }
    }).catch(err => {
      console.error("Error checking storage quota:", err);
      // Attempt to cache despite error, but be conservative
      this.eventCache.cacheEvents(events.slice(0, 10), important);
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
      
      this.profileCache.cacheItem(pubkey, profileData, important);
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
          this.profileCache.cacheItem(pubkey, essentialData, important);
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
      this.threadCache.cacheItem(rootId, events, important);
    } catch (error) {
      console.error(`Error caching thread ${rootId}:`, error);
      
      // If error, try with smaller set
      if (events.length > 5) {
        try {
          const essentialEvents = events.slice(0, 5);
          this.threadCache.cacheItem(rootId, essentialEvents, important);
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
    storageQuota.isApproachingQuota(80).then(isApproaching => {
      if (isApproaching) {
        console.warn(`Approaching storage quota, limiting feed cache for ${feedType}`);
        // Just cache a subset if approaching quota
        try {
          const limitedEvents = events.slice(0, 10);
          this._feedCache.cacheFeed(feedType, limitedEvents, options, important);
        } catch (error) {
          console.error(`Error caching limited feed for ${feedType}:`, error);
        }
        return;
      }

      try {
        this._feedCache.cacheFeed(feedType, events, options, important);
      } catch (error) {
        console.error(`Error caching feed ${feedType}:`, error);
        this.cleanupExpiredEntries();
        
        // Try again with half the events
        if (events.length > 5) {
          const reducedEvents = events.slice(0, Math.floor(events.length / 2));
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
  cleanupExpiredEntries(): void {
    console.log("Cleaning up expired cache entries...");
    this.eventCache.cleanupExpiredEntries();
    this.profileCache.cleanupExpiredEntries();
    this.threadCache.cleanupExpiredEntries();
    this._feedCache.cleanupExpiredEntries();
    
    // Log storage metrics after cleanup
    storageQuota.logStorageMetrics();
  }
  
  clearAll(): void {
    this.eventCache.clear();
    this.profileCache.clear();
    this.threadCache.clear();
    this._feedCache.clear();
    this.muteListCache.clear();
    this.blockListCache.clear();
  }
  
  isOffline(): boolean {
    return this.offlineMode;
  }
}

// Create and export singleton instance
const contentCache = new ContentCache();
export { contentCache };

// Set up periodic cache cleanup
setInterval(() => {
  contentCache.cleanupExpiredEntries();
}, Math.min(CACHE_EXPIRY, 60000)); // Every minute or at cache expiry time, whichever is less

// Set up periodic quota checking
setInterval(() => {
  storageQuota.isApproachingQuota(85).then(isApproaching => {
    if (isApproaching) {
      console.warn("Storage quota approaching limit, running proactive cleanup");
      contentCache.cleanupExpiredEntries();
    }
  }).catch(err => {
    console.error("Error checking quota:", err);
  });
}, 300000); // Every 5 minutes
