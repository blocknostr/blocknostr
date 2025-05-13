
import { NostrEvent } from "../../types";

/**
 * NIP-36: Sensitive/NSFW content and content warnings
 * https://github.com/nostr-protocol/nips/blob/master/36.md
 */

/**
 * Check if an event has a content warning tag
 * @param event Nostr event to check
 * @returns Boolean indicating if event has content warning
 */
export function hasContentWarning(event: NostrEvent): boolean {
  if (!event || !event.tags) return false;
  return event.tags.some(tag => tag.length >= 1 && tag[0] === 'content-warning');
}

/**
 * Get content warning reasons from an event
 * @param event Nostr event to check
 * @returns Array of content warning reasons or empty array if none
 */
export function getContentWarningReasons(event: NostrEvent): string[] {
  if (!event || !event.tags) return [];
  
  return event.tags
    .filter(tag => tag.length >= 2 && tag[0] === 'content-warning')
    .map(tag => tag[1]);
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
  
  // Create a deep copy of tags
  updatedEvent.tags = [...(event.tags || [])];
  
  // Add content warning tag
  if (reason) {
    updatedEvent.tags.push(['content-warning', reason]);
  } else {
    updatedEvent.tags.push(['content-warning']);
  }
  
  return updatedEvent;
}

/**
 * Validate the content warning tags on an event
 * @param event Event to validate
 * @returns Validation result with errors if any
 */
export function validateNip36ContentWarning(event: NostrEvent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for content-warning tag
  const cwTags = event.tags.filter(tag => tag[0] === 'content-warning');
  
  if (cwTags.length > 0) {
    // If content-warning tag exists, it should have a valid reason or be empty
    // Valid reasons according to NIP-36: "nudity", "sexual", "gore", "self-harm", "violence", etc.
    // Empty reason is allowed (generic content warning)
    const validReasons = ["nudity", "sexual", "porn", "gore", "self-harm", "violence", "graphic", "nsfw"];
    
    for (const tag of cwTags) {
      // If there's a reason provided, check if it's recognized
      if (tag.length > 1 && tag[1] && !validReasons.includes(tag[1].toLowerCase()) && !tag[1].startsWith('custom:')) {
        errors.push(`Content warning reason '${tag[1]}' is not standard. Consider using a recognized reason or custom:reason format.`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}
