
import { SimplePool } from 'nostr-tools';
import { BookmarkManagerFacade } from '../../bookmark';
import { BookmarkCoreService } from './bookmark-core-service';
import { retry } from '@/lib/utils/retry';
import { BookmarkCacheService } from '../../bookmark/cache/bookmark-cache-service';

/**
 * Enhanced service handling core bookmark operations with:
 * - Retry mechanism
 * - Offline support
 * - Improved validation
 */
export class BookmarkOperationsService extends BookmarkCoreService {
  constructor(
    bookmarkManager: BookmarkManagerFacade,
    pool: SimplePool,
    publicKey: string | null,
    getConnectedRelayUrls: () => string[]
  ) {
    super(bookmarkManager, pool, publicKey, getConnectedRelayUrls);
  }

  /**
   * Add a bookmark for an event with retry logic and validation
   */
  async addBookmark(
    eventId: string, 
    collectionId?: string,
    tags?: string[],
    note?: string
  ): Promise<boolean> {
    if (!this.publicKey) {
      console.error("Cannot add bookmark: No public key (user not logged in)");
      return false;
    }
    
    // Validate the eventId
    if (!eventId || typeof eventId !== 'string' || eventId.length < 8) {
      console.error("Cannot add bookmark: Invalid event ID", eventId);
      throw new Error("Invalid event ID format");
    }
    
    // Validate the collectionId if provided
    if (collectionId && (typeof collectionId !== 'string' || collectionId.length < 3)) {
      console.error("Cannot add bookmark: Invalid collection ID", collectionId);
      throw new Error("Invalid collection ID format");
    }
    
    // Validate tags if provided
    if (tags && (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string'))) {
      console.error("Cannot add bookmark: Invalid tags format", tags);
      throw new Error("Tags must be an array of strings");
    }
    
    try {
      // Cache the bookmark status optimistically
      await BookmarkCacheService.cacheBookmarkStatus(eventId, true);
      
      // Check if we're offline
      if (!navigator.onLine) {
        console.log("Device is offline, queueing bookmark operation for later");
        await BookmarkCacheService.queueOperation({
          type: 'add',
          data: { eventId, collectionId, tags, note },
          timestamp: Date.now()
        });
        return true; // Return true for optimistic UI update
      }
      
      // Ensure relays are connected
      const connectedRelays = await this.ensureConnectedRelays();
      console.log(`Adding bookmark using ${connectedRelays.length} relays:`, connectedRelays);
      
      // Use retry mechanism for the operation
      const result = await retry(
        async () => this.bookmarkManager.addBookmark(
          this.pool,
          this.publicKey, 
          undefined, // Let NostrService handle signing using the extension
          eventId,
          connectedRelays,
          collectionId, 
          tags, 
          note
        ),
        {
          maxAttempts: 3,
          onRetry: (attempt, error) => {
            console.log(`Retry attempt ${attempt} for add bookmark:`, error);
          }
        }
      );
      
      if (!result) {
        console.error("Bookmark operation failed but didn't throw an error");
      }
      
      return !!result;
    } catch (error) {
      console.error("Error in BookmarkService.addBookmark:", error);
      
      // If operation failed, update the cache to reflect the failure
      await BookmarkCacheService.cacheBookmarkStatus(eventId, false);
      
      throw error; // Re-throw to allow UI layer to handle the specific error
    }
  }
  
  /**
   * Remove a bookmark with improved robustness
   */
  async removeBookmark(eventId: string): Promise<boolean> {
    if (!this.publicKey) {
      console.error("Cannot remove bookmark: No public key (user not logged in)");
      return false;
    }
    
    // Validate the eventId
    if (!eventId || typeof eventId !== 'string' || eventId.length < 8) {
      console.error("Cannot remove bookmark: Invalid event ID", eventId);
      throw new Error("Invalid event ID format");
    }
    
    try {
      // Cache the bookmark status optimistically
      await BookmarkCacheService.cacheBookmarkStatus(eventId, false);
      
      // Check if we're offline
      if (!navigator.onLine) {
        console.log("Device is offline, queueing bookmark removal for later");
        await BookmarkCacheService.queueOperation({
          type: 'remove',
          data: { eventId },
          timestamp: Date.now()
        });
        return true; // Return true for optimistic UI update
      }
      
      // Ensure relays are connected
      const connectedRelays = await this.ensureConnectedRelays();
      console.log(`Removing bookmark using ${connectedRelays.length} relays:`, connectedRelays);
      
      // Use retry mechanism for the operation
      const result = await retry(
        async () => this.bookmarkManager.removeBookmark(
          this.pool,
          this.publicKey, 
          undefined, // Let NostrService handle signing using the extension
          eventId, 
          connectedRelays
        ),
        {
          maxAttempts: 3,
          onRetry: (attempt, error) => {
            console.log(`Retry attempt ${attempt} for remove bookmark:`, error);
          }
        }
      );
      
      if (!result) {
        console.error("Bookmark removal operation failed but didn't throw an error");
      }
      
      return !!result;
    } catch (error) {
      console.error("Error in BookmarkService.removeBookmark:", error);
      
      // If operation failed, update the cache to reflect the failure
      await BookmarkCacheService.cacheBookmarkStatus(eventId, true);
      
      throw error; // Re-throw to allow UI layer to handle the specific error
    }
  }
  
  /**
   * Get all bookmarks with cache support
   */
  async getBookmarks(): Promise<string[]> {
    if (!this.publicKey) {
      console.log("Cannot get bookmarks: No public key (user not logged in)");
      return [];
    }
    
    try {
      // First try to get bookmarks from the cache
      const cachedBookmarks = await BookmarkCacheService.getCachedBookmarkList();
      
      // Check if we're offline and have cached data
      if (!navigator.onLine && cachedBookmarks.length > 0) {
        console.log("Using cached bookmarks (offline mode)");
        return cachedBookmarks;
      }
      
      // If online, try to get from the network
      const connectedRelays = await this.ensureConnectedRelays();
      
      const bookmarkList = await retry(
        () => this.bookmarkManager.getBookmarkList(
          this.pool,
          this.publicKey,
          connectedRelays
        ),
        {
          maxAttempts: 3,
          onRetry: (attempt) => {
            console.log(`Retry attempt ${attempt} for fetching bookmarks`);
          }
        }
      );
      
      // Update the cache with new data
      await BookmarkCacheService.cacheBookmarkList(bookmarkList);
      
      return bookmarkList;
    } catch (error) {
      console.error("Error in BookmarkService.getBookmarks:", error);
      
      // If network request failed but we have cached data, use that
      const cachedBookmarks = await BookmarkCacheService.getCachedBookmarkList();
      if (cachedBookmarks.length > 0) {
        console.log("Network request failed, falling back to cached bookmarks");
        return cachedBookmarks;
      }
      
      return [];
    }
  }
  
  /**
   * Check if an event is bookmarked with cache support
   */
  async isBookmarked(eventId: string): Promise<boolean> {
    if (!this.publicKey) {
      return false;
    }
    
    try {
      // First check the cache
      const cachedStatus = await BookmarkCacheService.getCachedBookmarkStatus(eventId);
      if (cachedStatus !== null) {
        console.log(`Using cached bookmark status for ${eventId}: ${cachedStatus}`);
        return cachedStatus;
      }
      
      // If not in cache or we're online, check from network
      if (navigator.onLine) {
        const connectedRelays = await this.ensureConnectedRelays();
        
        const isBookmarked = await retry(
          () => this.bookmarkManager.isBookmarked(
            this.pool,
            this.publicKey, 
            eventId,
            connectedRelays
          ),
          {
            maxAttempts: 2, // Less retries for status check
            baseDelay: 500
          }
        );
        
        // Cache the result
        await BookmarkCacheService.cacheBookmarkStatus(eventId, isBookmarked);
        
        return isBookmarked;
      }
      
      return false; // If offline and not in cache, assume not bookmarked
    } catch (error) {
      console.error("Error in BookmarkService.isBookmarked:", error);
      return false;
    }
  }
  
  /**
   * Process any pending bookmark operations
   * This should be called when the app comes back online
   */
  async processPendingOperations(): Promise<void> {
    if (!this.publicKey || !navigator.onLine) {
      return;
    }
    
    try {
      const pendingOps = await BookmarkCacheService.getPendingOperations();
      
      for (const op of pendingOps) {
        try {
          if (op.type === 'add') {
            await this.addBookmark(
              op.data.eventId,
              op.data.collectionId,
              op.data.tags,
              op.data.note
            );
          } else if (op.type === 'remove') {
            await this.removeBookmark(op.data.eventId);
          }
          
          // Mark as completed
          await BookmarkCacheService.completeOperation(op.id);
        } catch (error) {
          console.error(`Error processing pending operation ${op.id}:`, error);
          
          // Update operation status
          await BookmarkCacheService.updateOperationStatus(
            op.id,
            'failed',
            op.retryCount + 1
          );
        }
      }
    } catch (error) {
      console.error("Error processing pending bookmark operations:", error);
    }
  }
}
