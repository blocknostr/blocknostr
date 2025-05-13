
import { NostrEvent } from "../../types";

/**
 * NIP-65: Relay List Metadata
 * https://github.com/nostr-protocol/nips/blob/master/65.md
 */
export function validateNip65RelayList(event: NostrEvent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate event kind
  if (event.kind !== 10002) {
    errors.push('Relay list event must have kind 10002');
    return { valid: false, errors };
  }
  
  // Must contain at least one relay
  const relayTags = event.tags.filter(tag => tag[0] === 'r');
  if (relayTags.length === 0) {
    errors.push('Relay list must contain at least one r tag');
    return { valid: false, errors };
  }
  
  // Validate each relay tag
  for (const [index, tag] of relayTags.entries()) {
    // Relay URL must be present
    if (tag.length < 2 || !tag[1]) {
      errors.push(`Relay tag at index ${index} is missing URL`);
      continue;
    }
    
    // Relay URL should be valid
    try {
      const url = new URL(tag[1]);
      if (url.protocol !== 'wss:' && url.protocol !== 'ws:') {
        errors.push(`Relay URL at index ${index} should use ws:// or wss:// protocol`);
      }
    } catch {
      errors.push(`Relay URL at index ${index} is not a valid URL`);
    }
    
    // Check relay marker if present (read/write permissions)
    if (tag.length >= 3 && tag[2]) {
      const marker = tag[2];
      if (marker !== 'read' && marker !== 'write' && marker !== 'read+write') {
        errors.push(`Relay marker at index ${index} should be "read", "write", or "read+write"`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}
