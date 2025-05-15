
import { BookmarkCollection, BookmarkWithMetadata, BookmarkStatus, QueuedOperation } from '../types';

export interface BookmarkStorageInterface {
  getBookmarks(): BookmarkWithMetadata[];
  getBookmarkCollections(): BookmarkCollection[];
  getBookmarkMetadata(eventId: string): BookmarkWithMetadata | null;
  addBookmark(eventId: string, collectionId?: string): void;
  removeBookmark(eventId: string): void;
  addBookmarkCollection(collection: BookmarkCollection): void;
  updateBookmarkCollection(collectionId: string, updates: Partial<BookmarkCollection>): void;
  removeBookmarkCollection(collectionId: string): void;
  updateBookmarkMetadata(eventId: string, updates: Partial<BookmarkWithMetadata>): void;
  getPendingOperations(): QueuedOperation[];
  addPendingOperation(operation: QueuedOperation): void;
  removePendingOperation(operationId: string): void;
  clear(): void;
}

export class BookmarkStorage implements BookmarkStorageInterface {
  private bookmarks: BookmarkWithMetadata[] = [];
  private collections: BookmarkCollection[] = [];
  private pendingOperations: QueuedOperation[] = [];
  private storage: Storage;
  
  private STORAGE_KEYS = {
    BOOKMARKS: 'nostr_bookmarks',
    COLLECTIONS: 'nostr_bookmark_collections',
    OPERATIONS: 'nostr_bookmark_operations'
  };
  
  constructor(storage: Storage = localStorage) {
    this.storage = storage;
    this.loadFromStorage();
  }
  
  private loadFromStorage() {
    try {
      const bookmarksJson = this.storage.getItem(this.STORAGE_KEYS.BOOKMARKS);
      if (bookmarksJson) {
        this.bookmarks = JSON.parse(bookmarksJson);
      }
      
      const collectionsJson = this.storage.getItem(this.STORAGE_KEYS.COLLECTIONS);
      if (collectionsJson) {
        this.collections = JSON.parse(collectionsJson);
      }
      
      const operationsJson = this.storage.getItem(this.STORAGE_KEYS.OPERATIONS);
      if (operationsJson) {
        this.pendingOperations = JSON.parse(operationsJson);
      }
    } catch (error) {
      console.error('Error loading bookmarks from storage:', error);
    }
  }
  
  private saveToStorage() {
    try {
      this.storage.setItem(this.STORAGE_KEYS.BOOKMARKS, JSON.stringify(this.bookmarks));
      this.storage.setItem(this.STORAGE_KEYS.COLLECTIONS, JSON.stringify(this.collections));
      this.storage.setItem(this.STORAGE_KEYS.OPERATIONS, JSON.stringify(this.pendingOperations));
    } catch (error) {
      console.error('Error saving bookmarks to storage:', error);
    }
  }
  
  getBookmarks(): BookmarkWithMetadata[] {
    return [...this.bookmarks];
  }
  
  getBookmarkCollections(): BookmarkCollection[] {
    return [...this.collections];
  }
  
  getBookmarkMetadata(eventId: string): BookmarkWithMetadata | null {
    const bookmark = this.bookmarks.find(b => b.eventId === eventId);
    return bookmark ? { ...bookmark } : null;
  }
  
  addBookmark(eventId: string, collectionId?: string): void {
    const existingBookmark = this.bookmarks.find(b => b.eventId === eventId);
    if (!existingBookmark) {
      const now = Date.now();
      this.bookmarks.push({ 
        eventId, 
        collectionId,
        createdAt: now,
      });
      this.saveToStorage();
    }
  }
  
  removeBookmark(eventId: string): void {
    this.bookmarks = this.bookmarks.filter(b => b.eventId !== eventId);
    this.saveToStorage();
  }
  
  addBookmarkCollection(collection: BookmarkCollection): void {
    this.collections.push(collection);
    this.saveToStorage();
  }
  
  updateBookmarkCollection(collectionId: string, updates: Partial<BookmarkCollection>): void {
    this.collections = this.collections.map(c => {
      if (c.id === collectionId) {
        return { ...c, ...updates };
      }
      return c;
    });
    this.saveToStorage();
  }
  
  removeBookmarkCollection(collectionId: string): void {
    this.collections = this.collections.filter(c => c.id !== collectionId);
    this.saveToStorage();
  }
  
  updateBookmarkMetadata(eventId: string, updates: Partial<BookmarkWithMetadata>): void {
    this.bookmarks = this.bookmarks.map(b => {
      if (b.eventId === eventId) {
        return { ...b, ...updates };
      }
      return b;
    });
    this.saveToStorage();
  }

  getPendingOperations(): QueuedOperation[] {
    return [...this.pendingOperations];
  }
  
  addPendingOperation(operation: QueuedOperation): void {
    this.pendingOperations.push(operation);
    this.saveToStorage();
  }
  
  removePendingOperation(operationId: string): void {
    this.pendingOperations = this.pendingOperations.filter(op => op.id !== operationId);
    this.saveToStorage();
  }
  
  clear(): void {
    this.bookmarks = [];
    this.collections = [];
    this.pendingOperations = [];
    this.storage.removeItem(this.STORAGE_KEYS.BOOKMARKS);
    this.storage.removeItem(this.STORAGE_KEYS.COLLECTIONS);
    this.storage.removeItem(this.STORAGE_KEYS.OPERATIONS);
  }

  // Static utility methods
  static async cacheBookmarkStatus(eventId: string, isBookmarked: boolean): Promise<void> {
    // Implementation for static cache methods
    console.log(`Caching bookmark status: ${eventId} - ${isBookmarked}`);
  }

  static async cacheBookmarkList(bookmarks: string[]): Promise<void> {
    // Implementation for caching bookmark list
    console.log(`Caching ${bookmarks.length} bookmarks`);
  }

  static async cacheBookmarkCollections(collections: any[]): Promise<void> {
    // Implementation for caching collections
    console.log(`Caching ${collections.length} collections`);
  }

  static async cacheBookmarkMetadata(metadata: any[]): Promise<void> {
    // Implementation for caching metadata
    console.log(`Caching metadata for ${metadata.length} bookmarks`);
  }

  static async getPendingOperations(): Promise<QueuedOperation[]> {
    // Implementation for getting pending operations
    return [];
  }
}

export const bookmarkStorage = new BookmarkStorage();
export default BookmarkStorage;
