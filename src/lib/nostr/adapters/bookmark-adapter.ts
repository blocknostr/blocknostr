
import { BaseAdapter } from './base-adapter';

/**
 * Adapter for bookmark operations
 */
export class BookmarkAdapter extends BaseAdapter {
  // Bookmark methods
  async isBookmarked(eventId: string) {
    return this.service.isBookmarked(eventId);
  }
  
  async addBookmark(eventId: string, collectionId?: string, tags?: string[], note?: string) {
    return this.service.addBookmark(eventId, collectionId, tags, note);
  }
  
  async removeBookmark(eventId: string) {
    return this.service.removeBookmark(eventId);
  }
  
  async getBookmarks() {
    return this.service.getBookmarks();
  }
  
  async getBookmarkCollections() {
    return this.service.getBookmarkCollections();
  }
  
  async getBookmarkMetadata() {
    return this.service.getBookmarkMetadata();
  }
  
  async createBookmarkCollection(name: string, color?: string, description?: string) {
    return this.service.createBookmarkCollection(name, color, description);
  }
  
  async processPendingOperations() {
    return this.service.processPendingOperations();
  }
  
  get bookmarkManager() {
    return this.service.bookmarkManager;
  }
}
