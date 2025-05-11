
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
      this.pool,
      this.publicKey,
      null, // We're not storing private keys
      eventId,
      connectedRelays,
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
      this.pool,
      this.publicKey,
      null, // We're not storing private keys
      eventId,
      connectedRelays
    );
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
      null, // We're not storing private keys
      name,
      connectedRelays,
      color,
      description
    );
  }

  /**
   * Update a bookmark collection
   */
  async updateBookmarkCollection(
    collectionId: string,
    updates: Partial<BookmarkCollection>
  ): Promise<boolean> {
    if (!this.publicKey) return false;
    const connectedRelays = this.getConnectedRelayUrls();
    return this.bookmarkManager.updateCollection(
      this.pool,
      this.publicKey,
      null, // We're not storing private keys
      collectionId,
      updates,
      connectedRelays
    );
  }

  /**
   * Delete a bookmark collection
   */
  async deleteBookmarkCollection(collectionId: string): Promise<boolean> {
    if (!this.publicKey) return false;
    const connectedRelays = this.getConnectedRelayUrls();
    return this.bookmarkManager.deleteCollection(
      this.pool,
      this.publicKey,
      null, // We're not storing private keys
      collectionId,
      connectedRelays
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
   * Update bookmark metadata
   */
  async updateBookmarkMetadata(
    eventId: string,
    collectionId?: string,
    tags?: string[],
    note?: string
  ): Promise<boolean> {
    if (!this.publicKey) return false;
    const connectedRelays = this.getConnectedRelayUrls();
    return this.bookmarkManager.updateBookmarkMetadata(
      this.pool,
      this.publicKey,
      null, // We're not storing private keys
      eventId,
      connectedRelays,
      collectionId,
      tags,
      note
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
