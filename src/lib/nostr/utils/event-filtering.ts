
/**
 * Utility functions for filtering Nostr events
 */

import { NostrEvent } from '../types';

/**
 * Filter events by kind
 */
export const filterEventsByKind = (events: NostrEvent[], kind: number): NostrEvent[] => {
  return events.filter(event => event.kind === kind);
};

/**
 * Filter events by author
 */
export const filterEventsByAuthor = (events: NostrEvent[], pubkey: string): NostrEvent[] => {
  return events.filter(event => event.pubkey === pubkey);
};

/**
 * Filter events by time range
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
 * Filter events by tag
 */
export const filterEventsByTag = (
  events: NostrEvent[], 
  tagName: string,
  tagValue?: string
): NostrEvent[] => {
  return events.filter(event => {
    if (!Array.isArray(event.tags)) return false;
    
    return event.tags.some(tag => {
      if (tag[0] !== tagName) return false;
      if (tagValue && tag[1] !== tagValue) return false;
      return true;
    });
  });
};
