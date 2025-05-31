
/**
 * NIP-16: Event Treatment - Implementation for handling replaceable events
 * https://github.com/nostr-protocol/nips/blob/master/16.md
 */

import { NostrEvent } from '../../types';

/**
 * Check if an event is replaceable according to NIP-16
 */
export function isReplaceableEvent(event: NostrEvent): boolean {
  if (!event) return false;
  
  // Check if event is of a replaceable kind
  return (
    // Standard replaceable kinds
    event.kind === 0 ||  // Set metadata (profile)
    event.kind === 3 ||  // Contacts (following)
    event.kind === 41 || // User relays
    // Parameterized replaceable events
    (event.kind >= 10000 && event.kind < 20000)
  );
}

/**
 * Get a unique identifier for replaceable events
 * For simple replaceable events: pubkey+kind
 * For parameterized replaceable events: pubkey+kind+d-tag
 */
export function getReplaceableKey(event: NostrEvent): string {
  if (!event || !event.pubkey) return '';
  
  // Parameterized replaceable events (kind 10000-19999)
  if (event.kind >= 10000 && event.kind < 20000) {
    const dTag = event.tags?.find(tag => tag[0] === 'd')?.[1] || '';
    return `${event.pubkey}:${event.kind}:${dTag}`;
  }
  
  // Simple replaceable events
  if (event.kind === 0 || event.kind === 3 || event.kind === 41) {
    return `${event.pubkey}:${event.kind}`;
  }
  
  // Not replaceable
  return '';
}

/**
 * Process a list of events and keep only the latest version of replaceable events
 */
export function deduplicateReplaceableEvents(events: NostrEvent[]): NostrEvent[] {
  if (!events || !Array.isArray(events)) return [];
  
  const latestByKey: Record<string, NostrEvent> = {};
  const nonReplaceableEvents: NostrEvent[] = [];
  
  for (const event of events) {
    if (isReplaceableEvent(event)) {
      const key = getReplaceableKey(event);
      
      // If we don't have this event yet or this one is newer, store it
      if (!latestByKey[key] || event.created_at > latestByKey[key].created_at) {
        latestByKey[key] = event;
      }
    } else {
      // Non-replaceable events are kept as is
      nonReplaceableEvents.push(event);
    }
  }
  
  // Combine the latest replaceable events with non-replaceable ones
  return [...Object.values(latestByKey), ...nonReplaceableEvents];
}

/**
 * Check if two events have the same replaceable identity
 * (same pubkey, kind, and d-tag if applicable)
 */
export function haveSameReplaceableIdentity(event1: NostrEvent, event2: NostrEvent): boolean {
  if (!event1 || !event2) return false;
  if (!isReplaceableEvent(event1) || !isReplaceableEvent(event2)) return false;
  
  return getReplaceableKey(event1) === getReplaceableKey(event2);
}

/**
 * Determine which event should be kept when having multiple versions
 * Returns the newer event (higher created_at timestamp)
 */
export function getNewerReplaceableEvent(event1: NostrEvent, event2: NostrEvent): NostrEvent | null {
  if (!event1) return event2;
  if (!event2) return event1;
  if (!isReplaceableEvent(event1) || !isReplaceableEvent(event2)) return null;
  
  return event1.created_at > event2.created_at ? event1 : event2;
}

