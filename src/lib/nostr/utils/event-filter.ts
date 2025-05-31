import { NostrEvent } from "../types";

/**
 * Utility for filtering events based on various criteria
 * Implements patterns from NIP-01 (Basic Protocol Flow and Semantics)
 */
export class EventFilter {
  /**
   * Filter events by author pubkey
   * @param events Array of Nostr events to filter
   * @param pubkeys Array of pubkeys to include
   * @returns Filtered array of events
   */
  static byAuthor(events: NostrEvent[], pubkeys: string[]): NostrEvent[] {
    if (!pubkeys || pubkeys.length === 0) return events;
    
    const pubkeySet = new Set(pubkeys);
    return events.filter(event => event.pubkey && pubkeySet.has(event.pubkey));
  }
  
  /**
   * Filter events by event kind
   * @param events Array of Nostr events to filter
   * @param kinds Array of kinds to include
   * @returns Filtered array of events
   */
  static byKind(events: NostrEvent[], kinds: number[]): NostrEvent[] {
    if (!kinds || kinds.length === 0) return events;
    
    const kindSet = new Set(kinds);
    return events.filter(event => kindSet.has(event.kind));
  }
  
  /**
   * Filter events that contain a specific tag
   * @param events Array of Nostr events to filter
   * @param tagName Tag name to look for (e.g., 'p', 'e', 't')
   * @param tagValues Optional specific tag values to match
   * @returns Filtered array of events
   */
  static byTag(events: NostrEvent[], tagName: string, tagValues?: string[]): NostrEvent[] {
    return events.filter(event => {
      if (!event.tags || !Array.isArray(event.tags)) return false;
      
      // If no specific tag values are requested, check if the tag exists
      if (!tagValues || tagValues.length === 0) {
        return event.tags.some(tag => Array.isArray(tag) && tag[0] === tagName);
      }
      
      // Otherwise check for specific tag values
      const tagValueSet = new Set(tagValues);
      return event.tags.some(tag => 
        Array.isArray(tag) && 
        tag[0] === tagName && 
        tag.length > 1 && 
        tagValueSet.has(tag[1])
      );
    });
  }
  
  /**
   * Filter events by hashtag
   * @param events Array of Nostr events to filter
   * @param hashtags Array of hashtags to include (without the # symbol)
   * @returns Filtered array of events
   */
  static byHashtag(events: NostrEvent[], hashtags: string[]): NostrEvent[] {
    if (!hashtags || hashtags.length === 0) return events;
    
    return this.byTag(events, 't', hashtags);
  }
  
  /**
   * Filter events within a time range
   * @param events Array of Nostr events to filter
   * @param since Unix timestamp for start time (inclusive)
   * @param until Unix timestamp for end time (inclusive)
   * @returns Filtered array of events
   */
  static byTimeRange(events: NostrEvent[], since?: number, until?: number): NostrEvent[] {
    return events.filter(event => {
      if (!event.created_at) return false;
      
      if (since && event.created_at < since) return false;
      if (until && event.created_at > until) return false;
      
      return true;
    });
  }
  
  /**
   * Filter events that mention a specific user
   * @param events Array of Nostr events to filter
   * @param pubkeys Array of pubkeys to check for mentions
   * @returns Filtered array of events that mention the specified pubkeys
   */
  static byMention(events: NostrEvent[], pubkeys: string[]): NostrEvent[] {
    if (!pubkeys || pubkeys.length === 0) return events;
    
    return this.byTag(events, 'p', pubkeys);
  }
  
  /**
   * Filter events with media attachments
   * @param events Array of Nostr events to filter
   * @returns Events that contain media attachments
   */
  static withMedia(events: NostrEvent[]): NostrEvent[] {
    return events.filter(event => {
      if (!event.tags || !Array.isArray(event.tags)) return false;
      
      // Check for image or video tags
      return event.tags.some(tag => 
        Array.isArray(tag) && 
        (tag[0] === 'image' || tag[0] === 'media' || tag[0] === 'video')
      );
    });
  }
  
  /**
   * Filter events based on content search
   * @param events Array of Nostr events to filter
   * @param searchTerms Array of search terms
   * @param matchAll Whether all search terms must be present
   * @returns Filtered events that match the search criteria
   */
  static byContent(events: NostrEvent[], searchTerms: string[], matchAll: boolean = false): NostrEvent[] {
    if (!searchTerms || searchTerms.length === 0) return events;
    
    const terms = searchTerms.map(term => term.toLowerCase());
    
    return events.filter(event => {
      if (!event.content) return false;
      
      const content = event.content.toLowerCase();
      
      if (matchAll) {
        // All terms must be present
        return terms.every(term => content.includes(term));
      } else {
        // At least one term must be present
        return terms.some(term => content.includes(term));
      }
    });
  }
}

