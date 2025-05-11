
import { SimplePool, type Filter } from 'nostr-tools';
import { BookmarkEventKinds, BookmarkManagerDependencies, BookmarkWithMetadata } from '../types';
import { validateRelays } from '../utils/bookmark-utils';

/**
 * Manages bookmark metadata operations
 */
export class MetadataOperations {
  constructor(private dependencies: BookmarkManagerDependencies) {}
  
  /**
   * Get metadata for all bookmarks
   */
  async getBookmarkMetadata(
    pool: SimplePool,
    pubkey: string,
    relays: string[]
  ): Promise<BookmarkWithMetadata[]> {
    // Validate relays
    validateRelays(relays);
    
    return new Promise((resolve) => {
      const metadata: BookmarkWithMetadata[] = [];
      
      // Subscribe to bookmark metadata events (NIP-33 compliant)
      const filter: Filter = {
        kinds: [BookmarkEventKinds.BOOKMARK_METADATA],
        authors: [pubkey]
      };
      
      try {
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
                createdAt: data.createdAt || event.created_at
              });
            } catch (e) {
              console.error("Error parsing bookmark metadata:", e);
            }
          }
        });
        
        // Set a timeout to resolve with found metadata
        const timeout = 3000;
        setTimeout(() => {
          sub.close();
          resolve(metadata);
        }, timeout);
      } catch (error) {
        console.error("Error getting bookmark metadata:", error);
        resolve([]);
      }
    });
  }
  
  /**
   * Gets the count of bookmarks per collection
   */
  async getCollectionCounts(
    pool: SimplePool,
    pubkey: string,
    relays: string[]
  ): Promise<Record<string, number>> {
    try {
      const metadata = await this.getBookmarkMetadata(pool, pubkey, relays);
      const collectionCounts: Record<string, number> = {};
      
      metadata.forEach(meta => {
        if (meta.collectionId) {
          collectionCounts[meta.collectionId] = (collectionCounts[meta.collectionId] || 0) + 1;
        }
      });
      
      return collectionCounts;
    } catch (error) {
      console.error("Error getting collection counts:", error);
      return {};
    }
  }
}
