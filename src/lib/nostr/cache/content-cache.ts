
import { NostrEvent } from "../types";
import { CACHE_EXPIRY, OFFLINE_CACHE_EXPIRY, STORAGE_KEYS } from "./config";
import { EventCache } from "./event-cache";
import { ProfileCache } from "./profile-cache";
import { ThreadCache } from "./thread-cache";
import { FeedCache } from "./feed-cache";
import { ListCache } from "./list-cache";
import { CacheConfig } from "./types";
import { EventFilter } from "./utils/event-filter";
import { storageQuota } from "@/lib/utils/storageQuotaManager";

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
    
    // Register clean-up on quota warnings
    window.addEventListener('storage', (event) => {
      if (event.key === 'storage-warning') {
        console.log('Storage warning received, cleaning up cache');
        this.cleanupExpiredEntries();
      }
    });
    
    // Check quota status on initialization
    if (storageQuota.isApproachingQuota()) {
      console.warn('Storage quota approaching limit on startup, cleaning up cache');
      this.cleanupExpiredEntries();
    }
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
    // Limit batch size to avoid quota issues
    const batchSize = 50;
    const batches = Math.ceil(events.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, events.length);
      const batch = events.slice(start, end);
      
      this.eventCache.cacheEvents(batch, important);
      
      // Check if we're approaching quota
      if (storageQuota.isApproachingQuota()) {
        // We're approaching quota, stop caching to avoid errors
        console.warn(`Storage quota approaching limit, stopped caching at ${end}/${events.length} events`);
        break;
      }
    }
  }
  
  getEventsByAuthors(authorPubkeys: string[]): NostrEvent[] {
    return this.eventCache.getEventsByAuthors(authorPubkeys);
  }
  
  // Profile cache methods
  cacheProfile(pubkey: string, profileData: any, important: boolean = false): void {
    // Add creation timestamp to profile data for account age
    if (profileData && !profileData._createdAt && profileData.created_at) {
      profileData._createdAt = profileData.created_at;
    }
    
    this.profileCache.cacheItem(pubkey, profileData, important);
  }
  
  getProfile(pubkey: string): any | null {
    return this.profileCache.getItem(pubkey);
  }
  
  // Thread cache methods
  cacheThread(rootId: string, events: NostrEvent[], important: boolean = false): void {
    this.threadCache.cacheItem(rootId, events, important);
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
    if (storageQuota.isApproachingQuota() && events.length > 10) {
      console.warn(`Storage quota approaching limit, skipping feed cache for ${feedType}`);
      return;
    }
    
    try {
      this._feedCache.cacheFeed(feedType, events, options, important);
    } catch (error) {
      // If we hit storage limits, clean up and try again with fewer events
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
    this.muteListCache.cacheList(pubkeys);
  }

  getMuteList(): string[] | null {
    return this.muteListCache.getList();
  }

  // Block list methods
  cacheBlockList(pubkeys: string[]): void {
    this.blockListCache.cacheList(pubkeys);
  }

  getBlockList(): string[] | null {
    return this.blockListCache.getList();
  }
  
  // Cleanup methods
  cleanupExpiredEntries(): void {
    this.eventCache.cleanupExpiredEntries();
    this.profileCache.cleanupExpiredEntries();
    this.threadCache.cleanupExpiredEntries();
    this._feedCache.cleanupExpiredEntries();
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
