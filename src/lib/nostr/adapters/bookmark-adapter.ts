
/**
 * Stub BookmarkAdapter class for backward compatibility
 * This keeps the API surface intact while removing the actual bookmark functionality
 */
import { BaseAdapter } from './base-adapter';
import { BookmarkCollection, BookmarkManagerFacade, BookmarkWithMetadata } from '../bookmark';

export class BookmarkAdapter extends BaseAdapter {
  private bookmarkManagerStub: BookmarkManagerFacade;

  constructor(service: any) {
    super(service);
    this.bookmarkManagerStub = new BookmarkManagerFacade();
  }

  async isBookmarked(eventId: string): Promise<boolean> {
    return false;
  }

  async addBookmark(eventId: string, collectionId?: string, tags?: string[], note?: string): Promise<boolean> {
    return false;
  }

  async removeBookmark(eventId: string): Promise<boolean> {
    return false;
  }

  async getBookmarks(): Promise<string[]> {
    return [];
  }

  async getBookmarkCollections(): Promise<BookmarkCollection[]> {
    return [];
  }

  async getBookmarkMetadata(): Promise<BookmarkWithMetadata[]> {
    return [];
  }

  async createBookmarkCollection(name: string, color?: string, description?: string): Promise<string | null> {
    return null;
  }

  async processPendingOperations(): Promise<void> {
    return;
  }

  get bookmarkManager() {
    return this.bookmarkManagerStub;
  }
}
