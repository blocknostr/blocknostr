import { NostrEvent } from "../types";

// Cache expiration time in milliseconds (10 minutes)
const CACHE_EXPIRY = 10 * 60 * 1000;

// Cache expiration time for offline mode (1 week)
const OFFLINE_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  important?: boolean; // Flag for content that should be kept longer
}

/**
 * Content cache service for Nostr events
 * Reduces relay requests by caching already loaded content
 * Supports offline functionality through persistence
 */
export class ContentCache {
  private eventCache: Map<string, CacheEntry<NostrEvent>> = new Map();
  private profileCache: Map<string, CacheEntry<any>> = new Map();
  private threadCache: Map<string, CacheEntry<NostrEvent[]>> = new Map();
  private feedCache: Map<string, CacheEntry<string[]>> = new Map();
  private offlineMode: boolean = false;
  
  // Mute list cache
  private _muteList: string[] | null = null;
  
  // Block list cache
  private _blockList: string[] | null = null;
  
  constructor() {
    // Load cache from IndexedDB on initialization
    this.loadFromStorage();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.offlineMode = false;
      console.log('App is online - using standard caching policy');
    });
    
    window.addEventListener('offline', () => {
      this.offlineMode = true;
      console.log('App is offline - using extended caching policy');
    });
    
    // Set initial offline status
    this.offlineMode = !navigator.onLine;
  }
  
  // Cache an event
  cacheEvent(event: NostrEvent, important: boolean = false): void {
    if (!event.id) return;
    
    this.eventCache.set(event.id, {
      data: event,
      timestamp: Date.now(),
      important
    });
    
    // If it's an important event (like a post from the user), store it persistently
    if (important) {
      this.persistToStorage();
    }
  }
  
  // Retrieve an event from cache
  getEvent(eventId: string): NostrEvent | null {
    const entry = this.eventCache.get(eventId);
    
    if (!entry) return null;
    
    // In offline mode, we keep entries longer
    const expiry = this.offlineMode || entry.important ? 
      OFFLINE_CACHE_EXPIRY : CACHE_EXPIRY;
    
    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > expiry) {
      if (!this.offlineMode && !entry.important) {
        this.eventCache.delete(eventId);
      }
      return this.offlineMode ? entry.data : null;
    }
    
    return entry.data;
  }
  
  // Cache multiple events at once
  cacheEvents(events: NostrEvent[], important: boolean = false): void {
    events.forEach(event => {
      if (event.id) {
        this.cacheEvent(event, important);
      }
    });
  }
  
  // Cache profile data
  cacheProfile(pubkey: string, profileData: any, important: boolean = false): void {
    this.profileCache.set(pubkey, {
      data: profileData,
      timestamp: Date.now(),
      important
    });
    
    // If it's an important profile (like the user's own profile), store it persistently
    if (important) {
      this.persistToStorage();
    }
  }
  
  // Retrieve profile data from cache
  getProfile(pubkey: string): any | null {
    const entry = this.profileCache.get(pubkey);
    
    if (!entry) return null;
    
    // In offline mode, we keep entries longer
    const expiry = this.offlineMode || entry.important ? 
      OFFLINE_CACHE_EXPIRY : CACHE_EXPIRY;
    
    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > expiry) {
      if (!this.offlineMode && !entry.important) {
        this.profileCache.delete(pubkey);
      }
      return this.offlineMode ? entry.data : null;
    }
    
    return entry.data;
  }
  
  // Cache thread data (for NIP-10 support)
  cacheThread(rootId: string, events: NostrEvent[], important: boolean = false): void {
    this.threadCache.set(rootId, {
      data: events,
      timestamp: Date.now(),
      important
    });
  }
  
  // Retrieve thread data from cache
  getThread(rootId: string): NostrEvent[] | null {
    const entry = this.threadCache.get(rootId);
    
    if (!entry) return null;
    
    // In offline mode, we keep entries longer
    const expiry = this.offlineMode || entry.important ? 
      OFFLINE_CACHE_EXPIRY : CACHE_EXPIRY;
    
    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > expiry) {
      if (!this.offlineMode && !entry.important) {
        this.threadCache.delete(rootId);
      }
      return this.offlineMode ? entry.data : null;
    }
    
    return entry.data;
  }
  
  // Cache feed event IDs for specific feed types
  cacheFeed(feedType: string, eventIds: string[], important: boolean = false): void {
    this.feedCache.set(feedType, {
      data: eventIds,
      timestamp: Date.now(),
      important
    });
    
    // If it's an important feed (like following feed), store it persistently
    if (important) {
      this.persistToStorage();
    }
  }
  
  // Get cached feed event IDs
  getFeed(feedType: string): string[] | null {
    const entry = this.feedCache.get(feedType);
    
    if (!entry) return null;
    
    // In offline mode, we keep entries longer
    const expiry = this.offlineMode || entry.important ? 
      OFFLINE_CACHE_EXPIRY : CACHE_EXPIRY;
    
    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > expiry) {
      if (!this.offlineMode && !entry.important) {
        this.feedCache.delete(feedType);
      }
      return this.offlineMode ? entry.data : null;
    }
    
    return entry.data;
  }
  
  // Persist important cache items to IndexedDB for offline access
  private persistToStorage(): void {
    try {
      // Store events
      const importantEvents = Array.from(this.eventCache.entries())
        .filter(([_, entry]) => entry.important)
        .reduce((obj, [key, entry]) => {
          obj[key] = entry;
          return obj;
        }, {} as Record<string, CacheEntry<NostrEvent>>);
      
      if (Object.keys(importantEvents).length > 0) {
        localStorage.setItem('nostr_cached_events', JSON.stringify(importantEvents));
      }
      
      // Store profiles
      const importantProfiles = Array.from(this.profileCache.entries())
        .filter(([_, entry]) => entry.important)
        .reduce((obj, [key, entry]) => {
          obj[key] = entry;
          return obj;
        }, {} as Record<string, CacheEntry<any>>);
      
      if (Object.keys(importantProfiles).length > 0) {
        localStorage.setItem('nostr_cached_profiles', JSON.stringify(importantProfiles));
      }
      
      // Store feeds
      const importantFeeds = Array.from(this.feedCache.entries())
        .filter(([_, entry]) => entry.important)
        .reduce((obj, [key, entry]) => {
          obj[key] = entry;
          return obj;
        }, {} as Record<string, CacheEntry<string[]>>);
      
      if (Object.keys(importantFeeds).length > 0) {
        localStorage.setItem('nostr_cached_feeds', JSON.stringify(importantFeeds));
      }
    } catch (error) {
      console.error('Failed to persist cache to storage:', error);
    }
  }
  
  // Load cache from storage on initialization
  private loadFromStorage(): void {
    try {
      // Load events
      const cachedEvents = localStorage.getItem('nostr_cached_events');
      if (cachedEvents) {
        const parsedEvents = JSON.parse(cachedEvents) as Record<string, CacheEntry<NostrEvent>>;
        Object.entries(parsedEvents).forEach(([key, entry]) => {
          this.eventCache.set(key, entry);
        });
      }
      
      // Load profiles
      const cachedProfiles = localStorage.getItem('nostr_cached_profiles');
      if (cachedProfiles) {
        const parsedProfiles = JSON.parse(cachedProfiles) as Record<string, CacheEntry<any>>;
        Object.entries(parsedProfiles).forEach(([key, entry]) => {
          this.profileCache.set(key, entry);
        });
      }
      
      // Load feeds
      const cachedFeeds = localStorage.getItem('nostr_cached_feeds');
      if (cachedFeeds) {
        const parsedFeeds = JSON.parse(cachedFeeds) as Record<string, CacheEntry<string[]>>;
        Object.entries(parsedFeeds).forEach(([key, entry]) => {
          this.feedCache.set(key, entry);
        });
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
    }
  }
  
  // Clear expired cache entries
  cleanupExpiredEntries(): void {
    const now = Date.now();
    const standardExpiry = CACHE_EXPIRY;
    const offlineExpiry = OFFLINE_CACHE_EXPIRY;
    
    // Cleanup events
    this.eventCache.forEach((entry, key) => {
      const expiry = this.offlineMode || entry.important ? offlineExpiry : standardExpiry;
      if (now - entry.timestamp > expiry && !this.offlineMode) {
        this.eventCache.delete(key);
      }
    });
    
    // Cleanup profiles
    this.profileCache.forEach((entry, key) => {
      const expiry = this.offlineMode || entry.important ? offlineExpiry : standardExpiry;
      if (now - entry.timestamp > expiry && !this.offlineMode) {
        this.profileCache.delete(key);
      }
    });
    
    // Cleanup threads
    this.threadCache.forEach((entry, key) => {
      const expiry = this.offlineMode || entry.important ? offlineExpiry : standardExpiry;
      if (now - entry.timestamp > expiry && !this.offlineMode) {
        this.threadCache.delete(key);
      }
    });
    
    // Cleanup feeds
    this.feedCache.forEach((entry, key) => {
      const expiry = this.offlineMode || entry.important ? offlineExpiry : standardExpiry;
      if (now - entry.timestamp > expiry && !this.offlineMode) {
        this.feedCache.delete(key);
      }
    });
  }
  
  // Clear all caches
  clearAll(): void {
    this.eventCache.clear();
    this.profileCache.clear();
    this.threadCache.clear();
    this.feedCache.clear();
    
    // Clear persistent storage
    localStorage.removeItem('nostr_cached_events');
    localStorage.removeItem('nostr_cached_profiles');
    localStorage.removeItem('nostr_cached_feeds');
  }
  
  // Check if we're in offline mode
  isOffline(): boolean {
    return this.offlineMode;
  }

  // Methods for mute list
  cacheMuteList(pubkeys: string[]): void {
    this._muteList = pubkeys;
    // Store in local storage for persistence
    localStorage.setItem('nostr_mute_list', JSON.stringify(pubkeys));
  }

  getMuteList(): string[] | null {
    // If we have it in memory, return it
    if (this._muteList) {
      return this._muteList;
    }

    // Try to load from local storage
    const storedList = localStorage.getItem('nostr_mute_list');
    if (storedList) {
      try {
        const parsedList = JSON.parse(storedList);
        this._muteList = parsedList;
        return parsedList;
      } catch (e) {
        console.error('Error parsing mute list from storage:', e);
      }
    }

    return null;
  }

  // Methods for block list
  cacheBlockList(pubkeys: string[]): void {
    this._blockList = pubkeys;
    // Store in local storage for persistence
    localStorage.setItem('nostr_block_list', JSON.stringify(pubkeys));
  }

  getBlockList(): string[] | null {
    // If we have it in memory, return it
    if (this._blockList) {
      return this._blockList;
    }

    // Try to load from local storage
    const storedList = localStorage.getItem('nostr_block_list');
    if (storedList) {
      try {
        const parsedList = JSON.parse(storedList);
        this._blockList = parsedList;
        return parsedList;
      } catch (e) {
        console.error('Error parsing block list from storage:', e);
      }
    }

    return null;
  }
}

// Create and export singleton instance
const contentCache = new ContentCache();
export { contentCache };

// Set up periodic cache cleanup
setInterval(() => {
  contentCache.cleanupExpiredEntries();
}, CACHE_EXPIRY);
