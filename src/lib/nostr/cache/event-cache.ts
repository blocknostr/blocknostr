
import { NostrEvent } from "../types";
import { BaseCache } from "./base-cache";
import { CacheConfig } from "./types";
import { STORAGE_KEYS } from "./config";
import { EventFilter } from "./utils/event-filter";

/**
 * Cache service for Nostr events
 * Optimized to prioritize important events and reduce memory footprint
 */
export class EventCache extends BaseCache<NostrEvent> {
  constructor(config: CacheConfig, cacheType?: 'EVENTS' | 'PROFILES' | 'FEEDS' | 'THREADS') {
    super(config, STORAGE_KEYS.EVENTS, cacheType);
    this.loadFromStorage();
  }
  
  /**
   * Cache multiple events at once
   */
  cacheEvents(events: NostrEvent[], important: boolean = false): void {
    // Sort events by importance and recency before caching
    // This ensures we're keeping the most relevant data
    const sortedEvents = this.prioritizeEvents(events);
    
    // Cache each event with appropriate importance flag
    sortedEvents.forEach(event => {
      if (event.id) {
        // Determine importance based on event kind and content
        const isImportantEvent = important || 
          event.kind === 0 || // Metadata
          event.kind === 3;   // Contacts
          
        this.cacheItem(event.id, event, isImportantEvent);
      }
    });
  }
  
  /**
   * Prioritize events for caching based on kind and metadata
   */
  private prioritizeEvents(events: NostrEvent[]): NostrEvent[] {
    // Sort by importance first, then recency
    return [...events].sort((a, b) => {
      // First prioritize by event kind importance
      const aImportance = this.getEventImportanceScore(a);
      const bImportance = this.getEventImportanceScore(b);
      
      if (aImportance !== bImportance) {
        return bImportance - aImportance; // Higher score first
      }
      
      // If equal importance, sort by recency
      return b.created_at - a.created_at;
    });
  }
  
  /**
   * Calculate importance score for an event
   * Higher score = more important to keep in cache
   */
  private getEventImportanceScore(event: NostrEvent): number {
    let score = 0;
    
    // Event kind importance
    switch (event.kind) {
      case 0:  // Metadata - very important
        score += 100;
        break;
      case 3:  // Contacts - important for social graph
        score += 90;
        break;
      case 1:  // Text notes - standard importance
        score += 50;
        break;
      case 7:  // Reactions - lower importance
        score += 30;
        break;
      default:
        // Other event kinds
        score += 10;
    }
    
    // Add bonus for verified accounts (NIP-05)
    const hasNip05Tag = event.tags?.some(tag => tag[0] === 'nip05');
    if (hasNip05Tag) {
      score += 20;
    }
    
    // Add bonus for events with rich content (links, images, etc.)
    if (event.content?.includes('http')) {
      score += 5;
    }
    
    // Add bonus for hashtags since they help with discoverability
    const hasHashtags = event.tags?.some(tag => tag[0] === 't');
    if (hasHashtags) {
      score += 5;
    }
    
    return score;
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
   * Clear all non-important events
   * Used during emergency cleanup
   */
  cleanupAllNonImportant(): number {
    let removedCount = 0;
    
    this.cache.forEach((entry, key) => {
      if (!entry.important) {
        this.cache.delete(key);
        this.accessTimestamps.delete(key);
        removedCount++;
      }
    });
    
    return removedCount;
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
