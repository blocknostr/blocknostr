
import { SimplePool, type Filter } from 'nostr-tools';
import { BookmarkCollection, BookmarkEventKinds, BookmarkManagerDependencies } from '../types';
import { validateRelays } from '../utils/bookmark-utils';

/**
 * Manages bookmark collections
 */
export class CollectionOperations {
  constructor(private dependencies: BookmarkManagerDependencies) {}
  
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
    
    // Validate relays
    validateRelays(relays);
    
    // Create collection unique ID
    const collectionId = `col_${Math.random().toString(36).substring(2, 10)}`;
    
    // Create collection metadata
    const collectionData = {
      name,
      color: color || "#3b82f6", // Default to blue
      description: description || "",
      createdAt: Math.floor(Date.now() / 1000)
    };
    
    // Create collection event (NIP-33 compliant parameterized replaceable event)
    const event = {
      kind: BookmarkEventKinds.BOOKMARK_COLLECTIONS,
      content: JSON.stringify(collectionData),
      tags: [
        ["d", collectionId] // Unique identifier (NIP-33 compliant)
      ]
    };
    
    try {
      const result = await this.dependencies.publishEvent(pool, publicKey, privateKey, event, relays);
      return result ? collectionId : null;
    } catch (error) {
      console.error("Error creating collection:", error);
      return null;
    }
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
    
    // Validate relays
    validateRelays(relays);
    
    try {
      // First get existing collection
      const collections = await this.getCollections(pool, publicKey, relays);
      const collection = collections.find(c => c.id === collectionId);
      
      if (!collection) {
        return false; // Collection doesn't exist
      }
      
      // Update collection data
      const updatedData = {
        name: updates.name || collection.name,
        color: updates.color || collection.color || "#3b82f6",
        description: updates.description || collection.description || "",
        createdAt: collection.createdAt,
        updatedAt: Math.floor(Date.now() / 1000)
      };
      
      // Create updated collection event (NIP-33 compliant parameterized replaceable event)
      const event = {
        kind: BookmarkEventKinds.BOOKMARK_COLLECTIONS,
        content: JSON.stringify(updatedData),
        tags: [
          ["d", collectionId] // Same unique identifier (NIP-33 compliant)
        ]
      };
      
      const publishResult = await this.dependencies.publishEvent(pool, publicKey, privateKey, event, relays);
      return !!publishResult;
    } catch (error) {
      console.error("Error updating collection:", error);
      return false;
    }
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
    
    // Validate relays
    validateRelays(relays);
    
    try {
      // Create deletion event (NIP-09 compliant)
      const event = {
        kind: BookmarkEventKinds.DELETE,
        content: "Deleted collection",
        tags: [
          // NIP-09 format: ["a", "<kind>:<pubkey>:<d-identifier>"]
          ["a", `${BookmarkEventKinds.BOOKMARK_COLLECTIONS}:${publicKey}:${collectionId}`]
        ]
      };
      
      const result = await this.dependencies.publishEvent(pool, publicKey, privateKey, event, relays);
      return !!result;
    } catch (error) {
      console.error("Error deleting collection:", error);
      return false;
    }
  }
  
  /**
   * Get all bookmark collections
   */
  async getCollections(
    pool: SimplePool,
    pubkey: string,
    relays: string[]
  ): Promise<BookmarkCollection[]> {
    // Validate relays
    validateRelays(relays);
    
    return new Promise(async (resolve) => {
      const collections: BookmarkCollection[] = [];
      
      // Subscribe to bookmark collections (NIP-33 compliant parameter-based filter)
      const filter: Filter = {
        kinds: [BookmarkEventKinds.BOOKMARK_COLLECTIONS],
        authors: [pubkey],
      };
      
      try {
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
                color: data.color || "#3b82f6",
                description: data.description || "",
                createdAt: data.createdAt || event.created_at,
                updatedAt: data.updatedAt,
                totalItems: 0 // Updated later
              });
            } catch (e) {
              console.error("Error parsing collection data:", e);
            }
          }
        });
        
        // Set a timeout to resolve with found collections
        const timeout = 3000;
        setTimeout(() => {
          sub.close();
          resolve(collections);
        }, timeout);
      } catch (error) {
        console.error("Error getting collections:", error);
        resolve([]);
      }
    });
  }
}
