
/**
 * Simple cache implementation for content
 * Stores content with expiration to avoid re-fetching
 */
class ContentCache {
  private cache: Map<string, { content: any; expires: number }> = new Map();
  private profileCache: Map<string, any> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL

  /**
   * Get a cached item
   * @param key Cache key
   * @returns The cached content or undefined if not found or expired
   */
  get(key: string): any | undefined {
    const item = this.cache.get(key);
    if (!item) {
      return undefined;
    }

    // Check if item has expired
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return undefined;
    }

    return item.content;
  }

  /**
   * Set an item in the cache
   * @param key Cache key
   * @param content Content to cache
   * @param ttl Time to live in milliseconds (optional)
   */
  set(key: string, content: any, ttl: number = this.defaultTTL): void {
    const expires = Date.now() + ttl;
    this.cache.set(key, { content, expires });
  }

  /**
   * Check if an item exists in the cache and is not expired
   * @param key Cache key
   * @returns Boolean indicating if item exists and is valid
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }
    
    // Check if item has expired
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Remove an item from the cache
   * @param key Cache key
   */
  remove(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean expired items from the cache
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Cache a profile
   * @param pubkey Public key of the user
   * @param profile Profile data
   * @param important Whether this profile should be kept longer
   */
  cacheProfile(pubkey: string, profile: any, important: boolean = false): void {
    this.profileCache.set(pubkey, {
      ...profile,
      _cached: Date.now(),
      _important: important
    });
  }

  /**
   * Get a cached profile
   * @param pubkey Public key of the user
   * @returns The cached profile or null if not found
   */
  getProfile(pubkey: string): any | null {
    return this.profileCache.get(pubkey) || null;
  }

  /**
   * Cache an event
   * @param event Nostr event
   */
  cacheEvent(event: any): void {
    if (!event || !event.id) return;
    this.set(`event:${event.id}`, event);
  }
  
  /**
   * Get a cached event
   * @param eventId Event ID
   * @returns The cached event or null if not found
   */
  getEvent(eventId: string): any | null {
    return this.get(`event:${eventId}`);
  }

  /**
   * Get events by authors
   * @param authors Array of author pubkeys
   * @returns Array of events
   */
  getEventsByAuthors(authors: string[]): any[] {
    if (!authors || !authors.length) return [];
    
    const events: any[] = [];
    this.cache.forEach((value, key) => {
      if (key.startsWith('event:') && value.content && 
          authors.includes(value.content.pubkey)) {
        events.push(value.content);
      }
    });
    
    return events;
  }

  // Enhanced feed caching with proper type structure
  feedCache = {
    _cache: new Map<string, {events: any[], timestamp: number, expires: number}>(),
    
    generateCacheKey(feedType: string, options: any = {}): string {
      const { authorPubkeys, hashtag, since, until, mediaOnly } = options;
      let key = `feed:${feedType}`;
      
      if (authorPubkeys && authorPubkeys.length) {
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
    },
    
    set(key: string, events: any[], ttl: number): void {
      this._cache.set(key, {
        events,
        timestamp: Date.now(),
        expires: Date.now() + ttl
      });
    },
    
    get(key: string): any[] | undefined {
      const entry = this._cache.get(key);
      if (!entry || Date.now() > entry.expires) {
        this._cache.delete(key);
        return undefined;
      }
      return entry.events;
    },
    
    getRawEntry(key: string): {events: any[], timestamp: number, expires: number} | undefined {
      return this._cache.get(key);
    },
    
    cacheFeed(feedType: string, events: any[], options: any = {}, important: boolean = false): void {
      const key = this.generateCacheKey(feedType, options);
      const ttl = important ? 30 * 60 * 1000 : 5 * 60 * 1000; // 30 mins if important, 5 mins otherwise
      this.set(key, events, ttl);
    },
    
    getFeed(feedType: string, options: any = {}): any[] | undefined {
      const key = this.generateCacheKey(feedType, options);
      return this.get(key);
    },
    
    clearFeed(feedType: string, options: any = {}): void {
      const key = this.generateCacheKey(feedType, options);
      this._cache.delete(key);
    }
  };
}

// Export a singleton instance
export const contentCache = new ContentCache();
