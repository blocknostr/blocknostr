
import { SimplePool } from 'nostr-tools';
import { RelayConnectionOptions } from '../types';
import { retry } from '@/lib/utils/retry';

/**
 * Validate that relays array is not empty
 */
export function validateRelays(relays: string[]): void {
  if (!relays || relays.length === 0) {
    throw new Error("Cannot perform bookmark operation: No relays provided");
  }
}

/**
 * Generate a stable identifier for a bookmark metadata
 */
export function generateStableMetadataId(eventId: string): string {
  return `meta_${eventId.substring(0, 8)}`;
}

/**
 * Ensure connection to relays with retry mechanism
 */
export async function ensureRelayConnection(
  getConnectedRelays: () => string[],
  connectToRelays: () => Promise<string[]>,
  options: RelayConnectionOptions = {}
): Promise<string[]> {
  const {
    timeout = 10000,
    maxRetries = 3,
    onProgress
  } = options;
  
  // Check if already connected
  let connectedRelays = getConnectedRelays();
  if (connectedRelays.length > 0) {
    return connectedRelays;
  }
  
  // Not connected, try to connect with retries
  onProgress?.("Connecting to relays...");
  
  try {
    await retry(
      async () => {
        const relays = await connectToRelays();
        if (relays.length === 0) {
          throw new Error("Failed to connect to any relays");
        }
        return relays;
      },
      {
        maxAttempts: maxRetries,
        baseDelay: 1000,
        maxDelay: 5000,
        onRetry: (attempt, error) => {
          onProgress?.(`Connection attempt ${attempt}/${maxRetries}...`);
          console.log(`Retry attempt ${attempt} for relay connection:`, error);
        }
      }
    );
    
    // Check if connected after retries
    connectedRelays = getConnectedRelays();
    if (connectedRelays.length === 0) {
      throw new Error("Failed to connect to any relays after retries");
    }
    
    onProgress?.(`Connected to ${connectedRelays.length} relays`);
    return connectedRelays;
  } catch (error) {
    console.error("Error connecting to relays:", error);
    throw new Error("Unable to connect to relays. Please check your network connection.");
  }
}

/**
 * Format bookmark tags for display
 */
export function formatBookmarkTags(tags: string[] = []): string[] {
  return tags.map(tag => {
    // Remove hashtags if present
    return tag.startsWith('#') ? tag.substring(1) : tag;
  });
}

/**
 * Extract tags from event
 */
export function extractTagsFromEvent(event: any): string[] {
  if (!event || !Array.isArray(event.tags)) return [];
  
  return event.tags
    .filter(tag => Array.isArray(tag) && tag[0] === 't' && tag.length >= 2)
    .map(tag => tag[1]);
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}
