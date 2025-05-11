import { EventManager } from './event';
import { EVENT_KINDS } from './constants';
import { SimplePool } from 'nostr-tools';
import { toast } from 'sonner';

export interface BookmarkCollection {
  id: string;
  name: string;
  color?: string;
  description?: string;
  createdAt: number;
}

export interface BookmarkWithMetadata {
  id: string;
  eventId: string;
  collectionId?: string;
  tags?: string[];
  note?: string;
  addedAt: number;
}

export class BookmarkManager {
  private eventManager: EventManager;
  private bookmarksCache: Map<string, string[]> = new Map(); // Cache for bookmarks by pubkey
  private collectionsCache: Map<string, BookmarkCollection[]> = new Map(); // Cache for collections by pubkey
  private bookmarkMetadataCache: Map<string, BookmarkWithMetadata[]> = new Map(); // Cache for bookmark metadata
  private fetchPromises: Map<string, Promise<string[]>> = new Map(); // Track ongoing fetch operations
  private collectionsPromises: Map<string, Promise<BookmarkCollection[]>> = new Map(); // Track ongoing collections fetches
  private metadataPromises: Map<string, Promise<BookmarkWithMetadata[]>> = new Map(); // Track ongoing metadata fetches

  constructor(eventManager: EventManager) {
    this.eventManager = eventManager;
  }

  async addBookmark(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null,
    eventId: string,
    relays: string[],
    collectionId?: string,
    tags?: string[],
    note?: string
  ): Promise<boolean> {
    if (!publicKey) {
      console.error("Cannot add bookmark: User not logged in");
      return false;
    }

    try {
      // First, get the current bookmark list (use cache if available)
      const currentBookmarks = await this.getBookmarkList(pool, publicKey, relays);
      
      // Check if this event is already bookmarked
      if (currentBookmarks.includes(eventId)) {
        // If already bookmarked, just update metadata if provided
        if (collectionId || tags || note) {
          await this.updateBookmarkMetadata(
            pool, 
            publicKey, 
            privateKey, 
            eventId, 
            relays, 
            collectionId, 
            tags, 
            note
          );
          toast.success("Bookmark updated");
        }
        return true;
      }
      
      // Add the new bookmark
      const updatedBookmarks = [...currentBookmarks, eventId];

      // Update cache immediately for fast UI feedback
      this.bookmarksCache.set(publicKey, updatedBookmarks);

      // Create the bookmark list event
      const event = {
        kind: EVENT_KINDS.BOOKMARKS,
        content: "",
        tags: updatedBookmarks.map(id => ['e', id])
      };

      const publishedEventId = await this.eventManager.publishEvent(
        pool,
        publicKey,
        privateKey,
        event,
        relays
      );

      // If metadata is provided, save it as well
      if (collectionId || tags || note) {
        await this.updateBookmarkMetadata(
          pool, 
          publicKey, 
          privateKey, 
          eventId, 
          relays, 
          collectionId, 
          tags, 
          note
        );
      }

      return !!publishedEventId;
    } catch (error) {
      console.error("Error adding bookmark:", error);
      return false;
    }
  }

  async removeBookmark(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null,
    eventId: string,
    relays: string[]
  ): Promise<boolean> {
    if (!publicKey) {
      console.error("Cannot remove bookmark: User not logged in");
      return false;
    }

    try {
      // Get the current bookmark list (use cache if available)
      const currentBookmarks = await this.getBookmarkList(pool, publicKey, relays);
      
      // Remove the bookmark
      const updatedBookmarks = currentBookmarks.filter(id => id !== eventId);
      
      // If nothing changed, no need to publish
      if (currentBookmarks.length === updatedBookmarks.length) {
        return true;
      }
      
      // Update cache immediately for fast UI feedback
      this.bookmarksCache.set(publicKey, updatedBookmarks);
      
      // Create updated bookmark list event
      const event = {
        kind: EVENT_KINDS.BOOKMARKS,
        content: "",
        tags: updatedBookmarks.map(id => ['e', id])
      };

      const resultEventId = await this.eventManager.publishEvent(
        pool,
        publicKey,
        privateKey,
        event,
        relays
      );

      // Also remove any metadata for this bookmark
      await this.removeBookmarkMetadata(pool, publicKey, privateKey, eventId, relays);

      return !!resultEventId;
    } catch (error) {
      console.error("Error removing bookmark:", error);
      return false;
    }
  }

  async getBookmarkList(
    pool: SimplePool,
    publicKey: string,
    relays: string[]
  ): Promise<string[]> {
    // Check cache first
    if (this.bookmarksCache.has(publicKey)) {
      return this.bookmarksCache.get(publicKey) || [];
    }
    
    // Check if we already have a fetch in progress
    const cacheKey = `${publicKey}`;
    if (this.fetchPromises.has(cacheKey)) {
      return this.fetchPromises.get(cacheKey) || [];
    }
    
    // Create a new fetch promise
    const fetchPromise = new Promise<string[]>((resolve) => {
      const bookmarkEvents: string[] = [];
      
      const sub = pool.subscribeMany(
        relays,
        [{
          kinds: [EVENT_KINDS.BOOKMARKS],
          authors: [publicKey],
          limit: 1
        }],
        {
          onevent: (event) => {
            // Extract event IDs from 'e' tags
            const bookmarks = event.tags
              .filter(tag => tag.length >= 2 && tag[0] === 'e')
              .map(tag => tag[1]);
              
            bookmarkEvents.push(...bookmarks);
          },
          oneose: () => {
            // When we've received all events or timed out
            this.bookmarksCache.set(publicKey, bookmarkEvents);
            this.fetchPromises.delete(cacheKey);
            resolve(bookmarkEvents);
            sub.close();
          }
        }
      );
      
      // Set a timeout to resolve with found bookmarks if oneose doesn't trigger
      setTimeout(() => {
        if (this.fetchPromises.has(cacheKey)) {
          this.bookmarksCache.set(publicKey, bookmarkEvents);
          this.fetchPromises.delete(cacheKey);
          resolve(bookmarkEvents);
          sub.close();
        }
      }, 3000);
    });
    
    // Store the promise so we don't start multiple fetches
    this.fetchPromises.set(cacheKey, fetchPromise);
    
    return fetchPromise;
  }

  async isBookmarked(
    pool: SimplePool,
    publicKey: string,
    eventId: string,
    relays: string[]
  ): Promise<boolean> {
    if (!publicKey) return false;
    
    try {
      const bookmarks = await this.getBookmarkList(pool, publicKey, relays);
      return bookmarks.includes(eventId);
    } catch (error) {
      console.error("Error checking bookmark status:", error);
      return false;
    }
  }
  
  // Collections API
  async createCollection(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null,
    name: string,
    relays: string[],
    color?: string,
    description?: string
  ): Promise<string | null> {
    if (!publicKey) {
      console.error("Cannot create collection: User not logged in");
      return null;
    }

    try {
      const collectionId = `col-${Math.random().toString(36).substring(2, 10)}`;
      const createdAt = Math.floor(Date.now() / 1000);
      
      // Get current collections
      const collections = await this.getCollections(pool, publicKey, relays);
      
      // Create new collection
      const newCollection: BookmarkCollection = {
        id: collectionId,
        name,
        color,
        description,
        createdAt
      };
      
      // Update cache
      const updatedCollections = [...collections, newCollection];
      this.collectionsCache.set(publicKey, updatedCollections);
      
      // Create collection event
      const event = {
        kind: EVENT_KINDS.BOOKMARK_COLLECTIONS,
        content: JSON.stringify(updatedCollections),
        tags: [['d', 'bookmark-collections']]
      };

      const resultEventId = await this.eventManager.publishEvent(
        pool,
        publicKey,
        privateKey,
        event,
        relays
      );

      if (resultEventId) {
        toast.success(`Collection "${name}" created`);
        return collectionId;
      }
      
      return null;
    } catch (error) {
      console.error("Error creating bookmark collection:", error);
      return null;
    }
  }
  
  async updateCollection(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null,
    collectionId: string,
    updates: Partial<BookmarkCollection>,
    relays: string[]
  ): Promise<boolean> {
    if (!publicKey) {
      console.error("Cannot update collection: User not logged in");
      return false;
    }

    try {
      // Get current collections
      const collections = await this.getCollections(pool, publicKey, relays);
      
      // Find and update collection
      const collectionIndex = collections.findIndex(col => col.id === collectionId);
      if (collectionIndex === -1) return false;
      
      const updatedCollection = {
        ...collections[collectionIndex],
        ...updates
      };
      
      collections[collectionIndex] = updatedCollection;
      
      // Update cache
      this.collectionsCache.set(publicKey, collections);
      
      // Create collection event
      const event = {
        kind: EVENT_KINDS.BOOKMARK_COLLECTIONS,
        content: JSON.stringify(collections),
        tags: [['d', 'bookmark-collections']]
      };

      const resultEventId = await this.eventManager.publishEvent(
        pool,
        publicKey,
        privateKey,
        event,
        relays
      );

      return !!resultEventId;
    } catch (error) {
      console.error("Error updating bookmark collection:", error);
      return false;
    }
  }
  
  async deleteCollection(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null,
    collectionId: string,
    relays: string[]
  ): Promise<boolean> {
    if (!publicKey) {
      console.error("Cannot delete collection: User not logged in");
      return false;
    }

    try {
      // Get current collections
      const collections = await this.getCollections(pool, publicKey, relays);
      
      // Filter out the collection
      const updatedCollections = collections.filter(col => col.id !== collectionId);
      
      // If nothing changed, no need to publish
      if (collections.length === updatedCollections.length) {
        return false;
      }
      
      // Update cache
      this.collectionsCache.set(publicKey, updatedCollections);
      
      // Create collection event
      const event = {
        kind: EVENT_KINDS.BOOKMARK_COLLECTIONS,
        content: JSON.stringify(updatedCollections),
        tags: [['d', 'bookmark-collections']]
      };

      const resultEventId = await this.eventManager.publishEvent(
        pool,
        publicKey,
        privateKey,
        event,
        relays
      );

      // Now remove this collection from all bookmarks
      const metadata = await this.getBookmarkMetadata(pool, publicKey, relays);
      const bookmarksToUpdate = metadata.filter(bm => bm.collectionId === collectionId);
      
      for (const bookmark of bookmarksToUpdate) {
        await this.updateBookmarkMetadata(
          pool,
          publicKey,
          privateKey,
          bookmark.eventId,
          relays,
          undefined, // Remove collection reference
          bookmark.tags,
          bookmark.note
        );
      }

      return !!resultEventId;
    } catch (error) {
      console.error("Error deleting bookmark collection:", error);
      return false;
    }
  }
  
  async getCollections(
    pool: SimplePool,
    publicKey: string,
    relays: string[]
  ): Promise<BookmarkCollection[]> {
    // Check cache first
    if (this.collectionsCache.has(publicKey)) {
      return this.collectionsCache.get(publicKey) || [];
    }
    
    // Check if we already have a fetch in progress
    const cacheKey = `${publicKey}`;
    if (this.collectionsPromises.has(cacheKey)) {
      return this.collectionsPromises.get(cacheKey) || [];
    }
    
    // Create a new fetch promise
    const fetchPromise = new Promise<BookmarkCollection[]>((resolve) => {
      let collections: BookmarkCollection[] = [];
      
      const sub = pool.subscribeMany(
        relays,
        [{
          kinds: [EVENT_KINDS.BOOKMARK_COLLECTIONS],
          authors: [publicKey],
          "#d": ["bookmark-collections"],
          limit: 1
        }],
        {
          onevent: (event) => {
            try {
              // Parse collections from content
              collections = JSON.parse(event.content);
            } catch (e) {
              console.error("Error parsing bookmark collections:", e);
            }
          },
          oneose: () => {
            // When we've received all events or timed out
            this.collectionsCache.set(publicKey, collections);
            this.collectionsPromises.delete(cacheKey);
            resolve(collections);
            sub.close();
          }
        }
      );
      
      // Set a timeout to resolve if oneose doesn't trigger
      setTimeout(() => {
        if (this.collectionsPromises.has(cacheKey)) {
          this.collectionsCache.set(publicKey, collections);
          this.collectionsPromises.delete(cacheKey);
          resolve(collections);
          sub.close();
        }
      }, 3000);
    });
    
    // Store the promise so we don't start multiple fetches
    this.collectionsPromises.set(cacheKey, fetchPromise);
    
    return fetchPromise;
  }

  // Bookmark Metadata API
  async updateBookmarkMetadata(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null,
    eventId: string,
    relays: string[],
    collectionId?: string,
    tags?: string[],
    note?: string
  ): Promise<boolean> {
    if (!publicKey) {
      console.error("Cannot update bookmark metadata: User not logged in");
      return false;
    }

    try {
      // Get current metadata
      const allMetadata = await this.getBookmarkMetadata(pool, publicKey, relays);
      
      const existingIndex = allMetadata.findIndex(bm => bm.eventId === eventId);
      const now = Math.floor(Date.now() / 1000);
      
      let updatedMetadata: BookmarkWithMetadata[];
      
      if (existingIndex >= 0) {
        // Update existing metadata
        const updated = {
          ...allMetadata[existingIndex]
        };
        
        if (collectionId !== undefined) updated.collectionId = collectionId;
        if (tags !== undefined) updated.tags = tags;
        if (note !== undefined) updated.note = note;
        
        updatedMetadata = [...allMetadata];
        updatedMetadata[existingIndex] = updated;
      } else {
        // Create new metadata
        const newMetadata: BookmarkWithMetadata = {
          id: `bm-${Math.random().toString(36).substring(2, 10)}`,
          eventId,
          addedAt: now
        };
        
        if (collectionId) newMetadata.collectionId = collectionId;
        if (tags) newMetadata.tags = tags;
        if (note) newMetadata.note = note;
        
        updatedMetadata = [...allMetadata, newMetadata];
      }
      
      // Update cache
      this.bookmarkMetadataCache.set(publicKey, updatedMetadata);
      
      // Create metadata event
      const event = {
        kind: EVENT_KINDS.BOOKMARK_METADATA,
        content: JSON.stringify(updatedMetadata),
        tags: [['d', 'bookmark-metadata']]
      };

      const resultEventId = await this.eventManager.publishEvent(
        pool,
        publicKey,
        privateKey,
        event,
        relays
      );

      return !!resultEventId;
    } catch (error) {
      console.error("Error updating bookmark metadata:", error);
      return false;
    }
  }
  
  async removeBookmarkMetadata(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null,
    eventId: string,
    relays: string[]
  ): Promise<boolean> {
    if (!publicKey) {
      console.error("Cannot remove bookmark metadata: User not logged in");
      return false;
    }

    try {
      // Get current metadata
      const allMetadata = await this.getBookmarkMetadata(pool, publicKey, relays);
      
      // Remove metadata for this eventId
      const updatedMetadata = allMetadata.filter(bm => bm.eventId !== eventId);
      
      // If nothing changed, no need to publish
      if (allMetadata.length === updatedMetadata.length) {
        return true;
      }
      
      // Update cache
      this.bookmarkMetadataCache.set(publicKey, updatedMetadata);
      
      // Create metadata event
      const event = {
        kind: EVENT_KINDS.BOOKMARK_METADATA,
        content: JSON.stringify(updatedMetadata),
        tags: [['d', 'bookmark-metadata']]
      };

      const resultEventId = await this.eventManager.publishEvent(
        pool,
        publicKey,
        privateKey,
        event,
        relays
      );

      return !!resultEventId;
    } catch (error) {
      console.error("Error removing bookmark metadata:", error);
      return false;
    }
  }
  
  async getBookmarkMetadata(
    pool: SimplePool,
    publicKey: string,
    relays: string[]
  ): Promise<BookmarkWithMetadata[]> {
    // Check cache first
    if (this.bookmarkMetadataCache.has(publicKey)) {
      return this.bookmarkMetadataCache.get(publicKey) || [];
    }
    
    // Check if we already have a fetch in progress
    const cacheKey = `${publicKey}`;
    if (this.metadataPromises.has(cacheKey)) {
      return this.metadataPromises.get(cacheKey) || [];
    }
    
    // Create a new fetch promise
    const fetchPromise = new Promise<BookmarkWithMetadata[]>((resolve) => {
      let metadata: BookmarkWithMetadata[] = [];
      
      const sub = pool.subscribeMany(
        relays,
        [{
          kinds: [EVENT_KINDS.BOOKMARK_METADATA],
          authors: [publicKey],
          "#d": ["bookmark-metadata"],
          limit: 1
        }],
        {
          onevent: (event) => {
            try {
              // Parse metadata from content
              metadata = JSON.parse(event.content);
            } catch (e) {
              console.error("Error parsing bookmark metadata:", e);
            }
          },
          oneose: () => {
            // When we've received all events or timed out
            this.bookmarkMetadataCache.set(publicKey, metadata);
            this.metadataPromises.delete(cacheKey);
            resolve(metadata);
            sub.close();
          }
        }
      );
      
      // Set a timeout to resolve if oneose doesn't trigger
      setTimeout(() => {
        if (this.metadataPromises.has(cacheKey)) {
          this.bookmarkMetadataCache.set(publicKey, metadata);
          this.metadataPromises.delete(cacheKey);
          resolve(metadata);
          sub.close();
        }
      }, 3000);
    });
    
    // Store the promise so we don't start multiple fetches
    this.metadataPromises.set(cacheKey, fetchPromise);
    
    return fetchPromise;
  }
  
  // Clear cache for a specific user
  clearCache(publicKey?: string) {
    if (publicKey) {
      this.bookmarksCache.delete(publicKey);
      this.collectionsCache.delete(publicKey);
      this.bookmarkMetadataCache.delete(publicKey);
    } else {
      this.bookmarksCache.clear();
      this.collectionsCache.clear();
      this.bookmarkMetadataCache.clear();
    }
  }
}
