
import { BookmarkWithMetadata, BookmarkCollection } from '../types';

/**
 * Service for caching bookmark data
 */
export class BookmarkCacheService {
  private static readonly BOOKMARK_STATUS_KEY = 'nostr_bookmark_status';
  private static readonly BOOKMARK_LIST_KEY = 'nostr_bookmark_list';
  private static readonly BOOKMARK_METADATA_KEY = 'nostr_bookmark_metadata';
  private static readonly BOOKMARK_COLLECTIONS_KEY = 'nostr_bookmark_collections';
  private static readonly PENDING_OPERATIONS_KEY = 'nostr_pending_bookmarks';
  
  /**
   * Cache bookmark status
   */
  static async cacheBookmarkStatus(eventId: string, isBookmarked: boolean): Promise<void> {
    try {
      const cache = await this.getBookmarkStatusCache();
      cache[eventId] = {
        isBookmarked,
        timestamp: Date.now()
      };
      localStorage.setItem(this.BOOKMARK_STATUS_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching bookmark status:', error);
    }
  }
  
  /**
   * Get cached bookmark status
   */
  static async getCachedBookmarkStatus(eventId: string): Promise<boolean | null> {
    try {
      const cache = await this.getBookmarkStatusCache();
      const status = cache[eventId];
      
      if (!status) {
        return null;
      }
      
      // Only return cached value if it's not too old (24 hours)
      const isExpired = Date.now() - status.timestamp > 24 * 60 * 60 * 1000;
      return isExpired ? null : status.isBookmarked;
    } catch (error) {
      console.error('Error getting cached bookmark status:', error);
      return null;
    }
  }
  
  /**
   * Cache bookmark list
   */
  static async cacheBookmarkList(bookmarks: string[]): Promise<void> {
    try {
      localStorage.setItem(this.BOOKMARK_LIST_KEY, JSON.stringify({
        bookmarks,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error caching bookmark list:', error);
    }
  }
  
  /**
   * Get cached bookmark list
   */
  static async getCachedBookmarkList(): Promise<string[]> {
    try {
      const cacheStr = localStorage.getItem(this.BOOKMARK_LIST_KEY);
      if (!cacheStr) {
        return [];
      }
      
      const cache = JSON.parse(cacheStr);
      
      // Only return cached value if it's not too old (1 hour)
      const isExpired = Date.now() - cache.timestamp > 60 * 60 * 1000;
      return isExpired ? [] : cache.bookmarks;
    } catch (error) {
      console.error('Error getting cached bookmark list:', error);
      return [];
    }
  }
  
  /**
   * Cache bookmark metadata
   */
  static async cacheBookmarkMetadata(metadata: BookmarkWithMetadata[]): Promise<void> {
    try {
      localStorage.setItem(this.BOOKMARK_METADATA_KEY, JSON.stringify({
        metadata,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error caching bookmark metadata:', error);
    }
  }
  
  /**
   * Cache bookmark collections
   */
  static async cacheBookmarkCollections(collections: BookmarkCollection[]): Promise<void> {
    try {
      localStorage.setItem(this.BOOKMARK_COLLECTIONS_KEY, JSON.stringify({
        collections,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error caching bookmark collections:', error);
    }
  }
  
  /**
   * Queue an operation for later
   */
  static async queueOperation(operation: {
    type: 'add' | 'remove' | 'update' | 'addCollection' | 'updateCollection' | 'deleteCollection';
    data: any;
    timestamp: number;
  }): Promise<void> {
    try {
      const operations = await this.getPendingOperations();
      operations.push({
        id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        status: 'pending',
        retryCount: 0,
        ...operation
      });
      
      localStorage.setItem(this.PENDING_OPERATIONS_KEY, JSON.stringify(operations));
    } catch (error) {
      console.error('Error queuing operation:', error);
    }
  }
  
  /**
   * Get pending operations
   */
  static async getPendingOperations(): Promise<any[]> {
    try {
      const operationsStr = localStorage.getItem(this.PENDING_OPERATIONS_KEY);
      return operationsStr ? JSON.parse(operationsStr) : [];
    } catch (error) {
      console.error('Error getting pending operations:', error);
      return [];
    }
  }
  
  /**
   * Complete an operation
   */
  static async completeOperation(operationId: string): Promise<void> {
    try {
      const operations = await this.getPendingOperations();
      const updatedOperations = operations.filter(op => op.id !== operationId);
      localStorage.setItem(this.PENDING_OPERATIONS_KEY, JSON.stringify(updatedOperations));
    } catch (error) {
      console.error('Error completing operation:', error);
    }
  }
  
  /**
   * Update operation status
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
      console.error('Error updating operation status:', error);
    }
  }
  
  // Helper methods
  private static async getBookmarkStatusCache(): Promise<Record<string, { isBookmarked: boolean, timestamp: number }>> {
    try {
      const cacheStr = localStorage.getItem(this.BOOKMARK_STATUS_KEY);
      return cacheStr ? JSON.parse(cacheStr) : {};
    } catch (error) {
      console.error('Error getting bookmark status cache:', error);
      return {};
    }
  }
}
