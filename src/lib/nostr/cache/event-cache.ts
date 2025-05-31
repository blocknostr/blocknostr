
import { NostrEvent } from "../types";
import { BaseCache } from "./base-cache";
import { CacheConfig } from "./types";
import { STORAGE_KEYS } from "./config";
import { EventFilter } from "./utils/event-filter";

/**
 * Cache service for Nostr events
 */
export class EventCache extends BaseCache<NostrEvent> {
  constructor(config: CacheConfig) {
    super(config, STORAGE_KEYS.EVENTS);
    this.loadFromStorage();
  }
  
  /**
   * Cache multiple events at once with NIP-16 compliance
   * Handle replaceable events properly
   */
  cacheEvents(events: NostrEvent[], important: boolean = false): void {
    // First pass: Group events by their ID to handle duplicates
    const replaceableKinds = new Set([0, 3, 41]); // Kinds defined as replaceable in NIP-16
    const eventsByPubkeyAndKind: Map<string, NostrEvent> = new Map();
    const regularEvents: NostrEvent[] = [];
    
    events.forEach(event => {
      if (!event.id) return;
      
      // Handle NIP-16 replaceable events
      if (replaceableKinds.has(event.kind)) {
        // Create a unique key for this pubkey+kind combination
        const key = `${event.pubkey}:${event.kind}`;
        const existing = eventsByPubkeyAndKind.get(key);
        
        // Only store the newest event for each pubkey+kind
        if (!existing || event.created_at > existing.created_at) {
          eventsByPubkeyAndKind.set(key, event);
        }
      } else if (event.kind >= 10000 && event.kind < 20000) {
        // Handle parameterized replaceable events
        const dTag = event.tags.find(tag => tag[0] === 'd')?.[1] || '';
        // Create a unique key for this pubkey+kind+d-tag combination
        const key = `${event.pubkey}:${event.kind}:${dTag}`;
        const existing = eventsByPubkeyAndKind.get(key);
        
        // Only store the newest event for each pubkey+kind+d-tag
        if (!existing || event.created_at > existing.created_at) {
          eventsByPubkeyAndKind.set(key, event);
        }
      } else {
        // For non-replaceable events, just add them directly
        regularEvents.push(event);
      }
    });
    
    // Second pass: Cache all events
    // First the regular non-replaceable events
    regularEvents.forEach(event => {
      if (event.id) {
        this.cacheItem(event.id, event, important);
      }
    });
    
    // Then cache the deduplicated replaceable events
    eventsByPubkeyAndKind.forEach(event => {
      if (event.id) {
        this.cacheItem(event.id, event, important);
      }
    });
  }
  
  /**
   * Get all events in the cache
   * @returns Array of all cached events
   */
  getAllEvents(): NostrEvent[] {
    const events: NostrEvent[] = [];
    const now = Date.now();
    const expiry = this.offlineMode ? this.config.offlineExpiry : this.config.standardExpiry;
    
    this.cache.forEach((entry) => {
      // Skip expired entries (unless in offline mode or marked as important)
      if (now - entry.timestamp > expiry && !this.offlineMode && !entry.important) {
        return;
      }
      
      events.push(entry.data);
    });
    
    return events;
  }
  
  /**
   * Get events by authors (for following feed)
   * @param authorPubkeys List of public keys to filter events by
   * @returns Array of events authored by the given pubkeys
   */
  getEventsByAuthors(authorPubkeys: string[]): NostrEvent[] {
    const allEvents = this.getAllEvents();
    return EventFilter.filterByAuthors(allEvents, authorPubkeys);
  }
  
  /**
   * Get events by hashtag
   * @param hashtag Hashtag to filter by (without the # symbol)
   * @returns Array of events containing the given hashtag
   */
  getEventsByHashtag(hashtag: string): NostrEvent[] {
    const allEvents = this.getAllEvents();
    return EventFilter.filterByHashtag(allEvents, hashtag);
  }
  
  /**
   * Get events matching specific criteria
   */
  getFilteredEvents(options: {
    authorPubkeys?: string[],
    hashtag?: string,
    since?: number,
    until?: number,
    limit?: number
  }): NostrEvent[] {
    const allEvents = this.getAllEvents();
    return EventFilter.applyFilters(allEvents, options);
  }
}

