import { SimplePool } from 'nostr-tools';
import { 
  BookmarkManagerFacade, 
  BookmarkCollection, 
  BookmarkWithMetadata,
  BookmarkStorage,
  ensureRelayConnection
} from '../bookmark';
import { retry } from '@/lib/utils/retry';

/**
 * Service layer for bookmark functionality
 * Handles caching, offline operations, and relay management
 */
export class BookmarkService {
  constructor(
    private bookmarkManager: BookmarkManagerFacade,
    private pool: SimplePool,
    private getPublicKey: () => string | null,
    private getRelayUrls: () => string[]
  ) {}
  
  /**
   * Get currently connected relay URLs
   */
  private getConnectedRelayUrls(): string[] {
    return this.getRelayUrls();
  }
  
  /**
   * Ensure connection to relays before performing operations
   */
  private async ensureConnectedRelays(): Promise<string[]> {
    return this.getConnectedRelayUrls();
  }
  
  /**
   * Add a bookmark with retry mechanism
   */
  async addBookmark(
    eventId: string,
    collectionId?: string,
    tags?: string[],
    note?: string
  ): Promise<boolean> {
    const publicKey = this.getPublicKey();
    if (!publicKey) {
      throw new Error("Cannot add bookmark: Not logged in");
    }
    
    try {
      // If offline, queue the operation for later
      if (!navigator.onLine) {
        await BookmarkStorage.queueOperation({
          type: 'add',
          eventId,
          collectionId,
          tags,
          note
        });
        return true; // Optimistic response
      }
      
      // Connect to relays if needed
      const connectedRelays = await this.ensureConnectedRelays();
      
      // Add the bookmark with retry logic
      return retry(
        async () => this.bookmarkManager.addBookmark(
          this.pool,
          publicKey,
          undefined, // Let NostrService handle signing
          eventId,
          connectedRelays,
          collectionId,
          tags,
          note
        ),
        {
          maxAttempts: 3,
          baseDelay: 1000,
          onRetry: (attempt) => {
            console.log(`Retry attempt ${attempt} for adding bookmark: ${eventId}`);
          }
        }
      );
    } catch (error) {
      console.error("Error adding bookmark:", error);
      throw error;
    }
  }
  
  /**
   * Remove a bookmark with retry mechanism
   */
  async removeBookmark(eventId: string): Promise<boolean> {
    const publicKey = this.getPublicKey();
    if (!publicKey) {
      throw new Error("Cannot remove bookmark: Not logged in");
    }
    
    try {
      // If offline, queue the operation for later
      if (!navigator.onLine) {
        await BookmarkStorage.queueOperation({
          type: 'remove',
          eventId,
          tags: [],
          note: ''
        });
        return true; // Optimistic response
      }
      
      // Connect to relays if needed
      const connectedRelays = await this.ensureConnectedRelays();
      
      // Remove the bookmark with retry logic
      return retry(
        async () => this.bookmarkManager.removeBookmark(
          this.pool,
          publicKey,
          undefined, // Let NostrService handle signing
          eventId,
          connectedRelays
        ),
        {
          maxAttempts: 3,
          baseDelay: 1000,
          onRetry: (attempt) => {
            console.log(`Retry attempt ${attempt} for removing bookmark: ${eventId}`);
          }
        }
      );
    } catch (error) {
      console.error("Error removing bookmark:", error);
      throw error;
    }
  }
  
  /**
   * Get all bookmarks with caching
   */
  async getBookmarks(useCache: boolean = true): Promise<string[]> {
    if (!this.publicKey) {
      return [];
    }
    
    try {
      // Return from cache if offline or useCache is true
      if (!navigator.onLine || (useCache && !this.getConnectedRelayUrls().length)) {
        return BookmarkStorage.getCachedBookmarkList();
      }
      
      // Connect to relays if needed
      const connectedRelays = await this.ensureConnectedRelays();
      
      // Get bookmarks from network
      const bookmarks = await this.bookmarkManager.getBookmarkList(
        this.pool,
        this.publicKey,
        connectedRelays
      );
      
      // Cache the results
      await BookmarkStorage.cacheBookmarkList(bookmarks);
      
      return bookmarks;
    } catch (error) {
      console.error("Error getting bookmarks:", error);
      
      // Fallback to cache on error
      return BookmarkStorage.getCachedBookmarkList();
    }
  }
  
  /**
   * Check if a post is bookmarked with caching
   */
  async isBookmarked(eventId: string): Promise<boolean> {
    if (!this.publicKey) {
      return false;
    }
    
    try {
      // Check cache first
      const cachedStatus = await BookmarkStorage.getCachedBookmarkStatus(eventId);
      if (cachedStatus !== null) {
        return cachedStatus;
      }
      
      // If offline, return false (will be updated when online)
      if (!navigator.onLine) {
        return false;
      }
      
      // Connect to relays if needed
      const connectedRelays = await this.ensureConnectedRelays();
      
      // Check bookmark status
      const isBookmarked = await this.bookmarkManager.isBookmarked(
        this.pool,
        this.publicKey,
        eventId,
        connectedRelays
      );
      
      // Cache the result
      await BookmarkStorage.cacheBookmarkStatus(eventId, isBookmarked);
      
      return isBookmarked;
    } catch (error) {
      console.error("Error checking if bookmarked:", error);
      return false;
    }
  }
  
  /**
   * Create a bookmark collection
   */
  async createBookmarkCollection(
    name: string,
    color?: string,
    description?: string
  ): Promise<string | null> {
    const publicKey = this.getPublicKey();
    if (!publicKey) {
      throw new Error("Cannot create collection: Not logged in");
    }
    
    try {
      // Connect to relays if needed
      const connectedRelays = await this.ensureConnectedRelays();
      
      // Create the collection
      return this.bookmarkManager.createCollection(
        this.pool,
        publicKey,
        undefined, // Let NostrService handle signing
        name,
        connectedRelays,
        color,
        description
      );
    } catch (error) {
      console.error("Error creating bookmark collection:", error);
      throw error;
    }
  }
  
  /**
   * Get all bookmark collections with caching
   */
  async getBookmarkCollections(useCache: boolean = true): Promise<BookmarkCollection[]> {
    if (!this.publicKey) {
      return [];
    }
    
    try {
      // Return from cache if offline or useCache is true
      if (!navigator.onLine || (useCache && !this.getConnectedRelayUrls().length)) {
        return BookmarkStorage.getCachedBookmarkCollections();
      }
      
      // Connect to relays if needed
      const connectedRelays = await this.ensureConnectedRelays();
      
      // Get collections from network
      const collections = await this.bookmarkManager.getCollections(
        this.pool,
        this.publicKey,
        connectedRelays
      );
      
      // Cache the results
      await BookmarkStorage.cacheBookmarkCollections(collections);
      
      return collections;
    } catch (error) {
      console.error("Error getting bookmark collections:", error);
      
      // Fallback to cache on error
      return BookmarkStorage.getCachedBookmarkCollections();
    }
  }
  
  /**
   * Get metadata for all bookmarks with caching
   */
  async getBookmarkMetadata(useCache: boolean = true): Promise<BookmarkWithMetadata[]> {
    if (!this.publicKey) {
      return [];
    }
    
    try {
      // Return from cache if offline or useCache is true
      if (!navigator.onLine || (useCache && !this.getConnectedRelayUrls().length)) {
        return BookmarkStorage.getCachedBookmarkMetadata();
      }
      
      // Connect to relays if needed
      const connectedRelays = await this.ensureConnectedRelays();
      
      // Get metadata from network
      const metadata = await this.bookmarkManager.getBookmarkMetadata(
        this.pool,
        this.publicKey,
        connectedRelays
      );
      
      // Cache the results
      await BookmarkStorage.cacheBookmarkMetadata(metadata);
      
      return metadata;
    } catch (error) {
      console.error("Error getting bookmark metadata:", error);
      
      // Fallback to cache on error
      return BookmarkStorage.getCachedBookmarkMetadata();
    }
  }
  
  /**
   * Process any pending bookmark operations from offline mode
   */
  async processPendingOperations(): Promise<void> {
    const publicKey = this.getPublicKey();
    if (!publicKey || !navigator.onLine) {
      return;
    }
    
    try {
      // Get pending operations
      const pendingOps = await BookmarkStorage.getPendingOperations();
      
      if (pendingOps.length === 0) {
        console.log("No pending bookmark operations to process");
        return;
      }
      
      console.log(`Processing ${pendingOps.length} pending bookmark operations`);
      
      // Connect to relays if needed
      const connectedRelays = await this.ensureConnectedRelays();
      
      // Process each operation
      for (const op of pendingOps) {
        try {
          if (op.type === 'add') {
            await this.bookmarkManager.addBookmark(
              this.pool,
              publicKey,
              undefined,
              op.eventId || '',
              connectedRelays,
              op.collectionId,
              op.tags,
              op.note
            );
          } else if (op.type === 'remove') {
            await this.bookmarkManager.removeBookmark(
              this.pool,
              publicKey,
              undefined,
              op.eventId || '',
              connectedRelays
            );
          } else if (op.type === 'create_collection') {
            await this.bookmarkManager.createCollection(
              this.pool,
              publicKey,
              undefined,
              op.name || '',
              connectedRelays,
              op.color,
              op.description
            );
          }
          
          // Mark as completed
          await BookmarkStorage.completeOperation(op.id);
        } catch (error) {
          console.error(`Error processing pending operation ${op.id}:`, error);
          
          // Update operation status
          await BookmarkStorage.updateOperationStatus(
            op.id,
            'failed',
            (op.attempts || 0) + 1
          );
        }
      }
    } catch (error) {
      console.error("Error in processPendingOperations:", error);
    }
  }
}
