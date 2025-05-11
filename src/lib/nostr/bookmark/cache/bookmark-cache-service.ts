
import { BookmarkWithMetadata, BookmarkCollection, QueuedOperation, BookmarkStatus } from '../types';

/**
 * Service for caching bookmark data in the browser for offline support and performance
 */
export class BookmarkCacheService {
  private static STORAGE_KEYS = {
    BOOKMARKS_LIST: 'nostr_bookmarks_list',
    BOOKMARK_STATUSES: 'nostr_bookmark_statuses',
    BOOKMARK_COLLECTIONS: 'nostr_bookmark_collections',
    BOOKMARK_METADATA: 'nostr_bookmark_metadata',
    PENDING_OPERATIONS: 'nostr_pending_bookmarks'
  };

  /**
   * Cache a list of bookmarked event IDs
   */
  static async cacheBookmarkList(bookmarks: string[]): Promise<void> {
    try {
      localStorage.setItem(
        this.STORAGE_KEYS.BOOKMARKS_LIST, 
        JSON.stringify(bookmarks)
      );
    } catch (error) {
      console.error('Error caching bookmark list:', error);
    }
  }

  /**
   * Get cached bookmark list
   */
  static async getCachedBookmarkList(): Promise<string[]> {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEYS.BOOKMARKS_LIST);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting cached bookmark list:', error);
      return [];
    }
  }

  /**
   * Cache bookmark status for a specific event
   */
  static async cacheBookmarkStatus(eventId: string, isBookmarked: boolean): Promise<void> {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEYS.BOOKMARK_STATUSES);
      const statuses: Record<string, boolean> = cached ? JSON.parse(cached) : {};
      
      statuses[eventId] = isBookmarked;
      
      localStorage.setItem(
        this.STORAGE_KEYS.BOOKMARK_STATUSES, 
        JSON.stringify(statuses)
      );
    } catch (error) {
      console.error(`Error caching bookmark status for ${eventId}:`, error);
    }
  }

  /**
   * Get cached bookmark status for a specific event
   */
  static async getCachedBookmarkStatus(eventId: string): Promise<boolean | null> {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEYS.BOOKMARK_STATUSES);
      if (!cached) return null;
      
      const statuses: Record<string, boolean> = JSON.parse(cached);
      return eventId in statuses ? statuses[eventId] : null;
    } catch (error) {
      console.error(`Error getting cached bookmark status for ${eventId}:`, error);
      return null;
    }
  }

  /**
   * Cache bookmark collections
   */
  static async cacheBookmarkCollections(collections: BookmarkCollection[]): Promise<void> {
    try {
      localStorage.setItem(
        this.STORAGE_KEYS.BOOKMARK_COLLECTIONS, 
        JSON.stringify(collections)
      );
    } catch (error) {
      console.error('Error caching bookmark collections:', error);
    }
  }

  /**
   * Get cached bookmark collections
   */
  static async getCachedBookmarkCollections(): Promise<BookmarkCollection[]> {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEYS.BOOKMARK_COLLECTIONS);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting cached bookmark collections:', error);
      return [];
    }
  }

  /**
   * Cache bookmark metadata
   */
  static async cacheBookmarkMetadata(metadata: BookmarkWithMetadata[]): Promise<void> {
    try {
      localStorage.setItem(
        this.STORAGE_KEYS.BOOKMARK_METADATA, 
        JSON.stringify(metadata)
      );
    } catch (error) {
      console.error('Error caching bookmark metadata:', error);
    }
  }

  /**
   * Get cached bookmark metadata
   */
  static async getCachedBookmarkMetadata(): Promise<BookmarkWithMetadata[]> {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEYS.BOOKMARK_METADATA);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting cached bookmark metadata:', error);
      return [];
    }
  }

  /**
   * Queue a bookmark operation for later processing (when online)
   */
  static async queueOperation(operation: Partial<QueuedOperation>): Promise<void> {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEYS.PENDING_OPERATIONS);
      const operations: QueuedOperation[] = cached ? JSON.parse(cached) : [];
      
      // Create a complete operation object
      const completeOperation: QueuedOperation = {
        id: operation.id || `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: operation.type!,
        data: operation.data || {},
        status: operation.status || 'pending',
        retryCount: operation.retryCount || 0,
        timestamp: operation.timestamp || Date.now()
      };
      
      // Add to queue
      operations.push(completeOperation);
      
      localStorage.setItem(
        this.STORAGE_KEYS.PENDING_OPERATIONS, 
        JSON.stringify(operations)
      );
    } catch (error) {
      console.error('Error queuing bookmark operation:', error);
    }
  }

  /**
   * Get all pending operations
   */
  static async getPendingOperations(): Promise<QueuedOperation[]> {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEYS.PENDING_OPERATIONS);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting pending bookmark operations:', error);
      return [];
    }
  }

  /**
   * Mark an operation as complete and remove from queue
   */
  static async completeOperation(operationId: string): Promise<void> {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEYS.PENDING_OPERATIONS);
      if (!cached) return;
      
      const operations: QueuedOperation[] = JSON.parse(cached);
      const updatedOperations = operations.filter(op => op.id !== operationId);
      
      localStorage.setItem(
        this.STORAGE_KEYS.PENDING_OPERATIONS, 
        JSON.stringify(updatedOperations)
      );
    } catch (error) {
      console.error(`Error completing operation ${operationId}:`, error);
    }
  }

  /**
   * Update operation status
   */
  static async updateOperationStatus(
    operationId: string, 
    status: 'pending' | 'processing' | 'failed' | 'completed',
    retryCount?: number
  ): Promise<void> {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEYS.PENDING_OPERATIONS);
      if (!cached) return;
      
      const operations: QueuedOperation[] = JSON.parse(cached);
      const updatedOperations = operations.map(op => {
        if (op.id === operationId) {
          return {
            ...op, 
            status,
            retryCount: retryCount !== undefined ? retryCount : op.retryCount
          };
        }
        return op;
      });
      
      localStorage.setItem(
        this.STORAGE_KEYS.PENDING_OPERATIONS, 
        JSON.stringify(updatedOperations)
      );
    } catch (error) {
      console.error(`Error updating operation status ${operationId}:`, error);
    }
  }

  /**
   * Clear all bookmark cache data
   */
  static async clearAllCache(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.BOOKMARKS_LIST);
      localStorage.removeItem(this.STORAGE_KEYS.BOOKMARK_STATUSES);
      localStorage.removeItem(this.STORAGE_KEYS.BOOKMARK_COLLECTIONS);
      localStorage.removeItem(this.STORAGE_KEYS.BOOKMARK_METADATA);
      localStorage.removeItem(this.STORAGE_KEYS.PENDING_OPERATIONS);
    } catch (error) {
      console.error('Error clearing bookmark cache:', error);
    }
  }
}

export default BookmarkCacheService;
