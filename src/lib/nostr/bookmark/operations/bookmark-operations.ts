
import { SimplePool, type Filter } from 'nostr-tools';
import { BookmarkEventKinds, BookmarkManagerDependencies } from '../types';
import { validateRelays } from '../utils/bookmark-utils';

/**
 * Handles core bookmark operations (add, remove, list, check)
 */
export class BookmarkOperations {
  constructor(private dependencies: BookmarkManagerDependencies) {}
  
  /**
   * Add a bookmark for an event
   */
  async addBookmark(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
    eventId: string,
    relays: string[],
    collectionId?: string,
    tags?: string[],
    note?: string
  ): Promise<boolean> {
    if (!publicKey) {
      throw new Error("Cannot add bookmark: No public key provided");
    }
    
    if (!eventId) {
      throw new Error("Cannot add bookmark: No event ID provided");
    }
    
    // Validate relays
    validateRelays(relays);
    
    try {
      console.log(`Adding bookmark for event ${eventId} to relays:`, relays);
      
      // First get existing bookmarks
      const bookmarks = await this.getBookmarkList(
        pool,
        publicKey,
        relays
      );
      
      // Check if already bookmarked
      if (bookmarks.includes(eventId)) {
        console.log(`Event ${eventId} is already bookmarked`);
        // If already bookmarked, just update metadata if provided
        if (collectionId || tags?.length || note) {
          return this.updateBookmarkMetadata(
            pool, 
            publicKey, 
            privateKey, 
            eventId, 
            relays, 
            collectionId, 
            tags, 
            note
          );
        }
        return true; // Already bookmarked
      }
      
      // Create bookmarks list event (NIP-51 compliant replaceable event)
      const event = {
        kind: BookmarkEventKinds.BOOKMARKS,
        content: "",
        tags: [
          // NIP-33: Use "d" tag with "bookmarks" as identifier for parameterized replaceable events
          ["d", "bookmarks"],
          ...bookmarks.map(id => ["e", id]), // Include all existing bookmarks
          ["e", eventId] // Add new bookmark
        ]
      };
      
      console.log("Publishing bookmark event:", event);
      const publishResult = await this.dependencies.publishEvent(pool, publicKey, privateKey, event, relays);
      console.log("Bookmark publish result:", publishResult);
      
      if (!publishResult) {
        throw new Error("Failed to publish bookmark event");
      }
      
      // Also create bookmark metadata if provided
      if (publishResult && (collectionId || tags?.length || note)) {
        await this.updateBookmarkMetadata(
          pool, 
          publicKey, 
          privateKey, 
          eventId, 
          relays, 
          collectionId, 
          tags, 
          note
        );
      }
      
      return !!publishResult;
    } catch (error) {
      console.error("Error adding bookmark:", error);
      throw error;
    }
  }
  
  /**
   * Remove a bookmark
   */
  async removeBookmark(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
    eventId: string,
    relays: string[]
  ): Promise<boolean> {
    if (!publicKey) {
      throw new Error("Cannot remove bookmark: No public key provided");
    }
    
    if (!eventId) {
      throw new Error("Cannot remove bookmark: No event ID provided");
    }
    
    // Validate relays
    validateRelays(relays);
    
    try {
      console.log(`Removing bookmark for event ${eventId} from relays:`, relays);
      
      // First get existing bookmarks
      const bookmarks = await this.getBookmarkList(
        pool,
        publicKey,
        relays
      );
      
      // Check if it's actually bookmarked
      if (!bookmarks.includes(eventId)) {
        console.log(`Event ${eventId} is not bookmarked, nothing to remove`);
        return true; // Not bookmarked, nothing to do
      }
      
      // Create updated bookmarks list event without the removed bookmark (NIP-51 compliant)
      const event = {
        kind: BookmarkEventKinds.BOOKMARKS,
        content: "",
        tags: [
          // NIP-33: Use "d" tag with "bookmarks" as identifier for parameterized replaceable events
          ["d", "bookmarks"],
          ...bookmarks
            .filter(id => id !== eventId)
            .map(id => ["e", id])
        ]
      };
      
      console.log("Publishing bookmark removal event:", event);
      const publishResult = await this.dependencies.publishEvent(pool, publicKey, privateKey, event, relays);
      console.log("Bookmark removal result:", publishResult);
      
      if (!publishResult) {
        throw new Error("Failed to publish bookmark removal event");
      }
      
      // Also remove any bookmark metadata
      if (publishResult) {
        await this.removeBookmarkMetadata(pool, publicKey, privateKey, eventId, relays);
      }
      
      return !!publishResult;
    } catch (error) {
      console.error("Error removing bookmark:", error);
      throw error;
    }
  }
  
  /**
   * Get list of bookmarked event IDs
   */
  async getBookmarkList(
    pool: SimplePool,
    pubkey: string,
    relays: string[]
  ): Promise<string[]> {
    // Validate relays
    validateRelays(relays);
    
    return new Promise<string[]>((resolve, reject) => {
      let bookmarkedIds: string[] = [];
      
      // Subscribe to bookmark list events (NIP-51 compliant)
      const filter: Filter = {
        kinds: [BookmarkEventKinds.BOOKMARKS],
        authors: [pubkey],
        "#d": ["bookmarks"], // NIP-33: Filter by "d" tag to get only bookmark lists
        limit: 1
      };
      
      try {
        const sub = pool.subscribe(relays, filter, {
          onevent: (event) => {
            // Extract e tags (bookmarked event IDs)
            const bookmarks = event.tags
              .filter(tag => tag.length >= 2 && tag[0] === 'e')
              .map(tag => tag[1]);
            
            bookmarkedIds = bookmarks;
          }
        });
        
        // Set a timeout to resolve with found bookmarks
        const timeout = 5000;
        setTimeout(() => {
          sub.close();
          resolve(bookmarkedIds);
        }, timeout);
      } catch (error) {
        console.error("Error getting bookmark list:", error);
        resolve([]); // Resolve with empty array instead of rejecting
      }
    });
  }
  
  /**
   * Check if an event is bookmarked
   */
  async isBookmarked(
    pool: SimplePool,
    pubkey: string,
    eventId: string,
    relays: string[]
  ): Promise<boolean> {
    const bookmarks = await this.getBookmarkList(pool, pubkey, relays);
    return bookmarks.includes(eventId);
  }
  
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
      // Generate a stable identifier for this bookmark's metadata
      const stableId = this.generateStableMetadataId(eventId);
      
      // Create metadata object
      const metadata: Record<string, any> = {};
      if (collectionId) metadata.collectionId = collectionId;
      if (note) metadata.note = note;
      
      // Add creation timestamp if this is the first time
      metadata.createdAt = Math.floor(Date.now() / 1000);
      
      // Create metadata event (NIP-33 compliant parameterized replaceable event)
      const event = {
        kind: BookmarkEventKinds.BOOKMARK_METADATA,
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
      const publishResult = await this.dependencies.publishEvent(pool, publicKey, privateKey, event, relays);
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
      const stableId = this.generateStableMetadataId(eventId);
      
      // Create deletion event (NIP-09 compliant)
      const event = {
        kind: BookmarkEventKinds.DELETE,
        content: "Deleted bookmark metadata",
        tags: [
          // NIP-09 format: ["a", "<kind>:<pubkey>:<d-identifier>"]
          ["a", `${BookmarkEventKinds.BOOKMARK_METADATA}:${publicKey}:${stableId}`]
        ]
      };
      
      console.log("Publishing bookmark metadata deletion:", event);
      const result = await this.dependencies.publishEvent(pool, publicKey, privateKey, event, relays);
      console.log("Bookmark metadata deletion result:", result);
      
      return !!result;
    } catch (error) {
      console.error("Error removing bookmark metadata:", error);
      return false;
    }
  }
  
  /**
   * Generate a stable identifier for bookmark metadata
   */
  private generateStableMetadataId(eventId: string): string {
    return `meta_${eventId.substring(0, 8)}`;
  }
}
