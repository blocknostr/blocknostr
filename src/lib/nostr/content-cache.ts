
import { NostrEvent, CacheOptions, ContentCache as IContentCache } from './types';

/**
 * Interface for cached entries
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

/**
 * Feed cache class to handle feed caching
 */
class FeedCache {
  private cache: Map<string, CacheEntry<NostrEvent[]>> = new Map();
  private defaultExpiry = 5 * 60 * 1000; // 5 minutes default expiry
  
  /**
   * Generate a cache key based on feed type and options
   */
  generateCacheKey(feedType: string, options: CacheOptions): string {
    const { authorPubkeys, hashtag, since, until, mediaOnly } = options;
    
    let key = `feed:${feedType}`;
    
    if (authorPubkeys && authorPubkeys.length > 0) {
      key += `:authors:${authorPubkeys.sort().join(',')}`;
    }
    
    if (hashtag) {
      key += `:hashtag:${hashtag}`;
    }
    
    if (since) {
      key += `:since:${since}`;
    }
    
    if (until) {
      key += `:until:${until}`;
    }
    
    if (mediaOnly) {
      key += `:mediaOnly`;
    }
    
    return key;
  }

  /**
   * Get a feed from cache by type and options
   */
  getFeed(feedType: string, options: CacheOptions): NostrEvent[] | null {
    const key = this.generateCacheKey(feedType, options);
    const entry = this.cache.get(key);
    
    if (entry && Date.now() < entry.expiry) {
      return entry.data;
    }
    
    return null;
  }

  /**
   * Cache a feed with type and options
   */
  cacheFeed(feedType: string, options: CacheOptions, events: NostrEvent[], expiryMs: number = this.defaultExpiry): void {
    const key = this.generateCacheKey(feedType, options);
    
    this.cache.set(key, {
      data: events,
      timestamp: Date.now(),
      expiry: Date.now() + expiryMs
    });
  }

  /**
   * Clear a feed from cache
   */
  clearFeed(feedType: string, options: CacheOptions): void {
    const key = this.generateCacheKey(feedType, options);
    this.cache.delete(key);
  }

  /**
   * Get raw cache entry (for timestamp access)
   */
  getRawEntry(key: string): CacheEntry<NostrEvent[]> | undefined {
    return this.cache.get(key);
  }

  /**
   * Clear all cached feeds
   */
  clearAll(): void {
    this.cache.clear();
  }
}

/**
 * Event cache for individual events
 */
class EventCache {
  private cache: Map<string, CacheEntry<NostrEvent>> = new Map();
  private defaultExpiry = 30 * 60 * 1000; // 30 minutes
  
  /**
   * Cache an event
   */
  cacheEvent(event: NostrEvent, expiryMs: number = this.defaultExpiry): void {
    this.cache.set(event.id, {
      data: event,
      timestamp: Date.now(),
      expiry: Date.now() + expiryMs
    });
  }
  
  /**
   * Get an event by ID
   */
  getEvent(id: string): NostrEvent | null {
    const entry = this.cache.get(id);
    
    if (entry && Date.now() < entry.expiry) {
      return entry.data;
    }
    
    return null;
  }
  
  /**
   * Cache multiple events at once
   */
  cacheEvents(events: NostrEvent[], important: boolean = false): void {
    events.forEach(event => this.cacheEvent(event));
  }
  
  /**
   * Get all events by specific authors
   */
  getEventsByAuthors(authorPubkeys: string[]): NostrEvent[] {
    const pubkeySet = new Set(authorPubkeys);
    const now = Date.now();
    const results: NostrEvent[] = [];
    
    for (const [_, entry] of this.cache.entries()) {
      if (now < entry.expiry && entry.data.pubkey && pubkeySet.has(entry.data.pubkey)) {
        results.push(entry.data);
      }
    }
    
    return results;
  }
  
  /**
   * Check if an event exists in cache
   */
  hasEvent(id: string): boolean {
    const entry = this.cache.get(id);
    return !!entry && Date.now() < entry.expiry;
  }
  
  /**
   * Clear an event from cache
   */
  clearEvent(id: string): void {
    this.cache.delete(id);
  }
  
  /**
   * Clear all events
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [id, entry] of this.cache.entries()) {
      if (now >= entry.expiry) {
        this.cache.delete(id);
      }
    }
  }
}

/**
 * Profile cache for user data
 */
class ProfileCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultExpiry = 60 * 60 * 1000; // 60 minutes
  
  /**
   * Cache a profile
   */
  cacheProfile(pubkey: string, profileData: any, important: boolean = false): void {
    this.cache.set(pubkey, {
      data: profileData,
      timestamp: Date.now(),
      expiry: Date.now() + this.defaultExpiry
    });
  }
  
  /**
   * Get a profile by pubkey
   */
  getProfile(pubkey: string): any | null {
    const entry = this.cache.get(pubkey);
    
    if (entry && Date.now() < entry.expiry) {
      return entry.data;
    }
    
    return null;
  }
  
  /**
   * Clean up expired entries
   */
  cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [pubkey, entry] of this.cache.entries()) {
      if (now >= entry.expiry) {
        this.cache.delete(pubkey);
      }
    }
  }
  
  /**
   * Clear all profiles
   */
  clearAll(): void {
    this.cache.clear();
  }
}

/**
 * Thread cache for conversation threads
 */
class ThreadCache {
  private cache: Map<string, CacheEntry<NostrEvent[]>> = new Map();
  private defaultExpiry = 30 * 60 * 1000; // 30 minutes
  
  /**
   * Cache a thread
   */
  cacheThread(rootId: string, events: NostrEvent[], important: boolean = false): void {
    this.cache.set(rootId, {
      data: events,
      timestamp: Date.now(),
      expiry: Date.now() + this.defaultExpiry
    });
  }
  
  /**
   * Get a thread by root ID
   */
  getThread(rootId: string): NostrEvent[] | null {
    const entry = this.cache.get(rootId);
    
    if (entry && Date.now() < entry.expiry) {
      return entry.data;
    }
    
    return null;
  }
  
  /**
   * Clean up expired entries
   */
  cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [rootId, entry] of this.cache.entries()) {
      if (now >= entry.expiry) {
        this.cache.delete(rootId);
      }
    }
  }
  
  /**
   * Clear all threads
   */
  clearAll(): void {
    this.cache.clear();
  }
}

/**
 * Content cache service for storing Nostr content
 */
export class ContentCache implements IContentCache {
  readonly feedCache: FeedCache;
  private eventCache: EventCache;
  private profileCache: ProfileCache;
  private threadCache: ThreadCache;
  private offlineMode: boolean = false;
  
  constructor() {
    this.feedCache = new FeedCache();
    this.eventCache = new EventCache();
    this.profileCache = new ProfileCache();
    this.threadCache = new ThreadCache();
  }
  
  // Event cache methods
  cacheEvent(event: NostrEvent, important: boolean = false): void {
    this.eventCache.cacheEvent(event);
  }
  
  getEvent(eventId: string): NostrEvent | null {
    return this.eventCache.getEvent(eventId);
  }
  
  cacheEvents(events: NostrEvent[], important: boolean = false): void {
    this.eventCache.cacheEvents(events, important);
  }
  
  getEventsByAuthors(authorPubkeys: string[]): NostrEvent[] {
    return this.eventCache.getEventsByAuthors(authorPubkeys);
  }
  
  // Profile cache methods
  cacheProfile(pubkey: string, profileData: any, important: boolean = false): void {
    this.profileCache.cacheProfile(pubkey, profileData, important);
  }
  
  getProfile(pubkey: string): any | null {
    return this.profileCache.getProfile(pubkey);
  }
  
  // Thread cache methods
  cacheThread(rootId: string, events: NostrEvent[], important: boolean = false): void {
    this.threadCache.cacheThread(rootId, events, important);
  }
  
  getThread(rootId: string): NostrEvent[] | null {
    return this.threadCache.getThread(rootId);
  }
  
  // Feed cache methods
  cacheFeed(feedType: string, events: NostrEvent[], options: CacheOptions, important: boolean = false): void {
    this.feedCache.cacheFeed(feedType, options, events);
  }
  
  getFeed(feedType: string, options: CacheOptions): NostrEvent[] | null {
    return this.feedCache.getFeed(feedType, options);
  }
  
  // Utility methods
  cleanupExpiredEntries(): void {
    this.eventCache.cleanupExpiredEntries();
    this.profileCache.cleanupExpiredEntries();
    this.threadCache.cleanupExpiredEntries();
  }
  
  clearAll(): void {
    this.eventCache.clearAll();
    this.profileCache.clearAll();
    this.threadCache.clearAll();
    this.feedCache.clearAll();
  }
  
  isOffline(): boolean {
    return this.offlineMode;
  }
  
  /**
   * Set offline mode
   */
  setOfflineMode(offline: boolean): void {
    this.offlineMode = offline;
  }
}

// Export singleton instance
export const contentCache = new ContentCache();
