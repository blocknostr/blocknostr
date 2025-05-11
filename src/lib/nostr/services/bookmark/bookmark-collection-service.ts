
import { SimplePool } from 'nostr-tools';
import { BookmarkCollection, BookmarkManagerFacade } from '../../bookmark';
import { BookmarkCoreService } from './bookmark-core-service';

/**
 * Service handling bookmark collection operations
 */
export class BookmarkCollectionService extends BookmarkCoreService {
  constructor(
    bookmarkManager: BookmarkManagerFacade,
    pool: SimplePool,
    publicKey: string | null,
    getConnectedRelayUrls: () => string[]
  ) {
    super(bookmarkManager, pool, publicKey, getConnectedRelayUrls);
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
}
