
import { NostrEvent } from "../types";

// Cache expiration time in milliseconds (10 minutes)
const CACHE_EXPIRY = 10 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Content cache service for Nostr events
 * Reduces relay requests by caching already loaded content
 */
export class ContentCache {
  private eventCache: Map<string, CacheEntry<NostrEvent>> = new Map();
  private profileCache: Map<string, CacheEntry<any>> = new Map();
  private threadCache: Map<string, CacheEntry<NostrEvent[]>> = new Map();
  
  // Cache an event
  cacheEvent(event: NostrEvent): void {
    if (!event.id) return;
    
    this.eventCache.set(event.id, {
      data: event,
      timestamp: Date.now()
    });
  }
  
  // Retrieve an event from cache
  getEvent(eventId: string): NostrEvent | null {
    const entry = this.eventCache.get(eventId);
    
    if (!entry) return null;
    
    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
      this.eventCache.delete(eventId);
      return null;
    }
    
    return entry.data;
  }
  
  // Cache multiple events at once
  cacheEvents(events: NostrEvent[]): void {
    events.forEach(event => {
      if (event.id) {
        this.cacheEvent(event);
      }
    });
  }
  
  // Cache profile data
  cacheProfile(pubkey: string, profileData: any): void {
    this.profileCache.set(pubkey, {
      data: profileData,
      timestamp: Date.now()
    });
  }
  
  // Retrieve profile data from cache
  getProfile(pubkey: string): any | null {
    const entry = this.profileCache.get(pubkey);
    
    if (!entry) return null;
    
    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
      this.profileCache.delete(pubkey);
      return null;
    }
    
    return entry.data;
  }
  
  // Cache thread data (for NIP-10 support)
  cacheThread(rootId: string, events: NostrEvent[]): void {
    this.threadCache.set(rootId, {
      data: events,
      timestamp: Date.now()
    });
  }
  
  // Retrieve thread data from cache
  getThread(rootId: string): NostrEvent[] | null {
    const entry = this.threadCache.get(rootId);
    
    if (!entry) return null;
    
    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
      this.threadCache.delete(rootId);
      return null;
    }
    
    return entry.data;
  }
  
  // Clear expired cache entries
  cleanupExpiredEntries(): void {
    const now = Date.now();
    
    // Cleanup events
    this.eventCache.forEach((entry, key) => {
      if (now - entry.timestamp > CACHE_EXPIRY) {
        this.eventCache.delete(key);
      }
    });
    
    // Cleanup profiles
    this.profileCache.forEach((entry, key) => {
      if (now - entry.timestamp > CACHE_EXPIRY) {
        this.profileCache.delete(key);
      }
    });
    
    // Cleanup threads
    this.threadCache.forEach((entry, key) => {
      if (now - entry.timestamp > CACHE_EXPIRY) {
        this.threadCache.delete(key);
      }
    });
  }
  
  // Clear all caches
  clearAll(): void {
    this.eventCache.clear();
    this.profileCache.clear();
    this.threadCache.clear();
  }
}

// Create a singleton instance
export const contentCache = new ContentCache();

// Set up periodic cache cleanup
setInterval(() => {
  contentCache.cleanupExpiredEntries();
}, CACHE_EXPIRY);
