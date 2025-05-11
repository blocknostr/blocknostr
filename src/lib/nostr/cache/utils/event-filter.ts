
import { NostrEvent } from "../../types";

/**
 * Utility class for filtering Nostr events
 * Handles common operations like filtering by authors, hashtags, and timestamps
 */
export class EventFilter {
  /**
   * Filter events by author public keys
   * @param events List of events to filter
   * @param authorPubkeys List of public keys to filter events by
   * @returns Array of events authored by the given pubkeys
   */
  static filterByAuthors(events: NostrEvent[], authorPubkeys: string[]): NostrEvent[] {
    if (!authorPubkeys || authorPubkeys.length === 0 || events.length === 0) {
      return [];
    }
    
    return events.filter(event => 
      event.pubkey && authorPubkeys.includes(event.pubkey)
    );
  }
  
  /**
   * Filter events by hashtag
   * @param events List of events to filter
   * @param hashtag Hashtag to filter events by (without the # symbol)
   * @returns Array of events containing the specified hashtag
   */
  static filterByHashtag(events: NostrEvent[], hashtag: string): NostrEvent[] {
    if (!hashtag || events.length === 0) {
      return [];
    }
    
    const lowerHashtag = hashtag.toLowerCase();
    
    return events.filter(event => {
      // Check content for hashtag
      if (event.content && event.content.toLowerCase().includes(`#${lowerHashtag}`)) {
        return true;
      }
      
      // Check tags for hashtag
      if (event.tags) {
        for (const tag of event.tags) {
          if (tag.length >= 2 && tag[0] === 't' && tag[1].toLowerCase() === lowerHashtag) {
            return true;
          }
        }
      }
      
      return false;
    });
  }
  
  /**
   * Filter events by time range
   * @param events List of events to filter
   * @param since Start timestamp (inclusive)
   * @param until End timestamp (inclusive)
   * @returns Array of events within the specified time range
   */
  static filterByTimeRange(events: NostrEvent[], since?: number, until?: number): NostrEvent[] {
    if (events.length === 0) {
      return [];
    }
    
    return events.filter(event => {
      if (since && event.created_at < since) {
        return false;
      }
      
      if (until && event.created_at > until) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Sort events by creation time (newest first)
   * @param events List of events to sort
   * @returns Sorted array of events
   */
  static sortByCreationTime(events: NostrEvent[]): NostrEvent[] {
    return [...events].sort((a, b) => b.created_at - a.created_at);
  }
  
  /**
   * Apply multiple filters and sort events
   * @param events List of events to filter and sort
   * @param options Filtering options
   * @returns Filtered and sorted array of events
   */
  static applyFilters(events: NostrEvent[], options: {
    authorPubkeys?: string[],
    hashtag?: string,
    since?: number,
    until?: number,
    limit?: number
  }): NostrEvent[] {
    let filteredEvents = [...events];
    
    // Apply author filter if specified
    if (options.authorPubkeys && options.authorPubkeys.length > 0) {
      filteredEvents = this.filterByAuthors(filteredEvents, options.authorPubkeys);
    }
    
    // Apply hashtag filter if specified
    if (options.hashtag) {
      filteredEvents = this.filterByHashtag(filteredEvents, options.hashtag);
    }
    
    // Apply time range filter if specified
    filteredEvents = this.filterByTimeRange(filteredEvents, options.since, options.until);
    
    // Sort by creation time
    filteredEvents = this.sortByCreationTime(filteredEvents);
    
    // Apply limit if specified
    if (options.limit && options.limit > 0 && filteredEvents.length > options.limit) {
      filteredEvents = filteredEvents.slice(0, options.limit);
    }
    
    return filteredEvents;
  }
}
