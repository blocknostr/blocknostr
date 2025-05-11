
import { SimplePool, type Filter } from 'nostr-tools';
import { EVENT_KINDS } from '../constants';
import { BookmarkManagerDependencies } from './types';

/**
 * Manages core bookmark functionality
 */
export class BookmarkManager {
  private dependencies: BookmarkManagerDependencies;
  
  constructor(dependencies: BookmarkManagerDependencies) {
    this.dependencies = dependencies;
  }
  
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
      console.error("Cannot add bookmark: No public key provided");
      return false;
    }
    
    if (!eventId) {
      console.error("Cannot add bookmark: No event ID provided");
      return false;
    }
    
    if (relays.length === 0) {
      console.error("Cannot add bookmark: No relays provided");
      return false;
    }
    
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
          return this.updateBookmarkMetadata(pool, publicKey, privateKey, eventId, relays, collectionId, tags, note);
        }
        return true; // Already bookmarked
      }
      
      // Create bookmarks list event (NIP-51 compliant replaceable event)
      const event = {
        kind: EVENT_KINDS.BOOKMARKS,
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
      
      // Also create bookmark metadata if provided
      if (publishResult && (collectionId || tags?.length || note)) {
        await this.updateBookmarkMetadata(pool, publicKey, privateKey, eventId, relays, collectionId, tags, note);
      }
      
      return !!publishResult;
    } catch (error) {
      console.error("Error adding bookmark:", error);
      return false;
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
      console.error("Cannot remove bookmark: No public key provided");
      return false;
    }
    
    if (!eventId) {
      console.error("Cannot remove bookmark: No event ID provided");
      return false;
    }
    
    if (relays.length === 0) {
      console.error("Cannot remove bookmark: No relays provided");
      return false;
    }
    
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
        kind: EVENT_KINDS.BOOKMARKS,
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
      
      // Also remove any bookmark metadata
      if (publishResult) {
        await this.removeBookmarkMetadata(pool, publicKey, privateKey, eventId, relays);
      }
      
      return !!publishResult;
    } catch (error) {
      console.error("Error removing bookmark:", error);
      return false;
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
    return new Promise((resolve) => {
      let bookmarkedIds: string[] = [];
      
      // Subscribe to bookmark list events (NIP-51 compliant)
      const filter: Filter = {
        kinds: [EVENT_KINDS.BOOKMARKS],
        authors: [pubkey],
        "#d": ["bookmarks"], // NIP-33: Filter by "d" tag to get only bookmark lists
        limit: 1
      };
      
      const sub = pool.subscribe(relays, filter, {
        onevent: (event) => {
          // Extract e tags (bookmarked event IDs)
          const bookmarks = event.tags
            .filter(tag => tag.length >= 2 && tag[0] === 'e')
            .map(tag => tag[1]);
          
          bookmarkedIds = bookmarks;
        }
      });
      
      // Set a configurable timeout to resolve with found bookmarks
      const timeout = 3000; // Could be made configurable based on network conditions
      setTimeout(() => {
        sub.close();
        resolve(bookmarkedIds);
      }, timeout);
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
    
    // Create metadata object
    const metadata: Record<string, any> = {};
    if (collectionId) metadata.collectionId = collectionId;
    if (note) metadata.note = note;
    
    // Generate a stable identifier for this bookmark's metadata
    const stableId = `meta_${eventId.substring(0, 8)}`;
    
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
    
    const publishResult = await this.dependencies.publishEvent(pool, publicKey, privateKey, event, relays);
    return !!publishResult;
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
    
    // Generate the same stable identifier for the bookmark's metadata
    const stableId = `meta_${eventId.substring(0, 8)}`;
    
    // Create deletion event (NIP-09 compliant)
    const event = {
      kind: EVENT_KINDS.DELETE,
      content: "Deleted bookmark metadata",
      tags: [
        // NIP-09 format: ["a", "<kind>:<pubkey>:<d-identifier>"]
        ["a", `${EVENT_KINDS.BOOKMARK_METADATA}:${publicKey}:${stableId}`]
      ]
    };
    
    const result = await this.dependencies.publishEvent(pool, publicKey, privateKey, event, relays);
    return !!result;
  }
}
