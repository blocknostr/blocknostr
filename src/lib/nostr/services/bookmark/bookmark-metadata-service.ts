
import { SimplePool } from 'nostr-tools';
import { BookmarkWithMetadata, BookmarkManagerFacade } from '../../bookmark';
import { BookmarkCoreService } from './bookmark-core-service';

/**
 * Service handling bookmark metadata operations
 */
export class BookmarkMetadataService extends BookmarkCoreService {
  constructor(
    bookmarkManager: BookmarkManagerFacade,
    pool: SimplePool,
    publicKey: string | null,
    getConnectedRelayUrls: () => string[]
  ) {
    super(bookmarkManager, pool, publicKey, getConnectedRelayUrls);
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
