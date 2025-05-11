
import { SimplePool } from 'nostr-tools';
import { BookmarkManagerFacade } from '../../bookmark';
import { BookmarkCoreService } from './bookmark-core-service';
import { BookmarkOperationsService } from './bookmark-operations-service';
import { BookmarkCollectionService } from './bookmark-collection-service';
import { BookmarkMetadataService } from './bookmark-metadata-service';

/**
 * Main bookmark service that composes specialized services
 */
export class BookmarkService implements 
  Omit<BookmarkOperationsService, "ensureConnectedRelays">,
  Omit<BookmarkCollectionService, "ensureConnectedRelays">,
  Omit<BookmarkMetadataService, "ensureConnectedRelays"> {

  private operationsService: BookmarkOperationsService;
  private collectionService: BookmarkCollectionService;
  private metadataService: BookmarkMetadataService;

  constructor(
    bookmarkManager: BookmarkManagerFacade, 
    pool: SimplePool, 
    publicKey: string | null,
    getConnectedRelayUrls: () => string[]
  ) {
    this.operationsService = new BookmarkOperationsService(
      bookmarkManager, pool, publicKey, getConnectedRelayUrls
    );
    
    this.collectionService = new BookmarkCollectionService(
      bookmarkManager, pool, publicKey, getConnectedRelayUrls
    );
    
    this.metadataService = new BookmarkMetadataService(
      bookmarkManager, pool, publicKey, getConnectedRelayUrls
    );
  }

  // BookmarkOperationsService methods
  async addBookmark(...args: Parameters<BookmarkOperationsService['addBookmark']>) {
    return this.operationsService.addBookmark(...args);
  }
  
  async removeBookmark(...args: Parameters<BookmarkOperationsService['removeBookmark']>) {
    return this.operationsService.removeBookmark(...args);
  }
  
  async getBookmarks(...args: Parameters<BookmarkOperationsService['getBookmarks']>) {
    return this.operationsService.getBookmarks(...args);
  }
  
  async isBookmarked(...args: Parameters<BookmarkOperationsService['isBookmarked']>) {
    return this.operationsService.isBookmarked(...args);
  }
  
  // Add the missing processPendingOperations method
  async processPendingOperations(): Promise<void> {
    return this.operationsService.processPendingOperations();
  }

  // BookmarkCollectionService methods
  async createBookmarkCollection(...args: Parameters<BookmarkCollectionService['createBookmarkCollection']>) {
    return this.collectionService.createBookmarkCollection(...args);
  }
  
  async getBookmarkCollections(...args: Parameters<BookmarkCollectionService['getBookmarkCollections']>) {
    return this.collectionService.getBookmarkCollections(...args);
  }

  // BookmarkMetadataService methods
  async getBookmarkMetadata(...args: Parameters<BookmarkMetadataService['getBookmarkMetadata']>) {
    return this.metadataService.getBookmarkMetadata(...args);
  }
}

// Re-export the BookmarkService
export * from './bookmark-core-service';
export * from './bookmark-operations-service';
export * from './bookmark-collection-service';
export * from './bookmark-metadata-service';
