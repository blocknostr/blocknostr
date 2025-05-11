import { SimplePool } from 'nostr-tools';
import { EventManager } from '../event';
import { ProfileService } from './profile-service';
import { FeedService } from './feed-service';
import { NotificationService } from './notification-service';
import { ChatService } from './chat-service';
import { BookmarkService } from './bookmark-service';
import { BookmarkManagerFacade } from '../bookmark';

/**
 * Composer service that provides access to all Nostr services
 */
export class NostrService {
  private pool: SimplePool;
  private eventManager: EventManager;
  
  public publicKey: string | null = null;
  private privateKey: string | null | undefined = undefined;
  
  public readonly profileService: ProfileService;
  public readonly feedService: FeedService;
  public readonly notificationService: NotificationService;
  public readonly chatService: ChatService;
  public readonly bookmarkService: BookmarkService;
  public readonly bookmarkManager: BookmarkManagerFacade;
  
  constructor() {
    this.pool = new SimplePool();
    this.eventManager = new EventManager(this.pool);
    
    this.profileService = new ProfileService(this.pool);
    this.feedService = new FeedService(this.pool);
    this.notificationService = new NotificationService(this.pool);
    this.chatService = new ChatService(this.pool, this.eventManager);
    
    // Initialize the BookmarkManagerFacade
    this.bookmarkManager = new BookmarkManagerFacade(this.eventManager);
    
    // Initialize the BookmarkService with the manager
    this.bookmarkService = new BookmarkService(
      this.bookmarkManager,
      this.pool,
      null, // Will be set when user logs in
      () => this.getRelayStatus(),
      () => this.connectToUserRelays()
    );
  }

  setPublicKey(publicKey: string | null) {
    this.publicKey = publicKey;
    
    // Update public key in bookmark service
    (this.bookmarkService as any).publicKey = publicKey;
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
    return this.eventManager.publishEvent(this.pool, this.publicKey, this.privateKey, event, relays);
  }

  getRelayUrls(): string[] {
    const relayStatus = this.getRelayStatus();
    return relayStatus.map(relay => relay.url);
  }

  getRelayStatus(): { url: string; status: string }[] {
    const relays = Object.values(this.pool.relays);
    return relays.map(relay => ({
      url: relay.url,
      status: relay.status
    }));
  }

  async connectToRelays(relays: string[]): Promise<void> {
    await this.eventManager.connectToRelays(relays);
  }

  async connectToUserRelays(): Promise<string[]> {
    if (!this.publicKey) {
      console.warn("Cannot connect to user relays: No public key provided");
      return [];
    }
    
    return this.eventManager.connectToUserRelays(this.publicKey);
  }

  subscribe(filters: any[], onEvent: (event: any) => void): string {
    const relays = this.getRelayUrls();
    return this.eventManager.subscribe(filters, onEvent, relays);
  }

  unsubscribe(subId: string): void {
    this.eventManager.unsubscribe(subId);
  }

  async getEventById(id: string): Promise<any | null> {
    const relays = this.getRelayUrls();
    return this.eventManager.getEventById(id, relays);
  }

  async getEvents(ids: string[]): Promise<any[]> {
    const relays = this.getRelayUrls();
    return this.eventManager.getEvents(ids, relays);
  }

  async getProfilesByPubkeys(pubkeys: string[]): Promise<Record<string, any>> {
    const relays = this.getRelayUrls();
    return this.profileService.getProfilesByPubkeys(pubkeys, this.pool, relays);
  }

  // Re-expose methods from BookmarkService as top-level methods
  async addBookmark(eventId: string, collectionId?: string, tags?: string[], note?: string): Promise<boolean> {
    return this.bookmarkService.addBookmark(eventId, collectionId, tags, note);
  }

  async removeBookmark(eventId: string): Promise<boolean> {
    return this.bookmarkService.removeBookmark(eventId);
  }

  async getBookmarks(useCache: boolean = true): Promise<string[]> {
    return this.bookmarkService.getBookmarks(useCache);
  }

  async isBookmarked(eventId: string): Promise<boolean> {
    return this.bookmarkService.isBookmarked(eventId);
  }

  async createBookmarkCollection(name: string, color?: string, description?: string): Promise<string | null> {
    return this.bookmarkService.createBookmarkCollection(name, color, description);
  }

  async getBookmarkCollections(useCache: boolean = true): Promise<any[]> {
    return this.bookmarkService.getBookmarkCollections(useCache);
  }

  async getBookmarkMetadata(useCache: boolean = true): Promise<any[]> {
    return this.bookmarkService.getBookmarkMetadata(useCache);
  }

  async processPendingOperations(): Promise<void> {
    return this.bookmarkService.processPendingOperations();
  }
}

export const nostrService = new NostrService();
