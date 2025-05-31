
import { NostrEvent } from "../../types";
import { validateNip01Event } from "./nip01";

/**
 * NIP-65: Relay list metadata utilities
 * https://github.com/nostr-protocol/nips/blob/master/65.md
 */

/**
 * Parse relay list metadata from event according to NIP-65
 * @param event The kind 10002 event containing relay preferences
 * @returns Map of relay URLs to read/write permissions
 */
export function parseRelayList(event: NostrEvent): Map<string, { read: boolean, write: boolean }> {
  const relayMap = new Map<string, { read: boolean, write: boolean }>();
  
  if (!event || !event.tags || !Array.isArray(event.tags)) {
    return relayMap;
  }
  
  // Extract relay information from 'r' tags
  event.tags.forEach(tag => {
    if (Array.isArray(tag) && tag[0] === 'r' && tag.length >= 2) {
      const url = tag[1];
      let read = true;
      let write = true;
      
      // Check for read/write markers in positions 2 and later
      if (tag.length >= 3) {
        read = tag.includes('read');
        write = tag.includes('write');
      }
      
      relayMap.set(url, { read, write });
    }
  });
  
  return relayMap;
}

/**
 * Validates relay list metadata according to NIP-65
 */
export function validateNip65RelayList(event: NostrEvent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic event validation
  const baseValidation = validateNip01Event(event);
  if (!baseValidation.valid) {
    return baseValidation;
  }
  
  // Must be kind 10002
  if (event.kind !== 10002) {
    errors.push('Relay list event must be kind 10002');
    return { valid: false, errors };
  }
  
  // Must have at least one r tag
  const rTags = event.tags.filter(tag => tag[0] === 'r');
  if (rTags.length === 0) {
    errors.push('Relay list must have at least one r tag');
    return { valid: false, errors };
  }
  
  for (let i = 0; i < rTags.length; i++) {
    const rTag = rTags[i];
    
    // Tag format should be ['r', '<relay-url>', 'read'?, 'write'?]
    if (rTag.length < 2) {
      errors.push(`Relay tag at index ${i} must have a URL`);
      continue;
    }
    
    // Validate relay URL format
    const relayUrl = rTag[1];
    try {
      const url = new URL(relayUrl);
      if (!['ws:', 'wss:'].includes(url.protocol)) {
        errors.push(`Relay tag at index ${i} has invalid protocol: ${url.protocol}, must be ws: or wss:`);
      }
    } catch (error) {
      errors.push(`Relay tag at index ${i} has invalid URL format: ${relayUrl}`);
      continue;
    }
    
    // Validate read/write markers if present
    if (rTag.length > 2) {
      const markers = rTag.slice(2);
      
      for (const marker of markers) {
        if (marker !== 'read' && marker !== 'write') {
          errors.push(`Relay tag at index ${i} has invalid marker: ${marker}, must be 'read' or 'write'`);
        }
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

