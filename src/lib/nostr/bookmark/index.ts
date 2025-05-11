
import { BookmarkManager } from './bookmark-manager';
import { BookmarkCollectionManager, BookmarkMetadataManager } from './collection-manager';
import { EventManager } from '../event';
import { BookmarkManagerDependencies, BookmarkCollection, BookmarkWithMetadata } from './types';

export { BookmarkCollection, BookmarkWithMetadata } from './types';

/**
 * Main entry point for bookmark functionality
 */
export class BookmarkManagerFacade {
  private bookmarkManager: BookmarkManager;
  private collectionManager: BookmarkCollectionManager;
  private metadataManager: BookmarkMetadataManager;
  
  constructor(eventManager: EventManager) {
    const dependencies: BookmarkManagerDependencies = {
      publishEvent: eventManager.publishEvent.bind(eventManager)
    };
    
    this.bookmarkManager = new BookmarkManager(dependencies);
    this.collectionManager = new BookmarkCollectionManager(dependencies);
    this.metadataManager = new BookmarkMetadataManager(dependencies);
  }
  
  // Re-expose bookmark methods
  async addBookmark(...args: Parameters<BookmarkManager['addBookmark']>) {
    return this.bookmarkManager.addBookmark(...args);
  }
  
  async removeBookmark(...args: Parameters<BookmarkManager['removeBookmark']>) {
    return this.bookmarkManager.removeBookmark(...args);
  }
  
  async getBookmarkList(...args: Parameters<BookmarkManager['getBookmarkList']>) {
    return this.bookmarkManager.getBookmarkList(...args);
  }
  
  async isBookmarked(...args: Parameters<BookmarkManager['isBookmarked']>) {
    return this.bookmarkManager.isBookmarked(...args);
  }
  
  // Re-expose collection methods
  async createCollection(...args: Parameters<BookmarkCollectionManager['createCollection']>) {
    return this.collectionManager.createCollection(...args);
  }
  
  async updateCollection(...args: Parameters<BookmarkCollectionManager['updateCollection']>) {
    return this.collectionManager.updateCollection(...args);
  }
  
  async deleteCollection(...args: Parameters<BookmarkCollectionManager['deleteCollection']>) {
    return this.collectionManager.deleteCollection(...args);
  }
  
  async getCollections(...args: Parameters<BookmarkCollectionManager['getCollections']>) {
    return this.collectionManager.getCollections(...args);
  }
  
  // Re-expose metadata methods
  async getBookmarkMetadata(...args: Parameters<BookmarkMetadataManager['getBookmarkMetadata']>) {
    return this.metadataManager.getBookmarkMetadata(...args);
  }
  
  // Pass through additional methods
  async updateBookmarkMetadata(...args: Parameters<BookmarkManager['updateBookmarkMetadata']>) {
    return this.bookmarkManager.updateBookmarkMetadata(...args);
  }
  
  async removeBookmarkMetadata(...args: Parameters<BookmarkManager['removeBookmarkMetadata']>) {
    return this.bookmarkManager.removeBookmarkMetadata(...args);
  }
}
