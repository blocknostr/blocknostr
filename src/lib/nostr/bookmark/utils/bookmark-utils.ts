
import { NostrEvent } from '../../types';

/**
 * Validates relay URLs ensuring they have proper format
 * @param relays Array of relay URLs
 * @throws Error if any relay URL is invalid
 */
export const validateRelays = (relays: string[]): void => {
  if (!Array.isArray(relays) || relays.length === 0) {
    throw new Error("No relays specified");
  }
  
  for (const relay of relays) {
    if (!relay.startsWith('wss://') && !relay.startsWith('ws://')) {
      throw new Error(`Invalid relay URL: ${relay}`);
    }
  }
};

/**
 * Ensures connection to a set of relays before proceeding
 */
export const ensureRelayConnection = async (connectFn: (urls: string[]) => Promise<void>, relays: string[], options?: any): Promise<string[]> => {
  // Implementation would connect to relays and return successfully connected ones
  await connectFn(relays);
  return relays; // Simplified - would actually return only connected ones
};

/**
 * Generate a stable identifier for bookmark metadata based on event ID
 */
export const generateStableMetadataId = (eventId: string): string => {
  return `meta_${eventId.substring(0, 8)}`;
};

/**
 * Extract tags from a Nostr event
 */
export const extractTagsFromEvent = (event: NostrEvent): string[] => {
  if (!event || !event.tags) return [];
  
  // Extract tags that use the 't' tag prefix
  const tags = event.tags
    .filter(tag => tag[0] === 't' && tag.length >= 2)
    .map(tag => tag[1]);
  
  return [...new Set(tags)]; // Return unique tags
};
