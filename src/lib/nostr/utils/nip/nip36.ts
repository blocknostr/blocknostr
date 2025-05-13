
import { NostrEvent } from "../../types";

/**
 * NIP-36: Sensitive Content Warnings
 * https://github.com/nostr-protocol/nips/blob/master/36.md
 */

/**
 * Check if an event has a content warning tag
 * @param event Nostr event to check
 * @returns Boolean indicating if event has content warning
 */
export function hasContentWarning(event: NostrEvent): boolean {
  if (!event?.tags || !Array.isArray(event.tags)) {
    return false;
  }
  
  return event.tags.some(tag => 
    Array.isArray(tag) && tag.length >= 1 && tag[0] === 'content-warning'
  );
}

/**
 * Get content warning reasons from an event
 * @param event Nostr event to check
 * @returns Array of content warning reasons or empty array if none
 */
export function getContentWarningReasons(event: NostrEvent): string[] {
  if (!event?.tags || !Array.isArray(event.tags)) {
    return [];
  }
  
  const cwTags = event.tags.filter(tag => 
    Array.isArray(tag) && tag.length >= 2 && tag[0] === 'content-warning'
  );
  
  // Extract reasons from tags
  const reasons: string[] = [];
  for (const tag of cwTags) {
    if (tag.length >= 2 && tag[1]) {
      reasons.push(tag[1]);
    }
  }
  
  return reasons;
}

/**
 * Add content warning tag to event
 * @param event Event to modify
 * @param reason Optional reason for the content warning
 * @returns Modified event with content warning
 */
export function addContentWarning(event: NostrEvent, reason?: string): NostrEvent {
  if (!event) return event;
  
  const updatedEvent = { ...event };
  
  if (!updatedEvent.tags) {
    updatedEvent.tags = [];
  }
  
  // Add content warning tag
  if (reason) {
    updatedEvent.tags.push(['content-warning', reason]);
  } else {
    updatedEvent.tags.push(['content-warning']);
  }
  
  return updatedEvent;
}

/**
 * Validates content warning tags according to NIP-36
 */
export function validateNip36ContentWarning(event: NostrEvent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!event?.tags || !Array.isArray(event.tags)) {
    return { valid: true, errors }; // No tags means no CW tags to validate
  }
  
  const cwTags = event.tags.filter(tag => 
    Array.isArray(tag) && tag[0] === 'content-warning'
  );
  
  if (cwTags.length === 0) {
    return { valid: true, errors }; // No CW tags to validate
  }
  
  // Multiple content-warning tags are allowed, but each should be properly formatted
  for (let i = 0; i < cwTags.length; i++) {
    const tag = cwTags[i];
    
    // Tag should be either ['content-warning'] or ['content-warning', 'reason']
    if (tag.length > 2) {
      errors.push(`Content warning tag at index ${i} has too many elements. Expected format: ['content-warning', 'reason']`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}
