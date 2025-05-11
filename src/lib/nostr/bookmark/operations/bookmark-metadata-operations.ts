
import { SimplePool } from 'nostr-tools';
import { EVENT_KINDS } from '../../constants';
import { BookmarkManagerDependencies } from '../types';
import { validateRelays, generateStableMetadataId } from '../utils/bookmark-utils';

/**
 * Handles bookmark metadata operations
 */
export class BookmarkMetadataOperations {
  constructor(private dependencies: BookmarkManagerDependencies) {}
  
  /**
   * Update bookmark metadata
   */
  async updateBookmarkMetadata(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
    eventId: string,
    relays: string[],
    collectionId?: string,
    tags?: string[],
    note?: string
  ): Promise<boolean> {
    if (!publicKey) return false;
    
    // Validate relays
    validateRelays(relays);
    
    try {
      // Create metadata object
      const metadata: Record<string, any> = {};
      if (collectionId) metadata.collectionId = collectionId;
      if (note) metadata.note = note;
      
      // Generate a stable identifier for this bookmark's metadata
      const stableId = generateStableMetadataId(eventId);
      
      // Create metadata event (NIP-33 compliant parameterized replaceable event)
      const event = {
        kind: EVENT_KINDS.BOOKMARK_METADATA,
        content: JSON.stringify(metadata),
        tags: [
          ["e", eventId], // Reference to bookmarked event
          ["d", stableId] // Stable identifier for this specific bookmark's metadata
        ]
      };
      
      // Add tags if provided (using proper "t" tag per NIP-standardization)
      if (tags && tags.length > 0) {
        tags.forEach(tag => {
          event.tags.push(["t", tag]);
        });
      }
      
      console.log("Publishing bookmark metadata:", event);
      // Use the single-argument version
      const publishResult = await this.dependencies.publishEvent(event);
      console.log("Bookmark metadata publish result:", publishResult);
      
      return !!publishResult;
    } catch (error) {
      console.error("Error updating bookmark metadata:", error);
      return false;
    }
  }
  
  /**
   * Remove bookmark metadata
   */
  async removeBookmarkMetadata(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
    eventId: string,
    relays: string[]
  ): Promise<boolean> {
    if (!publicKey) return false;
    
    // Validate relays
    validateRelays(relays);
    
    try {
      // Generate the same stable identifier for the bookmark's metadata
      const stableId = generateStableMetadataId(eventId);
      
      // Create deletion event (NIP-09 compliant)
      const event = {
        kind: EVENT_KINDS.DELETE,
        content: "Deleted bookmark metadata",
        tags: [
          // NIP-09 format: ["a", "<kind>:<pubkey>:<d-identifier>"]
          ["a", `${EVENT_KINDS.BOOKMARK_METADATA}:${publicKey}:${stableId}`]
        ]
      };
      
      console.log("Publishing bookmark metadata deletion:", event);
      // Use the single-argument version
      const result = await this.dependencies.publishEvent(event);
      console.log("Bookmark metadata deletion result:", result);
      
      return !!result;
    } catch (error) {
      console.error("Error removing bookmark metadata:", error);
      return false;
    }
  }
}
