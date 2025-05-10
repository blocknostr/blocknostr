
import { EventManager } from './event';
import { EVENT_KINDS } from './constants';
import { SimplePool } from 'nostr-tools';

export class BookmarkManager {
  private eventManager: EventManager;
  private bookmarksCache: Map<string, string[]> = new Map(); // Cache for bookmarks by pubkey
  private fetchPromises: Map<string, Promise<string[]>> = new Map(); // Track ongoing fetch operations

  constructor(eventManager: EventManager) {
    this.eventManager = eventManager;
  }

  async addBookmark(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null,
    eventId: string,
    relays: string[]
  ): Promise<boolean> {
    if (!publicKey) {
      console.error("Cannot add bookmark: User not logged in");
      return false;
    }

    // Create a NIP-51 bookmark list event
    try {
      // First, get the current bookmark list (use cache if available)
      const currentBookmarks = await this.getBookmarkList(pool, publicKey, relays);
      
      // Check if this event is already bookmarked
      if (currentBookmarks.includes(eventId)) {
        return true; // Already bookmarked
      }
      
      // Add the new bookmark
      const updatedBookmarks = [...currentBookmarks, eventId];

      // Update cache immediately for fast UI feedback
      this.bookmarksCache.set(publicKey, updatedBookmarks);

      // Create the bookmark list event
      const event = {
        kind: EVENT_KINDS.BOOKMARK_LIST,
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
        kind: EVENT_KINDS.BOOKMARK_LIST,
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
          kinds: [EVENT_KINDS.BOOKMARK_LIST],
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
  
  // Clear cache for a specific user
  clearCache(publicKey?: string) {
    if (publicKey) {
      this.bookmarksCache.delete(publicKey);
    } else {
      this.bookmarksCache.clear();
    }
  }
}
