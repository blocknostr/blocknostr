
import { SimplePool } from 'nostr-tools';

/**
 * Common utility functions for bookmark operations
 */

/**
 * Validate relays array to ensure it's not empty
 */
export function validateRelays(relays: string[]): void {
  if (!relays || !Array.isArray(relays) || relays.length === 0) {
    throw new Error("No relays provided for bookmark operation");
  }
}

/**
 * Generate a stable identifier for bookmark metadata
 * This ensures the same event will always have the same metadata identifier
 */
export function generateStableMetadataId(eventId: string): string {
  return `meta_${eventId.substring(0, 10)}`;
}

/**
 * Check if relays are connected and try to reconnect if necessary
 */
export async function ensureRelayConnection(
  pool: SimplePool,
  getConnectedRelayUrls: () => string[],
  connectToRelays: () => Promise<void>
): Promise<string[]> {
  // Check if any relays are already connected
  let connectedRelays = getConnectedRelayUrls();
  
  if (connectedRelays.length === 0) {
    console.log("No connected relays found. Attempting to connect...");
    
    try {
      // Try connecting to relays
      await connectToRelays();
      
      // Check if connection was successful
      connectedRelays = getConnectedRelayUrls();
      
      if (connectedRelays.length === 0) {
        throw new Error("Failed to connect to any relays");
      }
      
      console.log(`Successfully connected to ${connectedRelays.length} relays`);
    } catch (error) {
      console.error("Error connecting to relays:", error);
      throw error;
    }
  }
  
  return connectedRelays;
}
