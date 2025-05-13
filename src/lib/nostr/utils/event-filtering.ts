import { NostrEvent } from "../types";

/**
 * Filters events by specific criteria
 * Implements patterns from NIP-01
 */
export const filterEventsByKind = (events: NostrEvent[], kinds: number[]): NostrEvent[] => {
  if (!kinds || kinds.length === 0) return events;
  
  return events.filter(event => kinds.includes(event.kind));
};

/**
 * Filters events by author pubkey
 */
export const filterEventsByAuthor = (events: NostrEvent[], pubkeys: string[]): NostrEvent[] => {
  if (!pubkeys || pubkeys.length === 0) return events;
  
  const pubkeySet = new Set(pubkeys);
  return events.filter(event => event.pubkey && pubkeySet.has(event.pubkey));
};

/**
 * Filters events by tag value
 */
export const filterEventsByTag = (
  events: NostrEvent[], 
  tagName: string, 
  tagValues?: string[]
): NostrEvent[] => {
  if (!tagName) return events;
  
  return events.filter(event => {
    if (!event.tags || !Array.isArray(event.tags)) return false;
    
    // If no specific tag values are requested, check if the tag exists
    if (!tagValues || tagValues.length === 0) {
      return event.tags.some(tag => Array.isArray(tag) && tag[0] === tagName);
    }
    
    // Otherwise, check for specific tag values
    const tagValueSet = new Set(tagValues);
    return event.tags.some(tag => 
      Array.isArray(tag) && 
      tag[0] === tagName && 
      tag.length > 1 && 
      tagValueSet.has(tag[1])
    );
  });
};

/**
 * Filters events by time range
 */
export const filterEventsByTimeRange = (
  events: NostrEvent[], 
  since?: number, 
  until?: number
): NostrEvent[] => {
  return events.filter(event => {
    if (since && event.created_at < since) return false;
    if (until && event.created_at > until) return false;
    return true;
  });
};

/**
 * Filters events with media content
 */
export const filterMediaEvents = (events: NostrEvent[]): NostrEvent[] => {
  return events.filter(event => {
    // Check content for media URLs
    if (event.content) {
      const hasMediaUrl = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)(\?[^\s]*)?)/i.test(event.content);
      if (hasMediaUrl) return true;
    }
    
    // Check for media tags
    if (Array.isArray(event.tags)) {
      return event.tags.some(tag => 
        Array.isArray(tag) && 
        tag.length >= 2 && 
        ['image', 'media', 'video'].includes(tag[0])
      );
    }
    
    return false;
  });
};
