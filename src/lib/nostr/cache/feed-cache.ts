
import { NostrEvent } from "../types";
import { BaseCache } from "./base-cache";
import { CacheConfig } from "./types";
import { STORAGE_KEYS } from "./config";
import { EventFilter } from "./utils/event-filter";

/**
 * Cache service for feed data
 * Implements NIP-01 event filtering
 */
export class FeedCache extends BaseCache<NostrEvent[]> {
  constructor(config: CacheConfig) {
    super(config, STORAGE_KEYS.FEEDS);
    this.loadFromStorage();
  }
  
  /**
   * Cache a feed with its events
   * @param feedType Type of feed (e.g., 'global', 'following', 'media')
   * @param events List of events in the feed
   * @param options Filter options used to generate this feed
   * @param important Whether this feed should be persisted for offline use
   */
  cacheFeed(
    feedType: string,
    events: NostrEvent[],
    options: {
      authorPubkeys?: string[],
      hashtag?: string,
      since?: number,
      until?: number,
      mediaOnly?: boolean
    },
    important: boolean = false
  ): void {
    // Generate a cache key based on feed type and filters
    const cacheKey = EventFilter.generateFeedCacheKey({
      feedType,
      ...options
    });
    
    // Cache the events
    this.cacheItem(cacheKey, events, important);
  }
  
  /**
   * Retrieve a cached feed
   * @param feedType Type of feed to retrieve
   * @param options Filter options used to generate the feed key
   * @returns Array of events if found in cache, null otherwise
   */
  getFeed(
    feedType: string,
    options: {
      authorPubkeys?: string[],
      hashtag?: string,
      since?: number,
      until?: number,
      mediaOnly?: boolean
    }
  ): NostrEvent[] | null {
    // Generate the cache key
    const cacheKey = EventFilter.generateFeedCacheKey({
      feedType,
      ...options
    });
    
    // Retrieve the events from cache
    return this.getItem(cacheKey);
  }
  
  /**
   * Clear cached feeds by type
   * @param feedType Type of feed to clear from cache (e.g., 'global', 'following')
   */
  clearFeedType(feedType: string): void {
    const keysToDelete: string[] = [];
    
    // Find all keys for this feed type
    this.cache.forEach((_, key) => {
      if (key.startsWith(feedType + '::')) {
        keysToDelete.push(key);
      }
    });
    
    // Delete the keys
    keysToDelete.forEach(key => this.cache.delete(key));
    
    // Update storage
    this.persistToStorage();
  }
  
  /**
   * Check if a feed is available in cache
   */
  hasFeed(
    feedType: string,
    options: {
      authorPubkeys?: string[],
      hashtag?: string,
      since?: number,
      until?: number,
      mediaOnly?: boolean
    }
  ): boolean {
    const cacheKey = EventFilter.generateFeedCacheKey({
      feedType,
      ...options
    });
    
    return this.cache.has(cacheKey);
  }
}
