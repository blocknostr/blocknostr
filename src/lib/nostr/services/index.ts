
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
      () => this.getRelayStatus().map(relay => relay.url)
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
    // Access pool.relays safely
    const relays = Object.entries((this.pool as any).relays || {}).map(([url, relay]) => ({
      url,
      status: (relay as any).status || 'unknown'
    }));
    
    return relays;
  }

  async connectToRelays(relays: string[]): Promise<void> {
    // Connect to relays directly using pool
    relays.forEach(url => this.pool.ensureRelay(url));
  }

  async connectToUserRelays(): Promise<string[]> {
    if (!this.publicKey) {
      console.warn("Cannot connect to user relays: No public key provided");
      return [];
    }
    
    // Simplified implementation
    const defaultRelays = ["wss://relay.damus.io", "wss://relay.nostr.band", "wss://nos.lol"];
    defaultRelays.forEach(url => this.pool.ensureRelay(url));
    return defaultRelays;
  }

  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]): string {
    const relayUrls = relays || this.getRelayUrls();
    // Use pool directly for subscription
    const sub = this.pool.sub(relayUrls, filters);
    sub.on('event', onEvent);
    return sub.sub;
  }

  unsubscribe(subId: string): void {
    // Use pool directly to unsubscribe
    this.pool.close([subId]);
  }

  async getEventById(id: string): Promise<any | null> {
    const relays = this.getRelayUrls();
    return this.eventManager.getEventById(this.pool, id, relays);
  }

  async getEvents(ids: string[]): Promise<any[]> {
    const relays = this.getRelayUrls();
    return this.eventManager.getEvents(this.pool, ids, relays);
  }

  async getProfilesByPubkeys(pubkeys: string[]): Promise<Record<string, any>> {
    const relays = this.getRelayUrls();
    return this.eventManager.getProfilesByPubkeys(this.pool, pubkeys, relays);
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
}

export const nostrService = new NostrService();

// Export the types needed by the service
export type { BookmarkService };
