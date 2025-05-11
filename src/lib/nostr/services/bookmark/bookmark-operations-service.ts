
import { SimplePool } from 'nostr-tools';
import { BookmarkManagerFacade } from '../../bookmark';
import { BookmarkCoreService } from './bookmark-core-service';

/**
 * Service handling core bookmark operations (add, remove, check)
 */
export class BookmarkOperationsService extends BookmarkCoreService {
  constructor(
    bookmarkManager: BookmarkManagerFacade,
    pool: SimplePool,
    publicKey: string | null,
    getConnectedRelayUrls: () => string[]
  ) {
    super(bookmarkManager, pool, publicKey, getConnectedRelayUrls);
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
}
