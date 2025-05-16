
import { NostrEvent } from "../types";
import { BaseCache } from "./base-cache";
import { CacheConfig, CacheEntry } from "./types";
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
      hashtags?: string[],
      since?: number,
      until?: number,
      mediaOnly?: boolean
    },
    important: boolean = false
  ): void {
    // Generate a cache key based on feed type and filters
    const cacheKey = this.generateCacheKey(feedType, options);
    
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
      hashtags?: string[],
      since?: number,
      until?: number,
      mediaOnly?: boolean
    }
  ): NostrEvent[] | null {
    // Generate the cache key
    const cacheKey = this.generateCacheKey(feedType, options);
    
    // Retrieve the events from cache
    return this.getItem(cacheKey);
  }

  /**
   * Clear a specific feed from cache
   * @param feedType Type of feed to clear
   * @param options Filter options for the feed
   */
  clearFeed(
    feedType: string,
    options: {
      authorPubkeys?: string[],
      hashtag?: string,
      hashtags?: string[],
      since?: number,
      until?: number,
      mediaOnly?: boolean
    }
  ): void {
    const cacheKey = this.generateCacheKey(feedType, options);
    this.cache.delete(cacheKey);
    this.persistToStorage();
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
      hashtags?: string[],
      since?: number,
      until?: number,
      mediaOnly?: boolean
    }
  ): boolean {
    const cacheKey = this.generateCacheKey(feedType, options);
    return this.cache.has(cacheKey);
  }

  /**
   * Get raw cache entry with metadata
   * @param key Cache key to retrieve
   * @returns Cache entry with timestamp and metadata or null if not found
   */
  getRawEntry(key: string): CacheEntry<NostrEvent[]> | null {
    if (!this.cache.has(key)) {
      return null;
    }
    
    return this.cache.get(key) || null;
  }

  /**
   * Generate a cache key for a feed based on filters
   * This key will be used to store and retrieve cached feeds
   */
  generateCacheKey(
    feedType: string,
    options: {
      authorPubkeys?: string[],
      hashtag?: string,
      hashtags?: string[],
      since?: number,
      until?: number,
      mediaOnly?: boolean
    }
  ): string {
    const parts = [feedType];
    
    // Add author filter to key if available
    if (options.authorPubkeys && options.authorPubkeys.length > 0) {
      // Sort pubkeys for consistent cache keys
      const sortedAuthors = [...options.authorPubkeys].sort();
      // Use the first 3 authors for the key to keep it reasonable length
      const authorKey = sortedAuthors.slice(0, 3).join(',');
      parts.push(`authors:${authorKey}`);
      
      // Add author count if more than 3
      if (sortedAuthors.length > 3) {
        parts.push(`author_count:${sortedAuthors.length}`);
      }
    }
    
    // Add single hashtag to key if available (legacy support)
    if (options.hashtag) {
      parts.push(`tag:${options.hashtag.toLowerCase()}`);
    }
    
    // Add multiple hashtags to key if available (new feature)
    if (options.hashtags && options.hashtags.length > 0) {
      const sortedTags = [...options.hashtags].sort(); // Sort for consistency
      const tagsKey = sortedTags.slice(0, 5).map(t => t.toLowerCase()).join(',');
      parts.push(`tags:${tagsKey}`);
      
      // Add tags count if more than 5
      if (sortedTags.length > 5) {
        parts.push(`tags_count:${sortedTags.length}`);
      }
    }
    
    // Add time range to key
    if (options.since || options.until) {
      const timeKey = `time:${options.since || 0}-${options.until || 'now'}`;
      parts.push(timeKey);
    }
    
    // Add mediaOnly flag if true
    if (options.mediaOnly) {
      parts.push('media-only');
    }
    
    return parts.join('::');
  }
}
