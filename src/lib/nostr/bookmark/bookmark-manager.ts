
import { BookmarkManagerDependencies } from './types';
import { BookmarkOperations } from './operations/bookmark-operations';
import { BookmarkMetadataOperations } from './operations/bookmark-metadata-operations';

/**
 * Manages core bookmark functionality
 */
export class BookmarkManager {
  private bookmarkOps: BookmarkOperations;
  private metadataOps: BookmarkMetadataOperations;
  
  constructor(dependencies: BookmarkManagerDependencies) {
    this.bookmarkOps = new BookmarkOperations(dependencies);
    this.metadataOps = new BookmarkMetadataOperations(dependencies);
  }
  
  /**
   * Add a bookmark for an event
   */
  async addBookmark(...args: Parameters<BookmarkOperations['addBookmark']>) {
    return this.bookmarkOps.addBookmark(...args);
  }
  
  /**
   * Remove a bookmark
   */
  async removeBookmark(...args: Parameters<BookmarkOperations['removeBookmark']>) {
    return this.bookmarkOps.removeBookmark(...args);
  }
  
  /**
   * Get list of bookmarked event IDs
   */
  async getBookmarkList(...args: Parameters<BookmarkOperations['getBookmarkList']>) {
    return this.bookmarkOps.getBookmarkList(...args);
  }
  
  /**
   * Check if an event is bookmarked
   */
  async isBookmarked(...args: Parameters<BookmarkOperations['isBookmarked']>) {
    return this.bookmarkOps.isBookmarked(...args);
  }
  
  /**
   * Update bookmark metadata
   */
  async updateBookmarkMetadata(...args: Parameters<BookmarkMetadataOperations['updateBookmarkMetadata']>) {
    return this.metadataOps.updateBookmarkMetadata(...args);
  }
  
  /**
   * Remove bookmark metadata
   */
  async removeBookmarkMetadata(...args: Parameters<BookmarkMetadataOperations['removeBookmarkMetadata']>) {
    return this.metadataOps.removeBookmarkMetadata(...args);
  }
}
