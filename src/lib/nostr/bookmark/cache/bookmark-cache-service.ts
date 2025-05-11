
import { QueuedOperation, BookmarkOperationType, BookmarkCollection, BookmarkWithMetadata } from '../types';

/**
 * Service for caching bookmark data and operations
 * Provides local storage caching for offline support
 */
export class BookmarkCacheService {
  // Local storage keys
  private static readonly BOOKMARK_LIST_KEY = 'nostr_bookmark_list';
  private static readonly BOOKMARK_STATUS_PREFIX = 'nostr_bookmark_status_';
  private static readonly BOOKMARK_COLLECTIONS_KEY = 'nostr_bookmark_collections';
  private static readonly BOOKMARK_METADATA_KEY = 'nostr_bookmark_metadata';
  private static readonly PENDING_OPERATIONS_KEY = 'nostr_pending_bookmarks';

  /**
   * Cache a list of bookmarked event IDs
   */
  static async cacheBookmarkList(bookmarks: string[]): Promise<void> {
    try {
      localStorage.setItem(this.BOOKMARK_LIST_KEY, JSON.stringify(bookmarks));
    } catch (error) {
      console.error("Error caching bookmark list:", error);
    }
  }

  /**
   * Get cached bookmark list
   */
  static async getCachedBookmarkList(): Promise<string[]> {
    try {
      const cached = localStorage.getItem(this.BOOKMARK_LIST_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error("Error getting cached bookmark list:", error);
      return [];
    }
  }

  /**
   * Cache bookmark status for a specific event
   */
  static async cacheBookmarkStatus(eventId: string, isBookmarked: boolean): Promise<void> {
    try {
      localStorage.setItem(
        `${this.BOOKMARK_STATUS_PREFIX}${eventId}`, 
        JSON.stringify({ isBookmarked, timestamp: Date.now() })
      );
    } catch (error) {
      console.error(`Error caching bookmark status for ${eventId}:`, error);
    }
  }

  /**
   * Get cached bookmark status for event
   * @returns boolean | null (null means not in cache)
   */
  static async getCachedBookmarkStatus(eventId: string): Promise<boolean | null> {
    try {
      const cached = localStorage.getItem(`${this.BOOKMARK_STATUS_PREFIX}${eventId}`);
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      // Check if cache is fresh enough (24 hours)
      const isFresh = (Date.now() - data.timestamp) < 24 * 60 * 60 * 1000;
      return isFresh ? data.isBookmarked : null;
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
      localStorage.setItem(this.BOOKMARK_COLLECTIONS_KEY, JSON.stringify(collections));
    } catch (error) {
      console.error("Error caching bookmark collections:", error);
    }
  }

  /**
   * Get cached bookmark collections
   */
  static async getCachedBookmarkCollections(): Promise<BookmarkCollection[]> {
    try {
      const cached = localStorage.getItem(this.BOOKMARK_COLLECTIONS_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error("Error getting cached bookmark collections:", error);
      return [];
    }
  }

  /**
   * Cache bookmark metadata
   */
  static async cacheBookmarkMetadata(metadata: BookmarkWithMetadata[]): Promise<void> {
    try {
      localStorage.setItem(this.BOOKMARK_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error("Error caching bookmark metadata:", error);
    }
  }

  /**
   * Get cached bookmark metadata
   */
  static async getCachedBookmarkMetadata(): Promise<BookmarkWithMetadata[]> {
    try {
      const cached = localStorage.getItem(this.BOOKMARK_METADATA_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error("Error getting cached bookmark metadata:", error);
      return [];
    }
  }

  /**
   * Queue an operation for later processing
   */
  static async queueOperation(operation: { 
    type: BookmarkOperationType; 
    data: any; 
    timestamp: number 
  }): Promise<void> {
    try {
      const operations = await this.getPendingOperations();
      
      const newOperation: QueuedOperation = {
        id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: operation.type,
        data: operation.data,
        status: 'pending',
        retryCount: 0,
        timestamp: operation.timestamp || Date.now()
      };
      
      operations.push(newOperation);
      localStorage.setItem(this.PENDING_OPERATIONS_KEY, JSON.stringify(operations));
    } catch (error) {
      console.error("Error queueing operation:", error);
    }
  }

  /**
   * Get all pending operations
   */
  static async getPendingOperations(): Promise<QueuedOperation[]> {
    try {
      const cached = localStorage.getItem(this.PENDING_OPERATIONS_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error("Error getting pending operations:", error);
      return [];
    }
  }

  /**
   * Mark an operation as completed and remove it from queue
   */
  static async completeOperation(operationId: string): Promise<void> {
    try {
      const operations = await this.getPendingOperations();
      const filteredOperations = operations.filter(op => op.id !== operationId);
      localStorage.setItem(this.PENDING_OPERATIONS_KEY, JSON.stringify(filteredOperations));
    } catch (error) {
      console.error("Error completing operation:", error);
    }
  }

  /**
   * Update operation status (e.g., mark as failed)
   */
  static async updateOperationStatus(
    operationId: string, 
    status: 'pending' | 'processing' | 'failed' | 'completed',
    retryCount: number
  ): Promise<void> {
    try {
      const operations = await this.getPendingOperations();
      const updatedOperations = operations.map(op => {
        if (op.id === operationId) {
          return { ...op, status, retryCount };
        }
        return op;
      });
      
      localStorage.setItem(this.PENDING_OPERATIONS_KEY, JSON.stringify(updatedOperations));
    } catch (error) {
      console.error("Error updating operation status:", error);
    }
  }

  /**
   * Clear all cached data (useful for logout)
   */
  static async clearAllCache(): Promise<void> {
    try {
      localStorage.removeItem(this.BOOKMARK_LIST_KEY);
      localStorage.removeItem(this.BOOKMARK_COLLECTIONS_KEY);
      localStorage.removeItem(this.BOOKMARK_METADATA_KEY);
      localStorage.removeItem(this.PENDING_OPERATIONS_KEY);
      
      // Remove all individual bookmark status items
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.BOOKMARK_STATUS_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error("Error clearing bookmark cache:", error);
    }
  }
}

// Export singleton instance
export default BookmarkCacheService;
