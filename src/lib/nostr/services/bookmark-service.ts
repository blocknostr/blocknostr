
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
    
    return this.bookmarkManager.addBookmark(
      eventId, 
      this.publicKey, 
      null, // We're not storing private keys
      connectedRelays,
      this.pool,
      collectionId, 
      tags, 
      note
    );
  }
  
  /**
   * Remove a bookmark for an event
   */
  async removeBookmark(eventId: string): Promise<boolean> {
    if (!this.publicKey) return false;
    const connectedRelays = this.getConnectedRelayUrls();
    
    return this.bookmarkManager.removeBookmark(
      eventId, 
      this.publicKey, 
      null, // We're not storing private keys
      connectedRelays,
      this.pool
    );
  }
  
  /**
   * Get all bookmarks for the current user
   */
  async getBookmarks(): Promise<string[]> {
    if (!this.publicKey) return [];
    const connectedRelays = this.getConnectedRelayUrls();
    
    return this.bookmarkManager.getBookmarkList(
      this.publicKey,
      connectedRelays,
      this.pool
    );
  }
  
  /**
   * Check if an event is bookmarked
   */
  async isBookmarked(eventId: string): Promise<boolean> {
    if (!this.publicKey) return false;
    const connectedRelays = this.getConnectedRelayUrls();
    
    return this.bookmarkManager.isBookmarked(
      eventId,
      this.publicKey,
      connectedRelays,
      this.pool
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
      name,
      this.publicKey,
      null, // We're not storing private keys
      connectedRelays,
      this.pool,
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
      this.publicKey,
      connectedRelays,
      this.pool
    );
  }

  /**
   * Get bookmark metadata for all bookmarks
   */
  async getBookmarkMetadata(): Promise<BookmarkWithMetadata[]> {
    if (!this.publicKey) return [];
    const connectedRelays = this.getConnectedRelayUrls();
    
    return this.bookmarkManager.getBookmarkMetadata(
      this.publicKey,
      connectedRelays,
      this.pool
    );
  }
}
