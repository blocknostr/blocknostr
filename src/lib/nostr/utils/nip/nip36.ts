
import { NostrEvent } from "../../types";

/**
 * NIP-36: Sensitive/NSFW content and content warnings
 * https://github.com/nostr-protocol/nips/blob/master/36.md
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
