
import { NostrEvent } from "../../types";

/**
 * NIP-01: Validates basic event structure according to the NIP-01 spec
 * https://github.com/nostr-protocol/nips/blob/master/01.md
 */
export function validateNip01Event(event: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (!event) {
    return { valid: false, errors: ['Event is undefined or null'] };
  }
  
  if (!event.id) {
    errors.push('Missing id field');
  }
  
  if (!event.pubkey) {
    errors.push('Missing pubkey field');
  }
  
  if (!event.created_at) {
    errors.push('Missing created_at field');
  } else if (typeof event.created_at !== 'number') {
    errors.push('created_at must be a number (UNIX timestamp)');
  }
  
  if (event.kind === undefined) {
    errors.push('Missing kind field');
  } else if (typeof event.kind !== 'number') {
    errors.push('kind must be a number');
  }
  
  if (!Array.isArray(event.tags)) {
    errors.push('tags must be an array');
  } else {
    // Validate tag structure: each tag must be an array of strings
    for (let i = 0; i < event.tags.length; i++) {
      const tag = event.tags[i];
      if (!Array.isArray(tag)) {
        errors.push(`Tag at index ${i} must be an array`);
      } else {
        for (let j = 0; j < tag.length; j++) {
          if (typeof tag[j] !== 'string') {
            errors.push(`Tag element at index ${i},${j} must be a string`);
          }
        }
      }
    }
  }
  
  if (typeof event.content !== 'string') {
    errors.push('content must be a string');
  }
  
  if (!event.sig) {
    errors.push('Missing sig field');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Gets the creation date of an account based on the earliest metadata event
 * @param events Array of events to search through
 * @returns Date object representing the account creation time
 */
export function getAccountCreationDate(events: NostrEvent[]): Date | null {
  if (!events || events.length === 0) return null;
  
  // Find the oldest metadata event (kind 0)
  const metadataEvents = events.filter(event => event.kind === 0);
  
  if (metadataEvents.length === 0) return null;
  
  // Sort by creation date (ascending)
  const sortedEvents = [...metadataEvents].sort((a, b) => a.created_at - b.created_at);
  
  // Return the earliest timestamp
  return sortedEvents[0] ? new Date(sortedEvents[0].created_at * 1000) : null;
}
