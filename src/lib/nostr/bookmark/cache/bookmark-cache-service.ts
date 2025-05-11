
import localforage from 'localforage';
import { BookmarkCollection, BookmarkWithMetadata } from '../types';

// Initialize storage for different types of bookmark data
const bookmarkStore = localforage.createInstance({
  name: 'bookmarkStore',
  storeName: 'bookmarks'
});

// Types for bookmark operations
export type BookmarkOperationType = 'add' | 'remove';

export interface BookmarkOperation {
  id?: string;
  type: BookmarkOperationType;
  data: {
    eventId: string;
    collectionId?: string;
    tags?: string[];
    note?: string;
  };
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: number;
  attempts?: number;
}

/**
 * Service for caching bookmark data for offline use
 */
export class BookmarkCacheService {
  // Cache the bookmark list
  static async cacheBookmarkList(bookmarks: string[]): Promise<void> {
    await bookmarkStore.setItem('bookmark_list', bookmarks);
  }

  // Get cached bookmark list
  static async getCachedBookmarkList(): Promise<string[]> {
    const bookmarks = await bookmarkStore.getItem<string[]>('bookmark_list');
    return bookmarks || [];
  }

  // Cache bookmark collections
  static async cacheBookmarkCollections(collections: BookmarkCollection[]): Promise<void> {
    await bookmarkStore.setItem('bookmark_collections', collections);
  }

  // Get cached bookmark collections
  static async getCachedBookmarkCollections(): Promise<BookmarkCollection[]> {
    const collections = await bookmarkStore.getItem<BookmarkCollection[]>('bookmark_collections');
    return collections || [];
  }

  // Cache bookmark metadata
  static async cacheBookmarkMetadata(metadata: BookmarkWithMetadata[]): Promise<void> {
    await bookmarkStore.setItem('bookmark_metadata', metadata);
  }

  // Get cached bookmark metadata
  static async getCachedBookmarkMetadata(): Promise<BookmarkWithMetadata[]> {
    const metadata = await bookmarkStore.getItem<BookmarkWithMetadata[]>('bookmark_metadata');
    return metadata || [];
  }

  // Cache individual bookmark status
  static async cacheBookmarkStatus(eventId: string, isBookmarked: boolean): Promise<void> {
    const bookmarkStatuses = await bookmarkStore.getItem<Record<string, boolean>>('bookmark_statuses') || {};
    bookmarkStatuses[eventId] = isBookmarked;
    await bookmarkStore.setItem('bookmark_statuses', bookmarkStatuses);
  }

  // Get cached bookmark status
  static async getCachedBookmarkStatus(eventId: string): Promise<boolean | null> {
    const bookmarkStatuses = await bookmarkStore.getItem<Record<string, boolean>>('bookmark_statuses');
    return bookmarkStatuses?.[eventId] ?? null;
  }

  // Queue an operation to be processed when online
  static async queueOperation(operation: BookmarkOperation): Promise<void> {
    const operations = await bookmarkStore.getItem<BookmarkOperation[]>('pending_operations') || [];
    
    // Generate a unique ID if not provided
    if (!operation.id) {
      operation.id = `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Set initial state
    operation.status = 'pending';
    operation.attempts = 0;
    
    operations.push(operation);
    await bookmarkStore.setItem('pending_operations', operations);
  }

  // Get all pending operations
  static async getPendingOperations(): Promise<BookmarkOperation[]> {
    const operations = await bookmarkStore.getItem<BookmarkOperation[]>('pending_operations') || [];
    return operations.filter(op => op.status !== 'completed');
  }

  // Mark an operation as completed
  static async completeOperation(operationId: string): Promise<void> {
    const operations = await bookmarkStore.getItem<BookmarkOperation[]>('pending_operations') || [];
    const updatedOperations = operations.map(op => {
      if (op.id === operationId) {
        return { ...op, status: 'completed' };
      }
      return op;
    });
    
    await bookmarkStore.setItem('pending_operations', updatedOperations);
  }

  // Update operation status
  static async updateOperationStatus(
    operationId: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed',
    attempts?: number
  ): Promise<void> {
    const operations = await bookmarkStore.getItem<BookmarkOperation[]>('pending_operations') || [];
    const updatedOperations = operations.map(op => {
      if (op.id === operationId) {
        return { 
          ...op, 
          status, 
          attempts: attempts !== undefined ? attempts : op.attempts 
        };
      }
      return op;
    });
    
    await bookmarkStore.setItem('pending_operations', updatedOperations);
  }

  // Clear all bookmark cache (for logout scenarios)
  static async clearCache(): Promise<void> {
    await bookmarkStore.clear();
  }
}
