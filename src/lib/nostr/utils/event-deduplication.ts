
import { NostrEvent } from "../types";

/**
 * Utility for handling event deduplication in Nostr feeds
 * Ensures consistent event display and prevents duplicates
 */
export class EventDeduplication {
  /**
   * Deduplicate an array of events by event ID
   * @param events Array of Nostr events
   * @returns Deduplicated array of events
   */
  static deduplicateById(events: NostrEvent[]): NostrEvent[] {
    const uniqueIds = new Set<string>();
    const result: NostrEvent[] = [];
    
    for (const event of events) {
      if (event.id && !uniqueIds.has(event.id)) {
        uniqueIds.add(event.id);
        result.push(event);
      }
    }
    
    return result;
  }
  
  /**
   * Deduplicate events by content hash
   * Useful for detecting duplicate content with different IDs
   * @param events Array of Nostr events
   * @returns Deduplicated array of events
   */
  static deduplicateByContentHash(events: NostrEvent[]): NostrEvent[] {
    const contentHashes = new Map<string, NostrEvent>();
    
    for (const event of events) {
      if (!event.content) continue;
      
      // Create a simple content hash using pubkey and content
      // This helps detect reposts of the same content by the same author
      const contentHash = `${event.pubkey}:${event.content.trim()}`;
      
      // If we haven't seen this content or this event is newer than the one we have
      if (!contentHashes.has(contentHash) || 
          event.created_at > (contentHashes.get(contentHash)?.created_at || 0)) {
        contentHashes.set(contentHash, event);
      }
    }
    
    return Array.from(contentHashes.values());
  }
  
  /**
   * Merge new events with existing events, deduplicating by ID
   * @param existingEvents Existing events array
   * @param newEvents New events to be merged
   * @returns Combined, deduplicated array of events
   */
  static mergeEvents(existingEvents: NostrEvent[], newEvents: NostrEvent[]): NostrEvent[] {
    const allEvents = [...existingEvents, ...newEvents];
    return this.deduplicateById(allEvents);
  }
  
  /**
   * Find the oldest event in an array of events
   * @param events Array of events to check
   * @returns The oldest event or undefined if array is empty
   */
  static findOldestEvent(events: NostrEvent[]): NostrEvent | undefined {
    if (events.length === 0) return undefined;
    
    return events.reduce((oldest, current) => {
      if (!oldest) return current;
      return current.created_at < oldest.created_at ? current : oldest;
    }, events[0]);
  }
  
  /**
   * Check if an event already exists in an array by ID
   * @param events Array of events to check
   * @param eventId ID to look for
   * @returns Boolean indicating if event exists
   */
  static hasEventId(events: NostrEvent[], eventId: string): boolean {
    return events.some(event => event.id === eventId);
  }
}
