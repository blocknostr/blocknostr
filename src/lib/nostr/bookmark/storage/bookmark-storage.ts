import { BookmarkCollection, BookmarkWithMetadata } from '../types';

/**
 * In-memory storage for bookmarks
 * Used as a cache to avoid hitting the relays too often
 */
export class BookmarkStorage {
  private static bookmarkList: string[] = [];
  private static bookmarkCollections: BookmarkCollection[] = [];
  private static bookmarkMetadata: BookmarkWithMetadata[] = [];
  private static bookmarkStatuses: Record<string, boolean> = {}; // Cache bookmark statuses

  /**
   * Cache bookmark list
   */
  static async cacheBookmarkList(bookmarks: string[]): Promise<void> {
    BookmarkStorage.bookmarkList = bookmarks;
  }

  /**
   * Get cached bookmark list
   */
  static async getCachedBookmarkList(): Promise<string[]> {
    return BookmarkStorage.bookmarkList;
  }

  /**
   * Cache bookmark collections
   */
  static async cacheBookmarkCollections(collections: BookmarkCollection[]): Promise<void> {
    BookmarkStorage.bookmarkCollections = collections;
  }

  /**
   * Get cached bookmark collections
   */
  static async getCachedBookmarkCollections(): Promise<BookmarkCollection[]> {
    return BookmarkStorage.bookmarkCollections;
  }

  /**
   * Cache bookmark metadata
   */
  static async cacheBookmarkMetadata(metadata: BookmarkWithMetadata[]): Promise<void> {
    BookmarkStorage.bookmarkMetadata = metadata;
  }

  /**
   * Get cached bookmark metadata
   */
  static async getCachedBookmarkMetadata(): Promise<BookmarkWithMetadata[]> {
    return BookmarkStorage.bookmarkMetadata;
  }

  /**
   * Cache bookmark status
   */
  static async cacheBookmarkStatus(eventId: string, isBookmarked: boolean): Promise<void> {
    BookmarkStorage.bookmarkStatuses[eventId] = isBookmarked;
  }

  /**
   * Get cached bookmark status
   */
  static async getCachedBookmarkStatus(eventId: string): Promise<boolean | null> {
    if (BookmarkStorage.bookmarkStatuses.hasOwnProperty(eventId)) {
      return BookmarkStorage.bookmarkStatuses[eventId];
    }
    return null; // Not in cache
  }

  /**
   * Clear all cached data
   */
  static async clearCache(): Promise<void> {
    BookmarkStorage.bookmarkList = [];
    BookmarkStorage.bookmarkCollections = [];
    BookmarkStorage.bookmarkMetadata = [];
    BookmarkStorage.bookmarkStatuses = {};
  }
}

/**
 * Manages operations queue in local storage
 */
export class OperationQueue {
  private static readonly STORAGE_KEY = 'nostr_bookmark_queue';

  /**
   * Add operation to the queue
   */
  static async enqueueOperation(operation: any): Promise<void> {
    const queue = await OperationQueue.getQueue();
    queue.push(operation);
    localStorage.setItem(OperationQueue.STORAGE_KEY, JSON.stringify(queue));
  }

  /**
   * Get the queue from local storage
   */
  private static async getQueue(): Promise<any[]> {
    const storedQueue = localStorage.getItem(OperationQueue.STORAGE_KEY);
    return storedQueue ? JSON.parse(storedQueue) : [];
  }

  /**
   * Dequeue an operation
   */
  static async dequeueOperation(): Promise<any | null> {
    const queue = await OperationQueue.getQueue();
    if (queue.length === 0) {
      return null;
    }
    const operation = queue.shift();
    localStorage.setItem(OperationQueue.STORAGE_KEY, JSON.stringify(queue));
    return operation;
  }

  /**
   * Clear the queue
   */
  static async clearQueue(): Promise<void> {
    localStorage.removeItem(OperationQueue.STORAGE_KEY);
  }
}

/**
 * Manages operation statuses in local storage
 */
export class OperationStatus {
  private static readonly STORAGE_PREFIX = 'nostr_bookmark_status_';

  /**
   * Cache operation status
   */
  static async cacheOperationStatus(id: string, status: 'pending' | 'processing' | 'failed' | 'completed'): Promise<void> {
    localStorage.setItem(OperationStatus.STORAGE_PREFIX + id, status);
  }

  /**
   * Get cached operation status
   */
  static async getCachedOperationStatus(id: string): Promise<string | null> {
    return localStorage.getItem(OperationStatus.STORAGE_PREFIX + id);
  }

  /**
   * Remove cached operation status
   */
  static async removeCachedOperationStatus(id: string): Promise<void> {
    localStorage.removeItem(OperationStatus.STORAGE_PREFIX + id);
  }
}
