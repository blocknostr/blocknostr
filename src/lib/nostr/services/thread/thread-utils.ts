import { NostrEvent } from '../../types';

/**
 * Thread utilities for tag parsing and thread structure
 * Implements NIP-10 for conversation threads
 */
export function getThreadRootId(event: NostrEvent): string | null {
  if (!event.tags || !Array.isArray(event.tags)) return null;
  
  // Look for e tag with root marker (NIP-10)
  for (const tag of event.tags) {
    if (Array.isArray(tag) && tag.length >= 3 && tag[0] === 'e' && tag[3] === 'root') {
      return tag[1];
    }
  }
  
  // If no root marker, look for first e tag as fallback
  for (const tag of event.tags) {
    if (Array.isArray(tag) && tag.length >= 2 && tag[0] === 'e') {
      return tag[1];
    }
  }
  
  return null;
}
  
/**
 * Get the immediate parent event ID from an event
 */
export function getParentId(event: NostrEvent): string | null {
  if (!event.tags || !Array.isArray(event.tags)) return null;
  
  // Look for e tag with reply marker (NIP-10)
  for (const tag of event.tags) {
    if (Array.isArray(tag) && tag.length >= 3 && tag[0] === 'e' && tag[3] === 'reply') {
      return tag[1];
    }
  }
  
  // Otherwise use last e tag as the parent (NIP-10)
  const eTags = event.tags.filter(tag => Array.isArray(tag) && tag[0] === 'e');
  if (eTags.length > 0) {
    return eTags[eTags.length - 1][1];
  }
  
  return null;
}
