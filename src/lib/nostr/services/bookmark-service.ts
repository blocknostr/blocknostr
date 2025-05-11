import { SimplePool } from 'nostr-tools';
import { BookmarkCollection, BookmarkWithMetadata, BookmarkManagerFacade } from '../bookmark';

/**
 * Bookmark service that handles bookmark-related methods
 */
export class BookmarkService {
  constructor(
    private bookmarkManager: BookmarkManagerFacade, 
    private pool: SimplePool, 
    private publicKey: string | null,
    private getConnectedRelayUrls: () => string[]
  ) {}

  /**
   * Ensure we have connected relays before proceeding with bookmark operations
   * @returns Array of connected relay URLs or throws error if none available
   */
  private async ensureConnectedRelays(): Promise<string[]> {
    // Get currently connected relays
    let connectedRelays = this.getConnectedRelayUrls();
    
    // If no relays are connected, try to connect
    if (connectedRelays.length === 0) {
      console.log("No connected relays found. Attempting to connect to user relays...");
      
      // Import the nostrService from the index file where it's correctly exported
      const { nostrService } = await import("../index");
      await nostrService.connectToUserRelays();
      
      // Check if we have connections now
      connectedRelays = this.getConnectedRelayUrls();
      
      if (connectedRelays.length === 0) {
        throw new Error("Failed to connect to any relays. Please check your network connection or relay configuration.");
      }
      
      console.log(`Successfully connected to ${connectedRelays.length} relays`);
    }
    
    return connectedRelays;
  }

  /**
   * Add a bookmark for an event
   */
  async addBookmark(
    eventId: string, 
    collectionId?: string,
    tags?: string[],
    note?: string
  ): Promise<boolean> {
    if (!this.publicKey) {
      console.error("Cannot add bookmark: No public key (user not logged in)");
      return false;
    }
    
    try {
      // Ensure relays are connected
      const connectedRelays = await this.ensureConnectedRelays();
      console.log(`Adding bookmark using ${connectedRelays.length} relays:`, connectedRelays);
      
      // Pass privateKey as undefined to let NostrService handle signing via extension
      const result = await this.bookmarkManager.addBookmark(
        this.pool,
        this.publicKey, 
        undefined, // Let NostrService handle signing using the extension
        eventId,
        connectedRelays,
        collectionId, 
        tags, 
        note
      );
      
      if (!result) {
        console.error("Bookmark operation failed but didn't throw an error");
      }
      
      return !!result;
    } catch (error) {
      console.error("Error in BookmarkService.addBookmark:", error);
      throw error; // Re-throw to allow UI layer to handle the specific error
    }
  }
  
  /**
   * Remove a bookmark for an event
   */
  async removeBookmark(eventId: string): Promise<boolean> {
    if (!this.publicKey) {
      console.error("Cannot remove bookmark: No public key (user not logged in)");
      return false;
    }
    
    try {
      // Ensure relays are connected
      const connectedRelays = await this.ensureConnectedRelays();
      console.log(`Removing bookmark using ${connectedRelays.length} relays:`, connectedRelays);
      
      // Pass privateKey as undefined to let NostrService handle signing via extension
      const result = await this.bookmarkManager.removeBookmark(
        this.pool,
        this.publicKey, 
        undefined, // Let NostrService handle signing using the extension
        eventId, 
        connectedRelays
      );
      
      if (!result) {
        console.error("Bookmark removal operation failed but didn't throw an error");
      }
      
      return !!result;
    } catch (error) {
      console.error("Error in BookmarkService.removeBookmark:", error);
      throw error; // Re-throw to allow UI layer to handle the specific error
    }
  }
  
  /**
   * Get all bookmarks for the current user
   */
  async getBookmarks(): Promise<string[]> {
    if (!this.publicKey) {
      console.log("Cannot get bookmarks: No public key (user not logged in)");
      return [];
    }
    
    try {
      const connectedRelays = await this.ensureConnectedRelays();
      
      return this.bookmarkManager.getBookmarkList(
        this.pool,
        this.publicKey,
        connectedRelays
      );
    } catch (error) {
      console.error("Error in BookmarkService.getBookmarks:", error);
      return [];
    }
  }
  
  /**
   * Check if an event is bookmarked
   */
  async isBookmarked(eventId: string): Promise<boolean> {
    if (!this.publicKey) {
      return false;
    }
    
    try {
      const connectedRelays = await this.ensureConnectedRelays();
      
      return this.bookmarkManager.isBookmarked(
        this.pool,
        this.publicKey, 
        eventId,
        connectedRelays
      );
    } catch (error) {
      console.error("Error in BookmarkService.isBookmarked:", error);
      return false;
    }
  }

  /**
   * Create a new bookmark collection
   */
  async createBookmarkCollection(
    name: string,
    color?: string,
    description?: string
  ): Promise<string | null> {
    if (!this.publicKey) {
      console.error("Cannot create collection: No public key (user not logged in)");
      return null;
    }
    
    try {
      const connectedRelays = await this.ensureConnectedRelays();
      
      return this.bookmarkManager.createCollection(
        this.pool,
        this.publicKey,
        undefined, // Let NostrService handle signing using the extension
        name,
        connectedRelays,
        color,
        description
      );
    } catch (error) {
      console.error("Error in BookmarkService.createBookmarkCollection:", error);
      return null;
    }
  }

  /**
   * Get all bookmark collections for the current user
   */
  async getBookmarkCollections(): Promise<BookmarkCollection[]> {
    if (!this.publicKey) {
      return [];
    }
    
    try {
      const connectedRelays = await this.ensureConnectedRelays();
      
      return this.bookmarkManager.getCollections(
        this.pool,
        this.publicKey,
        connectedRelays
      );
    } catch (error) {
      console.error("Error in BookmarkService.getBookmarkCollections:", error);
      return [];
    }
  }

  /**
   * Get bookmark metadata for all bookmarks
   */
  async getBookmarkMetadata(): Promise<BookmarkWithMetadata[]> {
    if (!this.publicKey) {
      return [];
    }
    
    try {
      const connectedRelays = await this.ensureConnectedRelays();
      
      return this.bookmarkManager.getBookmarkMetadata(
        this.pool,
        this.publicKey,
        connectedRelays
      );
    } catch (error) {
      console.error("Error in BookmarkService.getBookmarkMetadata:", error);
      return [];
    }
  }
}
