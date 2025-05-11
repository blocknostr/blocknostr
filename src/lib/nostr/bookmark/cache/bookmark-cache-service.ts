
import { BookmarkWithMetadata, BookmarkCollection } from "../types";
import { 
  getFromStore, 
  putInStore, 
  getAllFromStore, 
  deleteFromStore 
} from "@/lib/storage/indexedDb";

/**
 * Cache service for bookmark operations
 */
export class BookmarkCacheService {
  /**
   * Cache a bookmark by event ID
   */
  static async cacheBookmarkStatus(eventId: string, isBookmarked: boolean): Promise<void> {
    await putInStore('bookmarks', { eventId, isBookmarked, timestamp: Date.now() });
  }
  
  /**
   * Get cached bookmark status
   */
  static async getCachedBookmarkStatus(eventId: string): Promise<boolean | null> {
    const cachedItem = await getFromStore<{eventId: string, isBookmarked: boolean}>('bookmarks', eventId);
    return cachedItem ? cachedItem.isBookmarked : null;
  }
  
  /**
   * Cache all bookmarks
   */
  static async cacheBookmarkList(eventIds: string[]): Promise<void> {
    const timestamp = Date.now();
    
    // Update the cache for each bookmark
    for (const eventId of eventIds) {
      await putInStore('bookmarks', { eventId, isBookmarked: true, timestamp });
    }
    
    // Also store a special entry with the full list
    await putInStore('bookmarks', { eventId: '_bookmarksList', list: eventIds, timestamp });
  }
  
  /**
   * Get all cached bookmarks
   */
  static async getCachedBookmarkList(): Promise<string[]> {
    const cachedList = await getFromStore<{list: string[]}>('bookmarks', '_bookmarksList');
    return cachedList?.list || [];
  }
  
  /**
   * Cache bookmark metadata
   */
  static async cacheBookmarkMetadata(metadata: BookmarkWithMetadata[]): Promise<void> {
    await putInStore('bookmarks', { eventId: '_metadata', metadata, timestamp: Date.now() });
  }
  
  /**
   * Get cached bookmark metadata
   */
  static async getCachedBookmarkMetadata(): Promise<BookmarkWithMetadata[]> {
    const cached = await getFromStore<{metadata: BookmarkWithMetadata[]}>('bookmarks', '_metadata');
    return cached?.metadata || [];
  }
  
  /**
   * Cache bookmark collections
   */
  static async cacheBookmarkCollections(collections: BookmarkCollection[]): Promise<void> {
    await putInStore('bookmarks', { eventId: '_collections', collections, timestamp: Date.now() });
  }
  
  /**
   * Get cached bookmark collections
   */
  static async getCachedBookmarkCollections(): Promise<BookmarkCollection[]> {
    const cached = await getFromStore<{collections: BookmarkCollection[]}>('bookmarks', '_collections');
    return cached?.collections || [];
  }
  
  /**
   * Queue a pending operation for sync when online
   */
  static async queueOperation(operation: {
    type: 'add' | 'remove' | 'addCollection',
    data: any,
    timestamp: number
  }): Promise<void> {
    await putInStore('pendingOperations', {
      ...operation,
      status: 'pending',
      attempts: 0
    });
  }
  
  /**
   * Get all pending operations
   */
  static async getPendingOperations(): Promise<any[]> {
    return getAllFromStore<any>('pendingOperations');
  }
  
  /**
   * Mark operation as completed
   */
  static async completeOperation(id: number): Promise<void> {
    await deleteFromStore('pendingOperations', id.toString());
  }
  
  /**
   * Update operation status
   */
  static async updateOperationStatus(id: number, status: string, attempts: number): Promise<void> {
    const operation = await getFromStore<any>('pendingOperations', id.toString());
    if (operation) {
      operation.status = status;
      operation.attempts = attempts;
      await putInStore('pendingOperations', operation);
    }
  }
}
