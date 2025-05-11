
import { BookmarkManager } from './bookmark-manager';
import { EventManager } from '../event';
import { BookmarkManagerDependencies } from './types';

// Re-export types
export type { 
  BookmarkCollection, 
  BookmarkWithMetadata,
  PendingOperation,
  BookmarkFilters,
  BookmarkStatus,
  BookmarkOperationType
} from './types';

// Re-export storage 
export { BookmarkStorage } from './storage/bookmark-storage';

// Re-export utils
export { validateRelays, ensureRelayConnection, generateStableMetadataId } from './utils/bookmark-utils';

/**
 * Main entry point for bookmark functionality
 */
export class BookmarkManagerFacade {
  private bookmarkManager: BookmarkManager;
  
  constructor(eventManager: EventManager) {
    const dependencies: BookmarkManagerDependencies = {
      publishEvent: eventManager.publishEvent.bind(eventManager)
    };
    
    this.bookmarkManager = new BookmarkManager(dependencies);
  }
  
  // Re-expose all methods from the BookmarkManager
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
  
  async createCollection(...args: Parameters<BookmarkManager['createCollection']>) {
    return this.bookmarkManager.createCollection(...args);
  }
  
  async updateCollection(...args: Parameters<BookmarkManager['updateCollection']>) {
    return this.bookmarkManager.updateCollection(...args);
  }
  
  async deleteCollection(...args: Parameters<BookmarkManager['deleteCollection']>) {
    return this.bookmarkManager.deleteCollection(...args);
  }
  
  async getCollections(...args: Parameters<BookmarkManager['getCollections']>) {
    return this.bookmarkManager.getCollections(...args);
  }
  
  async getBookmarkMetadata(...args: Parameters<BookmarkManager['getBookmarkMetadata']>) {
    return this.bookmarkManager.getBookmarkMetadata(...args);
  }
  
  async updateBookmarkMetadata(...args: Parameters<BookmarkManager['updateBookmarkMetadata']>) {
    return this.bookmarkManager.updateBookmarkMetadata(...args);
  }
  
  async removeBookmarkMetadata(...args: Parameters<BookmarkManager['removeBookmarkMetadata']>) {
    return this.bookmarkManager.removeBookmarkMetadata(...args);
  }
}
