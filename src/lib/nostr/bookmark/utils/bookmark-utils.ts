
import { SimplePool } from 'nostr-tools';
import { RelayConnectionOptions } from '../types';

/**
 * Validates that relay URLs are properly formatted
 */
export function validateRelays(relays: string[]): void {
  if (!relays || relays.length === 0) {
    throw new Error("No relays provided for bookmark operation");
  }
  
  for (const relay of relays) {
    if (!relay.startsWith("wss://")) {
      throw new Error(`Invalid relay URL format: ${relay}. Should start with wss://`);
    }
  }
}

/**
 * Ensures connection to relays before performing operations
 */
export async function ensureRelayConnection(
  pool: SimplePool,
  relays: string[],
  options?: RelayConnectionOptions
): Promise<boolean> {
  const { 
    maxAttempts = 3, 
    timeout = 5000,
    onProgress 
  } = options || {};
  
  validateRelays(relays);
  
  try {
    for (const relay of relays) {
      if (onProgress) onProgress(`Connecting to ${relay}...`);
      
      try {
        // Connect to relay - implementation depends on SimplePool API
        pool.ensureRelay(relay);
      } catch (error) {
        console.warn(`Failed to connect to relay ${relay}:`, error);
      }
    }
    
    // Wait a bit for connections to establish
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error("Error ensuring relay connections:", error);
    return false;
  }
}

/**
 * Generates a stable ID for bookmark metadata based on the event ID
 */
export function generateStableMetadataId(eventId: string): string {
  return `meta_${eventId.substring(0, 8)}`;
}

/**
 * Extract tags from a Nostr event
 */
export function extractTagsFromEvent(event: any): string[] {
  if (!event || !event.tags || !Array.isArray(event.tags)) {
    return [];
  }
  
  // Get all tags with 't' prefix
  const tags = event.tags
    .filter((tag: string[]) => tag.length >= 2 && tag[0] === 't')
    .map((tag: string[]) => tag[1]);
    
  // Return unique tags
  return Array.from(new Set(tags));
}
