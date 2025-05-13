
import { NostrEvent } from "../../types";

/**
 * NIP-65: Relay List Metadata
 * https://github.com/nostr-protocol/nips/blob/master/65.md
 */

/**
 * Interface for relay preferences
 */
export interface RelayPreference {
  read: boolean;
  write: boolean;
}

/**
 * Parse relay list from a NIP-65 event
 * @param event Event with relay list
 * @returns Map of relay URLs to preferences
 */
export function parseRelayList(event: NostrEvent): Map<string, RelayPreference> {
  const relayMap = new Map<string, RelayPreference>();
  
  if (!event || !event.tags) return relayMap;
  
  // Filter for 'r' tags
  const relayTags = event.tags.filter(tag => tag[0] === 'r' && tag.length >= 2 && tag[1]);
  
  for (const tag of relayTags) {
    const url = tag[1];
    if (!url) continue;
    
    // Default is both read and write unless specified
    let read = true;
    let write = true;
    
    // Check for explicit read/write permissions
    if (tag.length > 2) {
      read = tag.includes('read');
      write = tag.includes('write');
    }
    
    relayMap.set(url, { read, write });
  }
  
  return relayMap;
}

/**
 * Extract just the URLs from a relay preference map
 * @param relayMap Map of relay URLs to preferences
 * @returns Array of relay URLs
 */
export function getRelayUrls(relayMap: Map<string, RelayPreference>): string[] {
  return Array.from(relayMap.keys());
}

/**
 * Validate a NIP-65 relay list event
 * @param event Event to validate
 * @returns Validation result with errors if any
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
