
import { SimplePool } from 'nostr-tools';
import { BookmarkManagerDependencies } from './types';
import { BookmarkOperations } from './operations/bookmark-operations';
import { CollectionOperations } from './operations/collection-operations';
import { MetadataOperations } from './operations/metadata-operations';
import { bookmarkStorage } from './storage/bookmark-storage';
import { BookmarkCacheService } from './cache/bookmark-cache-service';

/**
 * Primary facade for bookmark functionality
 * Coordinates between different specialized operation classes
 */
export class BookmarkManager {
  private bookmarkOps: BookmarkOperations;
  private collectionOps: CollectionOperations;
  private metadataOps: MetadataOperations;
  
  constructor(dependencies: BookmarkManagerDependencies) {
    this.bookmarkOps = new BookmarkOperations(dependencies);
    this.collectionOps = new CollectionOperations(dependencies);
    this.metadataOps = new MetadataOperations(dependencies);
  }
  
  // Bookmark operations
  async addBookmark(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
    eventId: string,
    relays: string[],
    collectionId?: string,
    tags?: string[],
    note?: string
  ): Promise<boolean> {
    const result = await this.bookmarkOps.addBookmark(
      pool, publicKey, privateKey, eventId, relays, 
      collectionId, tags, note
    );
    
    // Cache result if successful
    if (result) {
      await BookmarkCacheService.cacheBookmarkStatus(eventId, true);
    }
    
    return result;
  }
  
  async removeBookmark(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
    eventId: string,
    relays: string[]
  ): Promise<boolean> {
    const result = await this.bookmarkOps.removeBookmark(
      pool, publicKey, privateKey, eventId, relays
    );
    
    // Cache result if successful
    if (result) {
      await BookmarkCacheService.cacheBookmarkStatus(eventId, false);
    }
    
    return result;
  }
  
  async getBookmarkList(
    pool: SimplePool,
    pubkey: string,
    relays: string[]
  ): Promise<string[]> {
    const results = await this.bookmarkOps.getBookmarkList(pool, pubkey, relays);
    
    // Cache results
    await BookmarkCacheService.cacheBookmarkList(results);
    
    return results;
  }
  
  async isBookmarked(
    pool: SimplePool,
    pubkey: string,
    eventId: string,
    relays: string[]
  ): Promise<boolean> {
    return this.bookmarkOps.isBookmarked(pool, pubkey, eventId, relays);
  }
  
  // Collection operations
  async createCollection(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
    name: string,
    relays: string[],
    color?: string,
    description?: string
  ): Promise<string | null> {
    return this.collectionOps.createCollection(
      pool, publicKey, privateKey, name, relays, color, description
    );
  }
  
  async updateCollection(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
    collectionId: string,
    updates: any,
    relays: string[]
  ): Promise<boolean> {
    return this.collectionOps.updateCollection(
      pool, publicKey, privateKey, collectionId, updates, relays
    );
  }
  
  async deleteCollection(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
    collectionId: string,
    relays: string[]
  ): Promise<boolean> {
    return this.collectionOps.deleteCollection(
      pool, publicKey, privateKey, collectionId, relays
    );
  }
  
  async getCollections(
    pool: SimplePool,
    pubkey: string,
    relays: string[]
  ): Promise<any[]> {
    const collections = await this.collectionOps.getCollections(pool, pubkey, relays);
    
    // Get counts for each collection
    const counts = await this.metadataOps.getCollectionCounts(pool, pubkey, relays);
    
    // Update collection counts
    const collectionsWithCounts = collections.map(collection => ({
      ...collection,
      totalItems: counts[collection.id] || 0
    }));
    
    // Cache results
    await BookmarkCacheService.cacheBookmarkCollections(collectionsWithCounts);
    
    return collectionsWithCounts;
  }
  
  // Metadata operations
  async getBookmarkMetadata(
    pool: SimplePool,
    pubkey: string,
    relays: string[]
  ): Promise<any[]> {
    const metadata = await this.metadataOps.getBookmarkMetadata(pool, pubkey, relays);
    
    // Cache results
    await BookmarkCacheService.cacheBookmarkMetadata(metadata);
    
    return metadata;
  }
  
  // Pass through additional methods
  async updateBookmarkMetadata(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
    eventId: string,
    relays: string[],
    collectionId?: string,
    tags?: string[],
    note?: string
  ): Promise<boolean> {
    return this.bookmarkOps.updateBookmarkMetadata(
      pool, publicKey, privateKey, eventId, relays, collectionId, tags, note
    );
  }
  
  async removeBookmarkMetadata(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
    eventId: string,
    relays: string[]
  ): Promise<boolean> {
    return this.bookmarkOps.removeBookmarkMetadata(
      pool, publicKey, privateKey, eventId, relays
    );
  }
}
