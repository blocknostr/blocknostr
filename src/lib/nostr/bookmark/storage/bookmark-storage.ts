import { 
  getFromStore, 
  putInStore, 
  getAllFromStore, 
  deleteFromStore,
  clearStore
} from "@/lib/storage/indexedDb";
import { 
  BookmarkCollection, 
  BookmarkWithMetadata, 
  BookmarkStatus, 
  PendingOperation 
} from "../types";

/**
 * Service for storing bookmark data in IndexedDB
 */
export class BookmarkStorage {
  // Store names
  private static readonly BOOKMARKS_STORE = 'bookmarks';
  private static readonly OPERATIONS_STORE = 'pendingOperations';
  
  // Key names
  private static readonly BOOKMARK_LIST_KEY = '_bookmarksList';
  private static readonly COLLECTIONS_KEY = '_collections';
  private static readonly METADATA_KEY = '_metadata';
  
  /**
   * Cache a bookmark status
   */
  static async cacheBookmarkStatus(eventId: string, isBookmarked: boolean): Promise<void> {
    await putInStore(this.BOOKMARKS_STORE, { 
      eventId, 
      isBookmarked, 
      timestamp: Date.now() 
    });
  }
  
  /**
   * Get cached bookmark status
   */
  static async getCachedBookmarkStatus(eventId: string): Promise<boolean | null> {
    const cachedItem = await getFromStore<{eventId: string, isBookmarked: boolean}>(
      this.BOOKMARKS_STORE, 
      eventId
    );
    return cachedItem ? cachedItem.isBookmarked : null;
  }
  
  /**
   * Cache all bookmarks
   */
  static async cacheBookmarkList(eventIds: string[]): Promise<void> {
    const timestamp = Date.now();
    
    // Update the cache for each bookmark
    for (const eventId of eventIds) {
      await putInStore(this.BOOKMARKS_STORE, { 
        eventId, 
        isBookmarked: true, 
        timestamp 
      });
    }
    
    // Also store the full list
    await putInStore(this.BOOKMARKS_STORE, { 
      eventId: this.BOOKMARK_LIST_KEY, 
      list: eventIds, 
      timestamp 
    });
  }
  
  /**
   * Get all cached bookmarks
   */
  static async getCachedBookmarkList(): Promise<string[]> {
    const cachedList = await getFromStore<{list: string[]}>(
      this.BOOKMARKS_STORE, 
      this.BOOKMARK_LIST_KEY
    );
    return cachedList?.list || [];
  }
  
  /**
   * Cache bookmark metadata
   */
  static async cacheBookmarkMetadata(metadata: BookmarkWithMetadata[]): Promise<void> {
    await putInStore(this.BOOKMARKS_STORE, { 
      eventId: this.METADATA_KEY, 
      metadata, 
      timestamp: Date.now() 
    });
  }
  
  /**
   * Get cached bookmark metadata
   */
  static async getCachedBookmarkMetadata(): Promise<BookmarkWithMetadata[]> {
    const cached = await getFromStore<{metadata: BookmarkWithMetadata[]}>(
      this.BOOKMARKS_STORE, 
      this.METADATA_KEY
    );
    return cached?.metadata || [];
  }
  
  /**
   * Cache bookmark collections
   */
  static async cacheBookmarkCollections(collections: BookmarkCollection[]): Promise<void> {
    await putInStore(this.BOOKMARKS_STORE, { 
      eventId: this.COLLECTIONS_KEY, 
      collections, 
      timestamp: Date.now() 
    });
  }
  
  /**
   * Get cached bookmark collections
   */
  static async getCachedBookmarkCollections(): Promise<BookmarkCollection[]> {
    const cached = await getFromStore<{collections: BookmarkCollection[]}>(
      this.BOOKMARKS_STORE, 
      this.COLLECTIONS_KEY
    );
    return cached?.collections || [];
  }
  
  /**
   * Queue a pending operation for sync when online
   */
  static async queueOperation(operation: Omit<PendingOperation, 'id' | 'status' | 'attempts'>): Promise<string> {
    const id = `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const fullOperation: PendingOperation = {
      ...operation,
      id,
      status: 'pending',
      attempts: 0
    };
    
    await putInStore(this.OPERATIONS_STORE, fullOperation);
    return id;
  }
  
  /**
   * Get all pending operations
   */
  static async getPendingOperations(): Promise<PendingOperation[]> {
    const operations = await getAllFromStore<PendingOperation>(this.OPERATIONS_STORE);
    return operations.filter(op => op.status !== 'completed');
  }
  
  /**
   * Mark operation as completed
   */
  static async completeOperation(id: string): Promise<void> {
    await deleteFromStore(this.OPERATIONS_STORE, id);
  }
  
  /**
   * Update operation status
   */
  static async updateOperationStatus(id: string, status: BookmarkStatus, attempts?: number): Promise<void> {
    const operation = await getFromStore<PendingOperation>(this.OPERATIONS_STORE, id);
    
    if (operation) {
      const updatedOperation: PendingOperation = {
        ...operation,
        status,
        attempts: attempts !== undefined ? attempts : operation.attempts
      };
      
      await putInStore(this.OPERATIONS_STORE, updatedOperation);
    }
  }
  
  /**
   * Clear all bookmark data
   */
  static async clearAllBookmarkData(): Promise<void> {
    await clearStore(this.BOOKMARKS_STORE);
    await clearStore(this.OPERATIONS_STORE);
  }
}
