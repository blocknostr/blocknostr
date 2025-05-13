
import { NostrEvent } from "../../types";

/**
 * NIP-25: Reactions to events
 * https://github.com/nostr-protocol/nips/blob/master/25.md
 */
export function validateNip25Reaction(event: NostrEvent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate event kind
  if (event.kind !== 7) {
    errors.push('Reaction event must have kind 7');
    return { valid: false, errors };
  }
  
  // Check for e-tag (referenced event)
  const eTags = event.tags.filter(tag => tag[0] === 'e');
  if (eTags.length === 0) {
    errors.push('Reaction must reference an event with e-tag');
  } else if (eTags.length > 1) {
    // While multiple e-tags are allowed, best practice is to have one reaction per event
    errors.push('Warning: Multiple e-tags in reaction (consider using separate reactions)');
  }
  
  // Check for p-tag (referenced event author)
  const pTags = event.tags.filter(tag => tag[0] === 'p');
  if (pTags.length === 0) {
    errors.push('Reaction should reference the author of the event with p-tag');
  }
  
  // Content should be a positive emoji, +, or - 
  // NIP-25 doesn't strictly enforce content format, but these are common
  const validReactions = ['+', '-', '❤️', '👍', '👎', '😂', '😢', '🚀', '👏', '🔥'];
  if (event.content.length > 0 && !validReactions.includes(event.content) && !/^[🙂😊😘😍🤩😅😂🤣😆😁😉😜😋😎😮😥😣😏😪😫😴😌😛😜😝😒😓😔😕😲😭🌹💯💥⚡💢❓❗]$/.test(event.content)) {
    errors.push('Warning: Reaction content is not a standard reaction emoji or symbol');
  }
  
  return { valid: errors.length === 0, errors };
}
