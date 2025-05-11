
import { SimplePool } from 'nostr-tools';
import { EventManager } from '../event';
import { BookmarkManagerFacade } from '../bookmark';
import { BookmarkService } from './bookmark-service';
import { SocialManager } from '../social';

/**
 * Composer service that provides access to all Nostr services
 */
export class NostrService {
  private pool: SimplePool;
  private eventManager: EventManager;
  private socialManagerInstance: SocialManager;
  
  public publicKey: string | null = null;
  private privateKey: string | null | undefined = undefined;
  
  public readonly bookmarkService: BookmarkService;
  public readonly bookmarkManager: BookmarkManagerFacade;
  
  constructor() {
    this.pool = new SimplePool();
    this.eventManager = new EventManager();
    this.socialManagerInstance = new SocialManager(this.eventManager);
    
    // Initialize the BookmarkManagerFacade
    this.bookmarkManager = new BookmarkManagerFacade(this.eventManager);
    
    // Initialize the BookmarkService with the manager
    this.bookmarkService = new BookmarkService(
      this.bookmarkManager,
      this.pool,
      () => this.publicKey,
      () => this.getRelayUrls()
    );
  }

  get socialManager() {
    return this.socialManagerInstance;
  }

  setPublicKey(publicKey: string | null) {
    this.publicKey = publicKey;
  }
  
  setPrivateKey(privateKey: string | null | undefined) {
    this.privateKey = privateKey;
  }

  async init() {
    // Initialization logic here
  }

  async publishEvent(event: any): Promise<string | null> {
    if (!this.publicKey) {
      throw new Error("Cannot publish event: No public key provided");
    }
    
    const relays = this.getRelayUrls();
    return this.eventManager.publishEvent(
      this.pool, 
      this.publicKey, 
      this.privateKey, 
      event, 
      relays
    );
  }

  getRelayUrls(): string[] {
    const relayStatus = this.getRelayStatus();
    return relayStatus.map(relay => relay.url);
  }

  getRelayStatus(): { url: string; status: string }[] {
    try {
      // Access pool.relays safely using Object.entries
      const relayEntries = Object.entries((this.pool as any).relays || {});
      return relayEntries.map(([url, relay]) => ({
        url,
        status: (relay as any).status || 'unknown'
      }));
    } catch (e) {
      console.error("Error getting relay status:", e);
      return [];
    }
  }

  async connectToRelays(relays: string[]): Promise<void> {
    // Connect to relays directly using pool
    relays.forEach(url => {
      try {
        this.pool.ensureRelay(url);
      } catch (e) {
        console.error(`Failed to connect to relay ${url}:`, e);
      }
    });
  }

  async connectToUserRelays(): Promise<string[]> {
    if (!this.publicKey) {
      console.warn("Cannot connect to user relays: No public key provided");
      return [];
    }
    
    // Simplified implementation
    const defaultRelays = ["wss://relay.damus.io", "wss://relay.nostr.band", "wss://nos.lol"];
    await this.connectToRelays(defaultRelays);
    return defaultRelays;
  }

  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]): string {
    const relayUrls = relays || this.getRelayUrls();
    // Use pool directly for subscription
    try {
      const subscription = this.pool.subscribe(relayUrls, filters);
      subscription.on('event', onEvent);
      return subscription.sub;
    } catch (e) {
      console.error("Error creating subscription:", e);
      return "";
    }
  }

  unsubscribe(subId: string): void {
    // Use pool directly to unsubscribe
    this.pool.close([subId]);
  }

  async getEventById(id: string): Promise<any | null> {
    const relays = this.getRelayUrls();
    try {
      return await this.eventManager.getEventById(this.pool, id, relays);
    } catch (e) {
      console.error(`Error getting event ${id}:`, e);
      return null;
    }
  }

  async getEvents(ids: string[]): Promise<any[]> {
    const relays = this.getRelayUrls();
    try {
      return await this.eventManager.getEvents(this.pool, ids, relays);
    } catch (e) {
      console.error("Error getting events:", e);
      return [];
    }
  }

  async getProfilesByPubkeys(pubkeys: string[]): Promise<Record<string, any>> {
    const relays = this.getRelayUrls();
    try {
      return await this.eventManager.getProfilesByPubkeys(this.pool, pubkeys, relays);
    } catch (e) {
      console.error("Error getting profiles:", e);
      return {};
    }
  }

  // Get a single user profile
  async getUserProfile(pubkey: string): Promise<any> {
    const relays = this.getRelayUrls();
    try {
      return await this.eventManager.getUserProfile(this.pool, pubkey, relays);
    } catch (e) {
      console.error(`Error getting profile for ${pubkey}:`, e);
      return null;
    }
  }

  // Verify NIP-05 identifier
  async verifyNip05(identifier: string, pubkey: string): Promise<boolean> {
    try {
      return await this.eventManager.verifyNip05(identifier, pubkey);
    } catch (e) {
      console.error("Error verifying NIP-05:", e);
      return false;
    }
  }

  // Re-expose methods from BookmarkService as top-level methods
  async addBookmark(eventId: string, collectionId?: string, tags?: string[], note?: string): Promise<boolean> {
    return this.bookmarkService.addBookmark(eventId, collectionId, tags, note);
  }

  async removeBookmark(eventId: string): Promise<boolean> {
    return this.bookmarkService.removeBookmark(eventId);
  }

  async getBookmarks(): Promise<string[]> {
    return this.bookmarkService.getBookmarks();
  }

  async isBookmarked(eventId: string): Promise<boolean> {
    return this.bookmarkService.isBookmarked(eventId);
  }

  async createBookmarkCollection(name: string, color?: string, description?: string): Promise<string | null> {
    return this.bookmarkService.createBookmarkCollection(name, color, description);
  }

  async getBookmarkCollections(): Promise<any[]> {
    return this.bookmarkService.getBookmarkCollections();
  }

  async getBookmarkMetadata(): Promise<any[]> {
    return this.bookmarkService.getBookmarkMetadata();
  }

  async processPendingOperations(): Promise<void> {
    return this.bookmarkService.processPendingOperations();
  }

  // Add missing relay methods
  async getRelaysForUser(pubkey: string): Promise<string[]> {
    // This would normally query relays for a user's relay list (NIP-65)
    // For now, just return default relays
    return ["wss://relay.damus.io", "wss://relay.nostr.band", "wss://nos.lol"];
  }

  // Add multi-relay management method for ProfileRelaysDialog.tsx
  async addMultipleRelays(relays: string[]): Promise<boolean> {
    try {
      await this.connectToRelays(relays);
      return true;
    } catch (error) {
      console.error("Error adding multiple relays:", error);
      return false;
    }
  }
}

// Export the types needed by the service
export type { BookmarkService };

// Create a singleton instance
export const nostrService = new NostrService();
