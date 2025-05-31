
import { NostrEvent } from "../../types";
import { validateNip01Event } from "./nip01";

/**
 * NIP-25: Validates reaction event according to NIP-25 spec
 * https://github.com/nostr-protocol/nips/blob/master/25.md
 */
export function validateNip25Reaction(event: NostrEvent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic event validation
  const baseValidation = validateNip01Event(event);
  if (!baseValidation.valid) {
    return baseValidation;
  }
  
  // Reaction must be kind 7
  if (event.kind !== 7) {
    errors.push('Reaction event must have kind 7');
  }
  
  // Must have at least one e tag (referenced event)
  const eTags = event.tags.filter(tag => tag[0] === 'e');
  if (eTags.length === 0) {
    errors.push('Reaction must have at least one e tag referencing the event being reacted to');
  }
  
  // Must have at least one p tag (author of referenced event)
  const pTags = event.tags.filter(tag => tag[0] === 'p');
  if (pTags.length === 0) {
    errors.push('Reaction must have at least one p tag referencing the author of the event');
  }
  
  // Content should be a single emoji or + for like (commonly used)
  // This is a loose validation since NIP-25 allows other content too
  if (event.content !== '' && event.content !== '+' && !/^\p{Emoji}$/u.test(event.content)) {
    // Not an error, but a warning
    console.warn('Reaction content is not a single emoji or +');
  }
  
  return { valid: errors.length === 0, errors };
}

