
import { NostrEvent } from "../../types";

/**
 * Utility class for filtering Nostr events
 * Implements NIP-01 filtering capabilities
 */
export class EventFilter {
  /**
   * Filter events by authors
   */
  static filterByAuthors(events: NostrEvent[], authors: string[]): NostrEvent[] {
    if (!authors || authors.length === 0) return [];
    
    // Create a Set for faster lookups
    const authorSet = new Set(authors);
    
    return events.filter(event => event.pubkey && authorSet.has(event.pubkey));
  }
  
  /**
   * Filter events by hashtag
   */
  static filterByHashtag(events: NostrEvent[], hashtag: string): NostrEvent[] {
    if (!hashtag) return events;
    
    const hashtagLower = hashtag.toLowerCase();
    
    return events.filter(event => {
      // Check for hashtag in content
      if (event.content && event.content.toLowerCase().includes(`#${hashtagLower}`)) {
        return true;
      }
      
      // Check for t tags (Nostr hashtags per NIP-10)
      if (Array.isArray(event.tags)) {
        return event.tags.some(tag => 
          Array.isArray(tag) && 
          tag.length >= 2 && 
          tag[0] === 't' && 
          tag[1].toLowerCase() === hashtagLower
        );
      }
      
      return false;
    });
  }

  /**
   * Filter events by multiple hashtags
   */
  static filterByHashtags(events: NostrEvent[], hashtags: string[]): NostrEvent[] {
    if (!hashtags || hashtags.length === 0) return events;
    
    // Convert hashtags to lowercase for case-insensitive comparison
    const hashtagsLower = hashtags.map(tag => tag.toLowerCase());
    
    return events.filter(event => {
      // Check for any of the hashtags in content
      if (event.content) {
        for (const hashtagLower of hashtagsLower) {
          if (event.content.toLowerCase().includes(`#${hashtagLower}`)) {
            return true;
          }
        }
      }
      
      // Check for t tags (Nostr hashtags per NIP-10)
      if (Array.isArray(event.tags)) {
        return event.tags.some(tag => 
          Array.isArray(tag) && 
          tag.length >= 2 && 
          tag[0] === 't' && 
          hashtagsLower.includes(tag[1].toLowerCase())
        );
      }
      
      return false;
    });
  }
  
  /**
   * Filter events by time range
   */
  static filterByTimeRange(events: NostrEvent[], since?: number, until?: number): NostrEvent[] {
    return events.filter(event => {
      if (since && event.created_at < since) return false;
      if (until && event.created_at > until) return false;
      return true;
    });
  }
  
  /**
   * Apply multiple filters to events and sort them
   */
  static applyFilters(events: NostrEvent[], options: {
    authorPubkeys?: string[],
    hashtag?: string,
    hashtags?: string[],
    since?: number,
    until?: number,
    limit?: number,
    mediaOnly?: boolean
  }): NostrEvent[] {
    let filtered = [...events];
    
    // Apply author filter if provided
    if (options.authorPubkeys && options.authorPubkeys.length > 0) {
      filtered = this.filterByAuthors(filtered, options.authorPubkeys);
    }
    
    // Apply single hashtag filter if provided
    if (options.hashtag) {
      filtered = this.filterByHashtag(filtered, options.hashtag);
    }
    // Apply multiple hashtags filter if provided
    else if (options.hashtags && options.hashtags.length > 0) {
      filtered = this.filterByHashtags(filtered, options.hashtags);
    }
    
    // Apply time range filter if provided
    filtered = this.filterByTimeRange(filtered, options.since, options.until);
    
    // Apply media only filter if required
    if (options.mediaOnly) {
      filtered = this.filterMediaPosts(filtered);
    }
    
    // Sort by creation time (newest first)
    filtered.sort((a, b) => b.created_at - a.created_at);
    
    // Apply limit if provided
    if (options.limit && options.limit > 0) {
      filtered = filtered.slice(0, options.limit);
    }
    
    return filtered;
  }
  
  /**
   * Filter for posts containing media
   */
  static filterMediaPosts(events: NostrEvent[]): NostrEvent[] {
    return events.filter(event => {
      if (!event.content) return false;
      
      // Look for media URLs in content
      const hasMediaUrl = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|mp4|webm|ogg|mov))/i.test(event.content);
      if (hasMediaUrl) return true;
      
      // Look for common media hosting services
      const hasMediaHost = /(https?:\/\/(?:i\.imgur\.com|i\.redd\.it|pbs\.twimg\.com|media\.tenor\.com|gfycat\.com|imgur\.com|giphy\.com|tenor\.com))/i.test(event.content);
      if (hasMediaHost) return true;
      
      // Check for media tags (NIP-10)
      if (Array.isArray(event.tags)) {
        return event.tags.some(tag => 
          Array.isArray(tag) && 
          tag.length >= 2 && 
          (tag[0] === 'image' || tag[0] === 'media')
        );
      }
      
      return false;
    });
  }
  
  /**
   * Generate a cache key for a feed based on filters
   * This key will be used to store and retrieve cached feeds
   */
  static generateFeedCacheKey(options: {
    feedType: string,
    authorPubkeys?: string[],
    hashtag?: string,
    hashtags?: string[],
    since?: number,
    until?: number,
    mediaOnly?: boolean
  }): string {
    const parts = [options.feedType];
    
    // Add author filter to key if available
    if (options.authorPubkeys && options.authorPubkeys.length > 0) {
      // Use the first 3 authors for the key to keep it reasonable length
      const authorKey = options.authorPubkeys.slice(0, 3).join(',');
      parts.push(`authors:${authorKey}`);
    }
    
    // Add hashtag to key if available
    if (options.hashtag) {
      parts.push(`tag:${options.hashtag}`);
    }
    
    // Add multiple hashtags to key if available
    if (options.hashtags && options.hashtags.length > 0) {
      parts.push(`tags:${options.hashtags.join(',')}`);
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
