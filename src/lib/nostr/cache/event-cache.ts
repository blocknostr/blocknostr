
import { NostrEvent } from "../types";
import { BaseCache } from "./base-cache";
import { CacheConfig } from "./types";
import { STORAGE_KEYS } from "./config";

/**
 * Cache service for Nostr events
 */
export class EventCache extends BaseCache<NostrEvent> {
  constructor(config: CacheConfig) {
    super(config, STORAGE_KEYS.EVENTS);
    this.loadFromStorage();
  }
  
  /**
   * Cache multiple events at once
   */
  cacheEvents(events: NostrEvent[], important: boolean = false): void {
    events.forEach(event => {
      if (event.id) {
        this.cacheItem(event.id, event, important);
      }
    });
  }
  
  /**
   * Get events by authors (for following feed)
   * @param authorPubkeys List of public keys to filter events by
   * @returns Array of events authored by the given pubkeys
   */
  getEventsByAuthors(authorPubkeys: string[]): NostrEvent[] {
    if (!authorPubkeys || authorPubkeys.length === 0) {
      return [];
    }
    
    const result: NostrEvent[] = [];
    const now = Date.now();
    const expiry = this.offlineMode ? this.config.offlineExpiry : this.config.standardExpiry;
    
    // Loop through all cached events and filter by authors
    this.cache.forEach((entry, id) => {
      // Skip expired entries (unless in offline mode)
      if (now - entry.timestamp > expiry && !this.offlineMode && !entry.important) {
        return;
      }
      
      // Check if the event author is in the list of authors we're looking for
      if (entry.data.pubkey && authorPubkeys.includes(entry.data.pubkey)) {
        result.push(entry.data);
      }
    });
    
    // Sort by creation time (newest first)
    result.sort((a, b) => b.created_at - a.created_at);
    
    return result;
  }
}
