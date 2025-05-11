
import { SimplePool, type Filter } from 'nostr-tools';
import { EVENT_KINDS } from '../constants';
import { BookmarkCollection, BookmarkManagerDependencies, BookmarkWithMetadata } from './types';

/**
 * Manages bookmark collections
 */
export class BookmarkCollectionManager {
  private dependencies: BookmarkManagerDependencies;
  
  constructor(dependencies: BookmarkManagerDependencies) {
    this.dependencies = dependencies;
  }
  
  /**
   * Create a bookmark collection
   */
  async createCollection(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
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
    
    // Create collection event (NIP-33 compliant parameterized replaceable event)
    const event = {
      kind: EVENT_KINDS.BOOKMARK_COLLECTIONS,
      content: JSON.stringify(collectionData),
      tags: [
        ["d", collectionId] // Unique identifier (NIP-33 compliant)
      ]
    };
    
    // Use the dependencies publishEvent method (single argument version)
    return this.dependencies.publishEvent(event);
  }
  
  /**
   * Update a bookmark collection
   */
  async updateCollection(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
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
      updatedAt: Math.floor(Date.now() / 1000), // Add updatedAt timestamp
      createdAt: collection.createdAt || Math.floor(Date.now() / 1000) // Preserve original creation time
    };
    
    // Create updated collection event (NIP-33 compliant parameterized replaceable event)
    const event = {
      kind: EVENT_KINDS.BOOKMARK_COLLECTIONS,
      content: JSON.stringify(updatedData),
      tags: [
        ["d", collectionId] // Same unique identifier (NIP-33 compliant)
      ]
    };
    
    // Use the dependencies publishEvent method (single argument version)
    const publishResult = await this.dependencies.publishEvent(event);
    return !!publishResult;
  }
  
  /**
   * Delete a bookmark collection
   */
  async deleteCollection(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
    collectionId: string,
    relays: string[]
  ): Promise<boolean> {
    if (!publicKey) return false;
    
    // Create deletion event (NIP-09 compliant)
    const event = {
      kind: EVENT_KINDS.DELETE,
      content: "Deleted collection",
      tags: [
        // NIP-09 format: ["a", "<kind>:<pubkey>:<d-identifier>"]
        ["a", `${EVENT_KINDS.BOOKMARK_COLLECTIONS}:${publicKey}:${collectionId}`]
      ]
    };
    
    // Use the dependencies publishEvent method (single argument version)
    const result = await this.dependencies.publishEvent(event);
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
      
      // Subscribe to bookmark collections (NIP-33 compliant parameter-based filter)
      const filter: Filter = {
        kinds: [EVENT_KINDS.BOOKMARK_COLLECTIONS],
        authors: [pubkey],
      };
      
      const sub = pool.subscribe(relays, filter, {
        onevent: (event) => {
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
              createdAt: data.createdAt || event.created_at, // Use event.created_at as fallback
              totalItems: 0 // We'll populate this count later
            });
          } catch (e) {
            console.error("Error parsing collection data:", e);
          }
        }
      });
      
      // Set a configurable timeout to resolve with found collections
      const timeout = 3000; // Could be made configurable based on network conditions
      setTimeout(async () => {
        sub.close();
        
        // Get bookmark metadata to count items per collection
        try {
          const metadataManager = new BookmarkMetadataManager(this.dependencies);
          const bookmarkMetadata = await metadataManager.getBookmarkMetadata(pool, pubkey, relays);
          
          // Count items per collection
          const collectionCounts: Record<string, number> = {};
          bookmarkMetadata.forEach(meta => {
            if (meta.collectionId) {
              collectionCounts[meta.collectionId] = (collectionCounts[meta.collectionId] || 0) + 1;
            }
          });
          
          // Update collection counts
          collections.forEach(collection => {
            collection.totalItems = collectionCounts[collection.id] || 0;
          });
        } catch (e) {
          console.error("Error counting collection items:", e);
        }
        
        resolve(collections);
      }, timeout);
    });
  }
}

/**
 * Manages bookmark metadata
 */
export class BookmarkMetadataManager {
  private dependencies: BookmarkManagerDependencies;
  
  constructor(dependencies: BookmarkManagerDependencies) {
    this.dependencies = dependencies;
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
      
      // Subscribe to bookmark metadata events (NIP-33 compliant)
      const filter: Filter = {
        kinds: [EVENT_KINDS.BOOKMARK_METADATA],
        authors: [pubkey]
      };
      
      const sub = pool.subscribe(relays, filter, {
        onevent: (event) => {
          try {
            // Extract referenced event ID from e tag
            const eventRef = event.tags.find(tag => tag[0] === 'e');
            if (!eventRef || !eventRef[1]) return;
            
            const eventId = eventRef[1];
            
            // Parse metadata from content
            const data = JSON.parse(event.content);
            
            // Extract any tags following NIP standards
            const tagList = event.tags
              .filter(tag => tag[0] === 't' && tag.length >= 2)
              .map(tag => tag[1]);
            
            metadata.push({
              eventId,
              collectionId: data.collectionId,
              note: data.note,
              tags: tagList.length > 0 ? tagList : undefined,
              createdAt: event.created_at // Add creation timestamp from event
            });
          } catch (e) {
            console.error("Error parsing bookmark metadata:", e);
          }
        }
      });
      
      // Set a configurable timeout to resolve with found metadata
      const timeout = 3000; // Could be made configurable based on network conditions
      setTimeout(() => {
        sub.close();
        resolve(metadata);
      }, timeout);
    });
  }
}
