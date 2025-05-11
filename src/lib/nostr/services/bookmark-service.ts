
import { BookmarkManagerFacade } from "../bookmark";
import { SimplePool } from "nostr-tools";
import { QueuedOperation } from "../bookmark/types";

/**
 * Provides bookmark functionality through an abstracted interface
 * Uses the BookmarkManagerFacade for implementation
 */
export class BookmarkService {
  private bookmarkManager: BookmarkManagerFacade;
  private pool: SimplePool;
  private getPublicKey: () => string | null;
  private getRelayUrls: () => string[];

  constructor(
    bookmarkManager: BookmarkManagerFacade,
    pool: SimplePool,
    getPublicKey: () => string | null,
    getRelayUrls: () => string[]
  ) {
    this.bookmarkManager = bookmarkManager;
    this.pool = pool;
    this.getPublicKey = getPublicKey;
    this.getRelayUrls = getRelayUrls;
  }

  /**
   * Add a bookmark
   */
  async addBookmark(
    eventId: string,
    collectionId?: string,
    tags?: string[],
    note?: string
  ): Promise<boolean> {
    try {
      const publicKey = this.getPublicKey();
      const relays = this.getRelayUrls();

      if (!publicKey) {
        throw new Error("Cannot add bookmark: Not logged in");
      }
      
      if (!eventId) {
        throw new Error("Cannot add bookmark: No event ID provided");
      }

      const result = await this.bookmarkManager.addBookmark(
        this.pool,
        publicKey,
        undefined, // privateKey (handled by extension)
        eventId,
        relays,
        collectionId,
        tags,
        note
      );

      return result;
    } catch (error) {
      console.error("Error adding bookmark:", error);
      throw error;
    }
  }

  /**
   * Remove a bookmark
   */
  async removeBookmark(eventId: string): Promise<boolean> {
    try {
      const publicKey = this.getPublicKey();
      const relays = this.getRelayUrls();

      if (!publicKey) {
        throw new Error("Cannot remove bookmark: Not logged in");
      }

      return await this.bookmarkManager.removeBookmark(
        this.pool,
        publicKey,
        undefined, // privateKey (handled by extension)
        eventId,
        relays
      );
    } catch (error) {
      console.error("Error removing bookmark:", error);
      throw error;
    }
  }

  /**
   * Get list of bookmarked event IDs
   */
  async getBookmarks(): Promise<string[]> {
    try {
      const publicKey = this.getPublicKey();
      const relays = this.getRelayUrls();

      if (!publicKey) {
        return [];
      }

      return await this.bookmarkManager.getBookmarkList(
        this.pool,
        publicKey,
        relays
      );
    } catch (error) {
      console.error("Error getting bookmarks:", error);
      return [];
    }
  }

  /**
   * Check if an event is already bookmarked
   */
  async isBookmarked(eventId: string): Promise<boolean> {
    try {
      const publicKey = this.getPublicKey();
      const relays = this.getRelayUrls();

      if (!publicKey) {
        return false;
      }

      return await this.bookmarkManager.isBookmarked(
        this.pool,
        publicKey,
        eventId,
        relays
      );
    } catch (error) {
      console.error("Error checking bookmark status:", error);
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
    try {
      const publicKey = this.getPublicKey();
      const relays = this.getRelayUrls();

      if (!publicKey) {
        throw new Error("Cannot create collection: Not logged in");
      }

      return await this.bookmarkManager.createCollection(
        this.pool,
        publicKey,
        undefined, // privateKey (handled by extension)
        name,
        relays,
        color,
        description
      );
    } catch (error) {
      console.error("Error creating bookmark collection:", error);
      throw error;
    }
  }

  /**
   * Get user's bookmark collections
   */
  async getBookmarkCollections(): Promise<any[]> {
    try {
      const publicKey = this.getPublicKey();
      const relays = this.getRelayUrls();

      if (!publicKey) {
        return [];
      }

      return await this.bookmarkManager.getCollections(
        this.pool,
        publicKey,
        relays
      );
    } catch (error) {
      console.error("Error getting bookmark collections:", error);
      return [];
    }
  }

  /**
   * Get bookmark metadata for user
   */
  async getBookmarkMetadata(): Promise<any[]> {
    try {
      const publicKey = this.getPublicKey();
      const relays = this.getRelayUrls();

      if (!publicKey) {
        return [];
      }

      return await this.bookmarkManager.getBookmarkMetadata(
        this.pool,
        publicKey,
        relays
      );
    } catch (error) {
      console.error("Error getting bookmark metadata:", error);
      return [];
    }
  }

  /**
   * Process any pending bookmark operations that were stored while offline
   */
  async processPendingOperations(): Promise<void> {
    try {
      const publicKey = this.getPublicKey();
      const relays = this.getRelayUrls();

      if (!publicKey) {
        return;
      }

      await this.bookmarkManager.processPendingOperations(
        this.pool,
        publicKey,
        undefined, // privateKey (handled by extension)
        relays
      );
    } catch (error) {
      console.error("Error processing pending operations:", error);
    }
  }

  /**
   * Queue an operation for later execution
   */
  async queueOperation(operation: QueuedOperation): Promise<void> {
    // Implementation would save to IndexedDB or localStorage
    console.log("Queuing operation:", operation);
  }
}
