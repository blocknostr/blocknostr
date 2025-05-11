
import { BookmarkWithMetadata, BookmarkCollection } from '../types';

// Interface for pending operations
interface PendingOperation {
  id?: string;
  type: string;
  data: any;
  timestamp: number;
  status?: string;
  attempts?: number;
}

/**
 * Service to handle bookmark caching operations
 */
export class BookmarkCacheService {
  private static BOOKMARK_STATUS_PREFIX = 'bookmark_status_';
  private static BOOKMARK_LIST_KEY = 'bookmark_list';
  private static BOOKMARK_COLLECTIONS_KEY = 'bookmark_collections';
  private static BOOKMARK_METADATA_KEY = 'bookmark_metadata';
  private static PENDING_OPERATIONS_KEY = 'bookmark_pending_operations';

  /**
   * Cache the bookmark status for a specific event
   */
  static async cacheBookmarkStatus(eventId: string, isBookmarked: boolean): Promise<void> {
    try {
      localStorage.setItem(
        `${this.BOOKMARK_STATUS_PREFIX}${eventId}`, 
        JSON.stringify({
          isBookmarked,
          timestamp: Date.now()
        })
      );
    } catch (error) {
      console.error("Error caching bookmark status:", error);
    }
  }
  
  /**
   * Get the cached bookmark status for an event
   */
  static async getCachedBookmarkStatus(eventId: string): Promise<boolean | null> {
    try {
      const cachedData = localStorage.getItem(`${this.BOOKMARK_STATUS_PREFIX}${eventId}`);
      if (!cachedData) return null;
      
      const data = JSON.parse(cachedData);
      
      // Check if cache is still valid (24 hours)
      const now = Date.now();
      const cacheAge = now - data.timestamp;
      if (cacheAge > 24 * 60 * 60 * 1000) {
        // Cache expired
        localStorage.removeItem(`${this.BOOKMARK_STATUS_PREFIX}${eventId}`);
        return null;
      }
      
      return data.isBookmarked;
    } catch (error) {
      console.error("Error getting cached bookmark status:", error);
      return null;
    }
  }
  
  /**
   * Cache the list of bookmarked event IDs
   */
  static async cacheBookmarkList(bookmarkIds: string[]): Promise<void> {
    try {
      localStorage.setItem(
        this.BOOKMARK_LIST_KEY, 
        JSON.stringify({
          bookmarkIds,
          timestamp: Date.now()
        })
      );
    } catch (error) {
      console.error("Error caching bookmark list:", error);
    }
  }
  
  /**
   * Get the cached list of bookmarked event IDs
   */
  static async getCachedBookmarkList(): Promise<string[]> {
    try {
      const cachedData = localStorage.getItem(this.BOOKMARK_LIST_KEY);
      if (!cachedData) return [];
      
      const data = JSON.parse(cachedData);
      
      // Check if cache is still valid (1 hour)
      const now = Date.now();
      const cacheAge = now - data.timestamp;
      if (cacheAge > 60 * 60 * 1000) {
        return [];
      }
      
      return data.bookmarkIds || [];
    } catch (error) {
      console.error("Error getting cached bookmark list:", error);
      return [];
    }
  }
  
  /**
   * Cache bookmark collections
   */
  static async cacheBookmarkCollections(collections: BookmarkCollection[]): Promise<void> {
    try {
      localStorage.setItem(
        this.BOOKMARK_COLLECTIONS_KEY, 
        JSON.stringify({
          collections,
          timestamp: Date.now()
        })
      );
    } catch (error) {
      console.error("Error caching bookmark collections:", error);
    }
  }
  
  /**
   * Get cached bookmark collections
   */
  static async getCachedBookmarkCollections(): Promise<BookmarkCollection[]> {
    try {
      const cachedData = localStorage.getItem(this.BOOKMARK_COLLECTIONS_KEY);
      if (!cachedData) return [];
      
      const data = JSON.parse(cachedData);
      return data.collections || [];
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
      localStorage.setItem(
        this.BOOKMARK_METADATA_KEY, 
        JSON.stringify({
          metadata,
          timestamp: Date.now()
        })
      );
    } catch (error) {
      console.error("Error caching bookmark metadata:", error);
    }
  }
  
  /**
   * Get cached bookmark metadata
   */
  static async getCachedBookmarkMetadata(): Promise<BookmarkWithMetadata[]> {
    try {
      const cachedData = localStorage.getItem(this.BOOKMARK_METADATA_KEY);
      if (!cachedData) return [];
      
      const data = JSON.parse(cachedData);
      return data.metadata || [];
    } catch (error) {
      console.error("Error getting cached bookmark metadata:", error);
      return [];
    }
  }
  
  /**
   * Queue an operation for later execution
   */
  static async queueOperation(operation: PendingOperation): Promise<void> {
    try {
      const pendingOps = await this.getPendingOperations();
      
      // Create a complete operation object
      const completeOperation = {
        id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: operation.type,
        data: operation.data,
        timestamp: operation.timestamp || Date.now(),
        status: 'pending',
        attempts: 0
      };
      
      pendingOps.push(completeOperation);
      
      localStorage.setItem(
        this.PENDING_OPERATIONS_KEY, 
        JSON.stringify(pendingOps)
      );
    } catch (error) {
      console.error("Error queueing operation:", error);
    }
  }
  
  /**
   * Get all pending operations
   */
  static async getPendingOperations(): Promise<PendingOperation[]> {
    try {
      const data = localStorage.getItem(this.PENDING_OPERATIONS_KEY);
      if (!data) return [];
      
      return JSON.parse(data);
    } catch (error) {
      console.error("Error getting pending operations:", error);
      return [];
    }
  }
  
  /**
   * Mark an operation as completed
   */
  static async completeOperation(operationId: string): Promise<void> {
    try {
      const pendingOps = await this.getPendingOperations();
      const updatedOps = pendingOps.filter(op => op.id !== operationId);
      
      localStorage.setItem(
        this.PENDING_OPERATIONS_KEY, 
        JSON.stringify(updatedOps)
      );
    } catch (error) {
      console.error("Error completing operation:", error);
    }
  }
  
  /**
   * Update operation status
   */
  static async updateOperationStatus(
    operationId: string, 
    status: string, 
    attempts: number
  ): Promise<void> {
    try {
      const pendingOps = await this.getPendingOperations();
      
      const updatedOps = pendingOps.map(op => {
        if (op.id === operationId) {
          return {
            ...op,
            status,
            attempts
          };
        }
        return op;
      });
      
      localStorage.setItem(
        this.PENDING_OPERATIONS_KEY, 
        JSON.stringify(updatedOps)
      );
    } catch (error) {
      console.error("Error updating operation status:", error);
    }
  }
}
