
/**
 * NIP-10: Thread handling utility functions
 * https://github.com/nostr-protocol/nips/blob/master/10.md
 */

/**
 * Parse event tags to properly handle thread markers according to NIP-10
 * @param tags The tags array from a Nostr event
 * @returns Object containing root event ID, reply event ID, and mentions
 */
export function parseThreadTags(tags: string[][]): {
  rootId: string | null;
  replyId: string | null;
  mentions: string[];
} {
  const result = {
    rootId: null as string | null,
    replyId: null as string | null,
    mentions: [] as string[]
  };
  
  if (!tags || !Array.isArray(tags)) {
    return result;
  }
  
  const eTags = tags.filter(tag => Array.isArray(tag) && tag[0] === 'e');
  
  // NIP-10 thread logic
  eTags.forEach((tag) => {
    // Tag format: ["e", <event-id>, <relay-url>?, <marker>?]
    if (tag.length < 2) return;
    
    const [_, eventId, , marker] = tag;
    
    // Handle special markers
    if (marker === "root") {
      result.rootId = eventId;
    } else if (marker === "reply") {
      result.replyId = eventId;
    } else if (!marker) {
      // No marker means it's either a root, reply, or mention
      if (!result.replyId) {
        result.replyId = eventId;
      } else {
        result.mentions.push(eventId);
      }
    } else {
      // Any other marker is considered a mention
      result.mentions.push(eventId);
    }
  });
  
  // If we have no explicit root but have a reply, the reply becomes our thread context
  if (!result.rootId && result.replyId) {
    result.rootId = result.replyId;
  }
  
  return result;
}

/**
 * Validates that e-tags follow the proper structure according to NIP-10
 */
export function validateNip10Tags(tags: string[][]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!Array.isArray(tags)) {
    return { valid: false, errors: ['tags must be an array'] };
  }
  
  const eTags = tags.filter(tag => Array.isArray(tag) && tag[0] === 'e');
  
  for (let i = 0; i < eTags.length; i++) {
    const tag = eTags[i];
    
    // Validate tag structure ["e", <event-id>, <relay-url>?, <marker>?]
    if (tag.length < 2) {
      errors.push(`E-tag at index ${i} must have an event ID`);
      continue;
    }
    
    // Validate event ID format (hex string of 64 chars)
    if (!/^[0-9a-fA-F]{64}$/.test(tag[1])) {
      errors.push(`E-tag at index ${i} has an invalid event ID format`);
    }
    
    // If marker is present, validate it's one of the allowed values
    if (tag.length >= 4 && tag[3]) {
      const marker = tag[3];
      if (!['root', 'reply', 'mention'].includes(marker)) {
        errors.push(`E-tag at index ${i} has an invalid marker: ${marker}`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}
