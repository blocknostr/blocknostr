
import { SimplePool } from 'nostr-tools';

/**
 * Common utility functions for bookmark operations
 */
export function validateRelays(relays: string[]): void {
  if (relays.length === 0) {
    throw new Error("Cannot perform bookmark operation: No relays provided");
  }
}

/**
 * Generate a stable identifier for a bookmark metadata
 */
export function generateStableMetadataId(eventId: string): string {
  return `meta_${eventId.substring(0, 8)}`;
}
