
import { NostrEvent } from "../types";
import { CACHE_EXPIRY, OFFLINE_CACHE_EXPIRY, STORAGE_KEYS } from "./config";
import { EventCache } from "./event-cache";
import { ProfileCache } from "./profile-cache";
import { ThreadCache } from "./thread-cache";
import { FeedCache } from "./feed-cache";
import { ListCache } from "./list-cache";
import { CacheConfig } from "./types";

/**
 * Content cache service for Nostr events
 * Reduces relay requests by caching already loaded content
 * Supports offline functionality through persistence
 */
export class ContentCache {
  private eventCache: EventCache;
  private profileCache: ProfileCache;
  private threadCache: ThreadCache;
  private feedCache: FeedCache;
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
    this.feedCache = new FeedCache(config);
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
  }
  
  // Update offline mode status across all caches
  private updateOfflineMode(): void {
    this.eventCache.setOfflineMode(this.offlineMode);
    this.profileCache.setOfflineMode(this.offlineMode);
    this.threadCache.setOfflineMode(this.offlineMode);
    this.feedCache.setOfflineMode(this.offlineMode);
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
    this.eventCache.cacheEvents(events, important);
  }
  
  getEventsByAuthors(authorPubkeys: string[]): NostrEvent[] {
    return this.eventCache.getEventsByAuthors(authorPubkeys);
  }
  
  // Profile cache methods
  cacheProfile(pubkey: string, profileData: any, important: boolean = false): void {
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
  cacheFeed(feedType: string, eventIds: string[], important: boolean = false): void {
    this.feedCache.cacheItem(feedType, eventIds, important);
  }
  
  getFeed(feedType: string): string[] | null {
    return this.feedCache.getItem(feedType);
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
    this.feedCache.cleanupExpiredEntries();
  }
  
  clearAll(): void {
    this.eventCache.clear();
    this.profileCache.clear();
    this.threadCache.clear();
    this.feedCache.clear();
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
}, CACHE_EXPIRY);
