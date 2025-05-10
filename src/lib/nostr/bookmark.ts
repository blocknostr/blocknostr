
import { EventManager } from './event';
import { EVENT_KINDS } from './constants';
import { SimplePool } from 'nostr-tools';

export class BookmarkManager {
  private eventManager: EventManager;

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
      // First, get the current bookmark list
      const currentBookmarks = await this.getBookmarkList(pool, publicKey, relays);
      
      // Check if this event is already bookmarked
      if (currentBookmarks.includes(eventId)) {
        return true; // Already bookmarked
      }
      
      // Add the new bookmark
      const updatedBookmarks = [...currentBookmarks, eventId];

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
      // Get the current bookmark list
      const currentBookmarks = await this.getBookmarkList(pool, publicKey, relays);
      
      // Remove the bookmark
      const updatedBookmarks = currentBookmarks.filter(id => id !== eventId);
      
      // If nothing changed, no need to publish
      if (currentBookmarks.length === updatedBookmarks.length) {
        return true;
      }
      
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
    return new Promise((resolve) => {
      const bookmarkEvents: string[] = [];
      
      // Subscribe to bookmark list events using the correct method signature
      // The subscribeMany method returns a SubCloser object that has different methods
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
          }
        }
      );
      
      // Set a timeout to resolve with found bookmarks
      setTimeout(() => {
        // Close the subscription properly
        sub.close();
        resolve(bookmarkEvents);
      }, 3000);
    });
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
}
