
import { NostrEvent } from "../../types";

/**
 * Utility for filtering Nostr events
 * Optimized for better performance
 */
export class EventFilter {
  /**
   * Filter events by author pubkeys
   */
  static filterByAuthors(events: NostrEvent[], authorPubkeys: string[]): NostrEvent[] {
    if (!authorPubkeys || authorPubkeys.length === 0) return [];
    
    // Convert array to Set for O(1) lookups instead of O(n)
    const pubkeySet = new Set(authorPubkeys);
    
    return events.filter(event => event.pubkey && pubkeySet.has(event.pubkey));
  }
  
  /**
   * Filter events by hashtag
   */
  static filterByHashtag(events: NostrEvent[], hashtag: string): NostrEvent[] {
    if (!hashtag) return [];
    
    const normalizedHashtag = hashtag.toLowerCase().replace(/^#/, '');
    
    return events.filter(event => {
      // Check tags array for hashtag
      const hasTTag = event.tags?.some(tag => 
        tag.length >= 2 && 
        tag[0] === 't' && 
        tag[1].toLowerCase() === normalizedHashtag
      );
      
      // If found in tags, return early without checking content
      if (hasTTag) return true;
      
      // Check content for hashtag
      return event.content?.toLowerCase().includes(`#${normalizedHashtag}`);
    });
  }
  
  /**
   * Apply multiple filters to events
   */
  static applyFilters(events: NostrEvent[], options: {
    authorPubkeys?: string[],
    hashtag?: string,
    since?: number,
    until?: number,
    limit?: number
  }): NostrEvent[] {
    let filtered = [...events];
    
    // Apply author filter if specified
    if (options.authorPubkeys && options.authorPubkeys.length > 0) {
      filtered = this.filterByAuthors(filtered, options.authorPubkeys);
    }
    
    // Apply hashtag filter if specified
    if (options.hashtag) {
      filtered = this.filterByHashtag(filtered, options.hashtag);
    }
    
    // Apply time range filters
    if (options.since || options.until) {
      filtered = filtered.filter(event => {
        const createdAt = event.created_at;
        if (!createdAt) return false;
        
        if (options.since && createdAt < options.since) return false;
        if (options.until && createdAt > options.until) return false;
        
        return true;
      });
    }
    
    // Sort by created_at (newest first)
    filtered = filtered.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    
    // Apply limit if specified
    if (options.limit && options.limit > 0) {
      filtered = filtered.slice(0, options.limit);
    }
    
    return filtered;
  }
  
  /**
   * Specialized filter for important NIP-01 event kinds
   * Useful for prioritizing cache retention
   */
  static filterImportantEvents(events: NostrEvent[]): NostrEvent[] {
    // Important event kinds according to NIPs
    const importantKinds = new Set([
      0,  // Metadata
      3   // Contacts list
    ]);
    
    return events.filter(event => 
      event.kind !== undefined && importantKinds.has(event.kind)
    );
  }
}
