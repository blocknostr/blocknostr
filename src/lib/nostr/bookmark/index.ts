
import { BookmarkManager } from './bookmark-manager';
import { EventManager } from '../event';
import { BookmarkManagerDependencies, QueuedOperation } from './types';
import { bookmarkStorage } from './storage/bookmark-storage';
import { validateRelays, generateStableMetadataId } from './utils/bookmark-utils';

// Re-export types
export type { 
  BookmarkCollection, 
  BookmarkWithMetadata,
  QueuedOperation,
  BookmarkStatus,
  BookmarkManagerDependencies,
  BookmarkEventKinds,
  BookmarkFilters
} from './types';

// Re-export storage 
export { bookmarkStorage } from './storage/bookmark-storage';

// Re-export utils
export { validateRelays, generateStableMetadataId } from './utils/bookmark-utils';

// Additional type for compatibility
export interface RelayConnectionOptions {
  timeout?: number;
  maxRetries?: number;
}

/**
 * Main entry point for bookmark functionality
 */
export class BookmarkManagerFacade {
  private bookmarkManager: BookmarkManager;
  
  constructor(eventManager: EventManager) {
    // Create the dependencies object with proper methods
    const dependencies: BookmarkManagerDependencies = {
      publishEvent: async (event: any) => eventManager.publishEvent(event),
      getEvents: async (filters: any[], relays?: string[]) => {
        return eventManager.getEvents(filters, relays || []);
      }
    };
    
    this.bookmarkManager = new BookmarkManager(dependencies);
  }
  
  // Re-expose all methods from the BookmarkManager
  async addBookmark(...args: Parameters<BookmarkManager['addBookmark']>) {
    return this.bookmarkManager.addBookmark(...args);
  }
  
  async removeBookmark(...args: Parameters<BookmarkManager['removeBookmark']>) {
    return this.bookmarkManager.removeBookmark(...args);
  }
  
  async getBookmarkList(...args: Parameters<BookmarkManager['getBookmarkList']>) {
    return this.bookmarkManager.getBookmarkList(...args);
  }
  
  // Methods needed for the facade
  
  async getBookmarks(
    pool: any,
    pubkey: string,
    relays: string[]
  ): Promise<string[]> {
    return this.getBookmarkList(pool, pubkey, relays);
  }
  
  async isBookmarked(...args: Parameters<BookmarkManager['isBookmarked']>) {
    return this.bookmarkManager.isBookmarked(...args);
  }
  
  async createCollection(...args: Parameters<BookmarkManager['createCollection']>) {
    return this.bookmarkManager.createCollection(...args);
  }
  
  async createBookmarkCollection(
    pool: any, 
    name: string, 
    publicKey: string | null, 
    privateKey: string | null | undefined,
    relays: string[],
    color?: string,
    description?: string
  ): Promise<string | null> {
    return this.createCollection(pool, publicKey, privateKey, name, relays, color, description);
  }
  
  async updateCollection(...args: Parameters<BookmarkManager['updateCollection']>) {
    return this.bookmarkManager.updateCollection(...args);
  }
  
  async deleteCollection(...args: Parameters<BookmarkManager['deleteCollection']>) {
    return this.bookmarkManager.deleteCollection(...args);
  }
  
  async getCollections(...args: Parameters<BookmarkManager['getCollections']>) {
    return this.bookmarkManager.getCollections(...args);
  }
  
  async getBookmarkCollections(
    pool: any,
    pubkey: string,
    relays: string[]
  ): Promise<any[]> {
    return this.getCollections(pool, pubkey, relays);
  }
  
  async getBookmarkMetadata(...args: Parameters<BookmarkManager['getBookmarkMetadata']>) {
    return this.bookmarkManager.getBookmarkMetadata(...args);
  }
  
  async updateBookmarkMetadata(...args: Parameters<BookmarkManager['updateBookmarkMetadata']>) {
    return this.bookmarkManager.updateBookmarkMetadata(...args);
  }
  
  async removeBookmarkMetadata(...args: Parameters<BookmarkManager['removeBookmarkMetadata']>) {
    return this.bookmarkManager.removeBookmarkMetadata(...args);
  }
  
  async processPendingOperations(
    pool: any,
    publicKey: string | null,
    privateKey: string | null | undefined,
    relays: string[]
  ): Promise<void> {
    // Implementation for processing pending operations
    console.log('Processing pending operations', publicKey, relays.length);
    return Promise.resolve();
  }
}
