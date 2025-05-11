
import { SimplePool } from 'nostr-tools';
import { BookmarkCollection, BookmarkWithMetadata } from '../bookmark';

/**
 * Bookmark service that handles bookmark-related methods
 */
export class BookmarkService {
  constructor(
    private bookmarkManager: any, 
    private pool: SimplePool, 
    private publicKey: string | null,
    private getConnectedRelayUrls: () => string[]
  ) {}

  /**
   * Add a bookmark for an event
   */
  async addBookmark(
    eventId: string, 
    collectionId?: string,
    tags?: string[],
    note?: string
  ): Promise<boolean> {
    if (!this.publicKey) return false;
    const connectedRelays = this.getConnectedRelayUrls();
    
    try {
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
      
      return !!result;
    } catch (error) {
      console.error("Error in BookmarkService.addBookmark:", error);
      return false;
    }
  }
  
  /**
   * Remove a bookmark for an event
   */
  async removeBookmark(eventId: string): Promise<boolean> {
    if (!this.publicKey) return false;
    const connectedRelays = this.getConnectedRelayUrls();
    
    try {
      // Pass privateKey as undefined to let NostrService handle signing via extension
      const result = await this.bookmarkManager.removeBookmark(
        this.pool,
        this.publicKey, 
        undefined, // Let NostrService handle signing using the extension
        eventId, 
        connectedRelays
      );
      
      return !!result;
    } catch (error) {
      console.error("Error in BookmarkService.removeBookmark:", error);
      return false;
    }
  }
  
  /**
   * Get all bookmarks for the current user
   */
  async getBookmarks(): Promise<string[]> {
    if (!this.publicKey) return [];
    const connectedRelays = this.getConnectedRelayUrls();
    
    return this.bookmarkManager.getBookmarkList(
      this.pool,
      this.publicKey,
      connectedRelays
    );
  }
  
  /**
   * Check if an event is bookmarked
   */
  async isBookmarked(eventId: string): Promise<boolean> {
    if (!this.publicKey) return false;
    const connectedRelays = this.getConnectedRelayUrls();
    
    return this.bookmarkManager.isBookmarked(
      this.pool,
      this.publicKey, 
      eventId,
      connectedRelays
    );
  }

  /**
   * Create a new bookmark collection
   */
  async createBookmarkCollection(
    name: string,
    color?: string,
    description?: string
  ): Promise<string | null> {
    if (!this.publicKey) return null;
    const connectedRelays = this.getConnectedRelayUrls();
    
    return this.bookmarkManager.createCollection(
      this.pool,
      this.publicKey,
      undefined, // Let NostrService handle signing using the extension
      name,
      connectedRelays,
      color,
      description
    );
  }

  /**
   * Get all bookmark collections for the current user
   */
  async getBookmarkCollections(): Promise<BookmarkCollection[]> {
    if (!this.publicKey) return [];
    const connectedRelays = this.getConnectedRelayUrls();
    
    return this.bookmarkManager.getCollections(
      this.pool,
      this.publicKey,
      connectedRelays
    );
  }

  /**
   * Get bookmark metadata for all bookmarks
   */
  async getBookmarkMetadata(): Promise<BookmarkWithMetadata[]> {
    if (!this.publicKey) return [];
    const connectedRelays = this.getConnectedRelayUrls();
    
    return this.bookmarkManager.getBookmarkMetadata(
      this.pool,
      this.publicKey,
      connectedRelays
    );
  }
}
