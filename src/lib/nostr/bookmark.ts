
import { SimplePool, type Filter, type Sub } from 'nostr-tools';
import { EventManager } from './event';
import { EVENT_KINDS } from './constants';

export interface BookmarkCollection {
  id: string;
  name: string;
  color?: string;
  description?: string;
  totalItems: number;
}

export interface BookmarkWithMetadata {
  eventId: string;
  collectionId?: string;
  tags?: string[];
  note?: string;
}

export class BookmarkManager {
  private eventManager: EventManager;
  
  constructor(eventManager: EventManager) {
    this.eventManager = eventManager;
  }
  
  /**
   * Add a bookmark for an event
   */
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
    if (!publicKey) return false;
    
    try {
      // First get existing bookmarks
      const bookmarks = await this.getBookmarkList(pool, publicKey, relays);
      
      // Check if already bookmarked
      if (bookmarks.includes(eventId)) {
        // If already bookmarked, just update metadata if provided
        if (collectionId || tags?.length || note) {
          return this.updateBookmarkMetadata(pool, publicKey, privateKey, eventId, relays, collectionId, tags, note);
        }
        return true; // Already bookmarked
      }
      
      // Create bookmarks list event (NIP-51)
      const event = {
        kind: EVENT_KINDS.BOOKMARKS,
        content: "",
        tags: [
          ...bookmarks.map(id => ["e", id]), // Include all existing bookmarks
          ["e", eventId] // Add new bookmark
        ]
      };
      
      const resultId = await this.eventManager.publishEvent(pool, publicKey, privateKey, event, relays);
      
      // Also create bookmark metadata if provided
      if (resultId && (collectionId || tags?.length || note)) {
        await this.updateBookmarkMetadata(pool, publicKey, privateKey, eventId, relays, collectionId, tags, note);
      }
      
      return !!resultId;
    } catch (error) {
      console.error("Error adding bookmark:", error);
      return false;
    }
  }
  
  /**
   * Remove a bookmark
   */
  async removeBookmark(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null,
    eventId: string,
    relays: string[]
  ): Promise<boolean> {
    if (!publicKey) return false;
    
    try {
      // First get existing bookmarks
      const bookmarks = await this.getBookmarkList(pool, publicKey, relays);
      
      // Check if it's actually bookmarked
      if (!bookmarks.includes(eventId)) {
        return true; // Not bookmarked, nothing to do
      }
      
      // Create updated bookmarks list event without the removed bookmark
      const event = {
        kind: EVENT_KINDS.BOOKMARKS,
        content: "",
        tags: bookmarks
          .filter(id => id !== eventId)
          .map(id => ["e", id])
      };
      
      const resultId = await this.eventManager.publishEvent(pool, publicKey, privateKey, event, relays);
      
      // Also remove any bookmark metadata
      if (resultId) {
        await this.removeBookmarkMetadata(pool, publicKey, privateKey, eventId, relays);
      }
      
      return !!resultId;
    } catch (error) {
      console.error("Error removing bookmark:", error);
      return false;
    }
  }
  
  /**
   * Get list of bookmarked event IDs
   */
  async getBookmarkList(
    pool: SimplePool,
    pubkey: string,
    relays: string[]
  ): Promise<string[]> {
    return new Promise((resolve) => {
      let bookmarkedIds: string[] = [];
      
      // Subscribe to bookmark list events - updated for SimplePool API
      const filters: Filter[] = [
        {
          kinds: [EVENT_KINDS.BOOKMARKS],
          authors: [pubkey],
          limit: 1
        }
      ];
      
      const sub = pool.sub(relays, filters);
      
      sub.on('event', (event) => {
        // Extract e tags (bookmarked event IDs)
        const bookmarks = event.tags
          .filter(tag => tag.length >= 2 && tag[0] === 'e')
          .map(tag => tag[1]);
        
        bookmarkedIds = bookmarks;
      });
      
      // Set a timeout to resolve with found bookmarks
      setTimeout(() => {
        pool.close([sub.id]);
        resolve(bookmarkedIds);
      }, 3000);
    });
  }
  
  /**
   * Check if an event is bookmarked
   */
  async isBookmarked(
    pool: SimplePool,
    pubkey: string,
    eventId: string,
    relays: string[]
  ): Promise<boolean> {
    const bookmarks = await this.getBookmarkList(pool, pubkey, relays);
    return bookmarks.includes(eventId);
  }
  
  /**
   * Create a bookmark collection
   */
  async createCollection(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null,
    name: string,
    relays: string[],
    color?: string,
    description?: string
  ): Promise<string | null> {
    if (!publicKey) return null;
    
    // Create collection unique ID
    const collectionId = `col_${Math.random().toString(36).substring(2, 10)}`;
    
    // Create collection metadata
    const collectionData = {
      name,
      color: color || "#000000",
      description: description || "",
      createdAt: Math.floor(Date.now() / 1000)
    };
    
    // Create collection event
    const event = {
      kind: EVENT_KINDS.BOOKMARK_COLLECTIONS,
      content: JSON.stringify(collectionData),
      tags: [
        ["d", collectionId] // Unique identifier
      ]
    };
    
    return this.eventManager.publishEvent(pool, publicKey, privateKey, event, relays);
  }
  
  /**
   * Update a bookmark collection
   */
  async updateCollection(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null,
    collectionId: string,
    updates: Partial<BookmarkCollection>,
    relays: string[]
  ): Promise<boolean> {
    if (!publicKey) return false;
    
    // First get existing collection
    const collections = await this.getCollections(pool, publicKey, relays);
    const collection = collections.find(c => c.id === collectionId);
    
    if (!collection) {
      return false; // Collection doesn't exist
    }
    
    // Update collection data
    const updatedData = {
      name: updates.name || collection.name,
      color: updates.color || collection.color || "#000000",
      description: updates.description || collection.description || "",
      createdAt: Math.floor(Date.now() / 1000)
    };
    
    // Create updated collection event
    const event = {
      kind: EVENT_KINDS.BOOKMARK_COLLECTIONS,
      content: JSON.stringify(updatedData),
      tags: [
        ["d", collectionId] // Same unique identifier
      ]
    };
    
      // Use a different variable name to avoid duplication
      const publishResult = await this.eventManager.publishEvent(pool, publicKey, privateKey, event, relays);
      return !!publishResult;
  }
  
  /**
   * Delete a bookmark collection
   */
  async deleteCollection(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null,
    collectionId: string,
    relays: string[]
  ): Promise<boolean> {
    if (!publicKey) return false;
    
    // Create deletion event (NIP-09)
    const event = {
      kind: EVENT_KINDS.DELETE,
      content: "Deleted collection",
      tags: [
        ["a", `${EVENT_KINDS.BOOKMARK_COLLECTIONS}:${publicKey}:${collectionId}`]
      ]
    };
    
    // Fix: Use a different variable name
    const result = await this.eventManager.publishEvent(pool, publicKey, privateKey, event, relays);
    return !!result;
  }
  
  /**
   * Get all bookmark collections
   */
  async getCollections(
    pool: SimplePool,
    pubkey: string,
    relays: string[]
  ): Promise<BookmarkCollection[]> {
    return new Promise(async (resolve) => {
      const collections: BookmarkCollection[] = [];
      const bookmarkMetadata = await this.getBookmarkMetadata(pool, pubkey, relays);
      
      // Count items per collection
      const collectionCounts: Record<string, number> = {};
      bookmarkMetadata.forEach(meta => {
        if (meta.collectionId) {
          collectionCounts[meta.collectionId] = (collectionCounts[meta.collectionId] || 0) + 1;
        }
      });
      
      // Subscribe to bookmark collections - updated for SimplePool API
      const filters: Filter[] = [
        {
          kinds: [EVENT_KINDS.BOOKMARK_COLLECTIONS],
          authors: [pubkey],
        }
      ];
      
      const sub = pool.sub(relays, filters);
      
      sub.on('event', (event) => {
        try {
          const data = JSON.parse(event.content);
          
          // Extract collection ID from d tag
          const dTag = event.tags.find(tag => tag[0] === 'd');
          if (!dTag || !dTag[1]) return;
          
          const collectionId = dTag[1];
          
          collections.push({
            id: collectionId,
            name: data.name || "Unnamed Collection",
            color: data.color,
            description: data.description,
            totalItems: collectionCounts[collectionId] || 0
          });
        } catch (e) {
          console.error("Error parsing collection data:", e);
        }
      });
      
      // Set a timeout to resolve with found collections
      setTimeout(() => {
        pool.close([sub.id]);
        resolve(collections);
      }, 3000);
    });
  }
  
  /**
   * Update bookmark metadata
   */
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
    if (!publicKey) return false;
    
    // Create metadata object
    const metadata: Record<string, any> = {};
    if (collectionId) metadata.collectionId = collectionId;
    if (note) metadata.note = note;
    
    // Create metadata event
    const event = {
      kind: EVENT_KINDS.BOOKMARK_METADATA,
      content: JSON.stringify(metadata),
      tags: [
        ["e", eventId], // Reference to bookmarked event
        ["d", `meta_${eventId.substring(0, 8)}`] // Unique identifier based on event ID
      ]
    };
    
    // Add tags if provided
    if (tags && tags.length > 0) {
      tags.forEach(tag => {
        event.tags.push(["t", tag]);
      });
    }
    
    // Fix: Use a different variable name
    const metaResult = await this.eventManager.publishEvent(pool, publicKey, privateKey, event, relays);
    return !!metaResult;
  }
  
  /**
   * Remove bookmark metadata
   */
  async removeBookmarkMetadata(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null,
    eventId: string,
    relays: string[]
  ): Promise<boolean> {
    if (!publicKey) return false;
    
    // Create deletion event (NIP-09)
    const event = {
      kind: EVENT_KINDS.DELETE,
      content: "Deleted bookmark metadata",
      tags: [
        ["a", `${EVENT_KINDS.BOOKMARK_METADATA}:${publicKey}:meta_${eventId.substring(0, 8)}`]
      ]
    };
    
    // Use a distinct variable name
    const deleteResult = await this.eventManager.publishEvent(pool, publicKey, privateKey, event, relays);
    return !!deleteResult;
  }
  
  /**
   * Get metadata for all bookmarks
   */
  async getBookmarkMetadata(
    pool: SimplePool,
    pubkey: string,
    relays: string[]
  ): Promise<BookmarkWithMetadata[]> {
    return new Promise((resolve) => {
      const metadata: BookmarkWithMetadata[] = [];
      
      // Subscribe to bookmark metadata events - updated for SimplePool API
      const filters: Filter[] = [
        {
          kinds: [EVENT_KINDS.BOOKMARK_METADATA],
          authors: [pubkey]
        }
      ];
      
      const sub = pool.sub(relays, filters);
      
      sub.on('event', (event) => {
        try {
          // Extract referenced event ID from e tag
          const eventRef = event.tags.find(tag => tag[0] === 'e');
          if (!eventRef || !eventRef[1]) return;
          
          const eventId = eventRef[1];
          
          // Parse metadata from content
          const data = JSON.parse(event.content);
          
          // Extract any tags
          const tagList = event.tags
            .filter(tag => tag[0] === 't' && tag.length >= 2)
            .map(tag => tag[1]);
          
          metadata.push({
            eventId,
            collectionId: data.collectionId,
            note: data.note,
            tags: tagList.length > 0 ? tagList : undefined
          });
        } catch (e) {
          console.error("Error parsing bookmark metadata:", e);
        }
      });
      
      // Set a timeout to resolve with found metadata
      setTimeout(() => {
        pool.close([sub.id]);
        resolve(metadata);
      }, 3000);
    });
  }
}
