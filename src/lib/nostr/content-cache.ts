
import { NostrEvent } from './types';

/**
 * Interface for cache options
 */
interface CacheOptions {
  authorPubkeys?: string[];
  hashtag?: string;
  since?: number;
  until?: number;
  mediaOnly?: boolean;
}

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
  getFeed(feedType: string, options: CacheOptions): NostrEvent[] {
    const key = this.generateCacheKey(feedType, options);
    const entry = this.cache.get(key);
    
    if (entry && Date.now() < entry.expiry) {
      return entry.data;
    }
    
    return [];
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
}

/**
 * Content cache service for storing Nostr content
 */
class ContentCache {
  readonly feedCache: FeedCache;
  readonly eventCache: EventCache;
  private offlineMode: boolean = false;
  
  constructor() {
    this.feedCache = new FeedCache();
    this.eventCache = new EventCache();
  }
  
  /**
   * Get a feed from cache
   */
  getFeed(feedType: string, options: CacheOptions): NostrEvent[] {
    return this.feedCache.getFeed(feedType, options);
  }
  
  /**
   * Cache a feed
   */
  cacheFeed(feedType: string, options: CacheOptions, events: NostrEvent[], expiryMs?: number): void {
    this.feedCache.cacheFeed(feedType, options, events, expiryMs);
  }
  
  /**
   * Get an event by ID
   */
  getEvent(id: string): NostrEvent | null {
    return this.eventCache.getEvent(id);
  }
  
  /**
   * Cache an event
   */
  cacheEvent(event: NostrEvent): void {
    this.eventCache.cacheEvent(event);
  }
  
  /**
   * Check if offline mode is enabled
   */
  isOffline(): boolean {
    return this.offlineMode;
  }
  
  /**
   * Set offline mode
   */
  setOfflineMode(offline: boolean): void {
    this.offlineMode = offline;
  }
  
  /**
   * Clear all cached content
   */
  clearAll(): void {
    this.feedCache.clearAll();
    this.eventCache.clearAll();
  }
}

// Export singleton instance
export const contentCache = new ContentCache();
