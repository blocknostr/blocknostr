
/**
 * Service for caching bookmark data to improve performance and
 * enable offline functionality
 */
export class BookmarkCacheService {
  private static readonly STORAGE_KEY_PREFIX = 'nostr_bookmark_cache_';
  
  // Cache a bookmark's status (bookmarked or not)
  static async cacheBookmarkStatus(eventId: string, isBookmarked: boolean): Promise<void> {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}status_${eventId}`;
      localStorage.setItem(key, JSON.stringify({
        value: isBookmarked,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error("Error caching bookmark status:", error);
    }
  }
  
  // Get cached bookmark status
  static async getCachedBookmarkStatus(eventId: string): Promise<boolean | null> {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}status_${eventId}`;
      const cached = localStorage.getItem(key);
      
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      
      // Check if cache is fresh (less than 24 hours old)
      const isFresh = Date.now() - data.timestamp < 24 * 60 * 60 * 1000;
      
      return isFresh ? data.value : null;
    } catch (error) {
      console.error("Error getting cached bookmark status:", error);
      return null;
    }
  }
  
  // Cache bookmark list
  static async cacheBookmarkList(bookmarks: string[]): Promise<void> {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}list`;
      localStorage.setItem(key, JSON.stringify({
        values: bookmarks,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error("Error caching bookmark list:", error);
    }
  }
  
  // Get cached bookmark list
  static async getCachedBookmarkList(): Promise<string[]> {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}list`;
      const cached = localStorage.getItem(key);
      
      if (!cached) return [];
      
      const data = JSON.parse(cached);
      
      // Check if cache is fresh (less than 1 hour old)
      const isFresh = Date.now() - data.timestamp < 60 * 60 * 1000;
      
      return isFresh ? data.values : [];
    } catch (error) {
      console.error("Error getting cached bookmark list:", error);
      return [];
    }
  }
  
  // Cache bookmark collections
  static async cacheBookmarkCollections(collections: any[]): Promise<void> {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}collections`;
      localStorage.setItem(key, JSON.stringify({
        values: collections,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error("Error caching bookmark collections:", error);
    }
  }
  
  // Cache bookmark metadata
  static async cacheBookmarkMetadata(metadata: any[]): Promise<void> {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}metadata`;
      localStorage.setItem(key, JSON.stringify({
        values: metadata,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error("Error caching bookmark metadata:", error);
    }
  }
  
  // Queue operations for offline processing
  static async queueOperation(operation: any): Promise<void> {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}pending_operations`;
      
      // Get existing operations
      const existingJson = localStorage.getItem(key) || '{"operations":[]}';
      const existing = JSON.parse(existingJson);
      
      // Add new operation with ID and timestamp
      const completeOperation = {
        ...operation,
        id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        status: 'pending',
        attempts: 0,
        timestamp: Date.now()
      };
      
      existing.operations.push(completeOperation);
      
      // Save back to storage
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.error("Error queuing bookmark operation:", error);
    }
  }
  
  // Get pending operations
  static async getPendingOperations(): Promise<any[]> {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}pending_operations`;
      const data = localStorage.getItem(key);
      
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      return parsed.operations || [];
    } catch (error) {
      console.error("Error getting pending operations:", error);
      return [];
    }
  }
  
  // Mark operation as completed
  static async completeOperation(operationId: string): Promise<void> {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}pending_operations`;
      const existingJson = localStorage.getItem(key);
      
      if (!existingJson) return;
      
      const existing = JSON.parse(existingJson);
      
      // Filter out the completed operation
      existing.operations = existing.operations.filter(
        (op: any) => op.id !== operationId
      );
      
      // Save back to storage
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.error("Error completing operation:", error);
    }
  }
  
  // Update operation status
  static async updateOperationStatus(
    operationId: string, 
    status: 'pending' | 'processing' | 'failed' | 'completed',
    attempts: number
  ): Promise<void> {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}pending_operations`;
      const existingJson = localStorage.getItem(key);
      
      if (!existingJson) return;
      
      const existing = JSON.parse(existingJson);
      
      // Update the operation status
      existing.operations = existing.operations.map((op: any) => {
        if (op.id === operationId) {
          return { ...op, status, attempts };
        }
        return op;
      });
      
      // Save back to storage
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.error("Error updating operation status:", error);
    }
  }
}

export default BookmarkCacheService;
