
import { SimplePool } from 'nostr-tools';
import { NostrEvent, Relay, NostrFilter } from './types';
import { EVENT_KINDS } from './constants';
import { UserManager } from './user';
import { RelayManager } from './relay';
import { SubscriptionManager } from './subscription';
import { SocialManager } from './social';
import { CommunityManager } from './community';
import { BookmarkManagerFacade } from './bookmark';
import { toast } from 'sonner';
import { NostrServiceAdapter } from './service-adapter';

import {
  EventService,
  ProfileService,
  RelayService,
  SocialService,
  DirectMessageService,
  UserModService,
  BookmarkService,
  CommunityService
} from './services';

/**
 * Main Nostr service that coordinates all functionality and managers
 * Implementation follows the latest NIP standards
 */
export class NostrService {
  // Legacy managers for backward compatibility
  private userManager: UserManager;
  public relayManager: RelayManager;
  private subscriptionManager: SubscriptionManager;
  private socialManagerInstance: SocialManager;
  public communityManager: CommunityManager;
  public bookmarkManager: BookmarkManagerFacade;
  
  // New service modules
  private eventService: EventService;
  private profileService: ProfileService;
  private relayService: RelayService;
  private socialService: SocialService;
  private directMessageService: DirectMessageService;
  private userModService: UserModService;
  private bookmarkService: BookmarkService;
  private communityService: CommunityService;
  
  // Core dependencies
  private pool: SimplePool;
  private adapter: NostrServiceAdapter;
  
  constructor() {
    // Initialize SimplePool first
    this.pool = new SimplePool();
    
    // Initialize legacy managers for backward compatibility
    this.userManager = new UserManager();
    this.relayManager = new RelayManager(this.pool);
    this.subscriptionManager = new SubscriptionManager(this.pool);
    this.socialManagerInstance = new SocialManager(null as any, this.userManager);
    this.communityManager = new CommunityManager(null as any);
    this.bookmarkManager = new BookmarkManagerFacade();
    
    // Initialize the event service first as other services depend on it
    this.eventService = new EventService(
      this.pool,
      () => this.userManager.publicKey,
      () => this.getConnectedRelayUrls()
    );
    
    // Initialize the profile service
    this.profileService = new ProfileService(
      this.pool,
      () => this.getConnectedRelayUrls()
    );
    
    // Initialize the relay service
    this.relayService = new RelayService(
      this.pool,
      () => ["wss://relay.damus.io", "wss://relay.nostr.band", "wss://nos.lol"]
    );
    
    // Initialize the social service
    this.socialService = new SocialService(
      this.pool,
      this.eventService,
      () => this.userManager.publicKey,
      () => this.userManager.following,
      (following) => this.userManager.setFollowing(following)
    );
    
    // Initialize the direct message service
    this.directMessageService = new DirectMessageService(
      this.pool,
      this.eventService,
      () => this.userManager.publicKey,
      () => this.getConnectedRelayUrls()
    );
    
    // Initialize the user moderation service
    this.userModService = new UserModService(
      this.pool,
      this.eventService,
      () => this.userManager.publicKey,
      () => this.getConnectedRelayUrls()
    );
    
    // Initialize the bookmark service
    this.bookmarkService = new BookmarkService(
      this.pool,
      this.eventService,
      () => this.userManager.publicKey,
      () => this.getConnectedRelayUrls()
    );
    
    // Initialize the community service
    this.communityService = new CommunityService(
      this.communityManager,
      () => this.getConnectedRelayUrls(),
      this.pool,
      this.userManager.publicKey
    );
    
    // Initialize adapter
    this.adapter = new NostrServiceAdapter(this);
    
    // Load user data
    this.userManager.loadUserKeys();
    this.userManager.loadFollowing();
    
    // Connect to relays
    this.connectToUserRelays();
    
    // Fetch following list and relay list if user is logged in
    if (this.publicKey) {
      this.fetchFollowingList();
    }
  }
  
  // Public API for user management
  get publicKey(): string | null {
    return this.userManager.publicKey;
  }
  
  get following(): string[] {
    return this.userManager.following;
  }
  
  get userRelays(): Map<string, boolean> {
    return this.relayService.getUserRelays();
  }
  
  // Expose the adapter as getter
  get socialManager() {
    return this.socialManagerInstance;
  }

  // Authentication methods
  public async login(): Promise<boolean> {
    const success = await this.userManager.login();
    if (success) {
      await this.fetchFollowingList();
    }
    return success;
  }
  
  public signOut(): void {
    this.userManager.signOut();
  }

  // Relay management - delegating to RelayService
  public async connectToRelays(relayUrls: string[]): Promise<void> {
    // Just call connectToUserRelays for now
    await this.connectToUserRelays();
  }
  
  public async connectToUserRelays(): Promise<string[]> {
    return this.relayService.connectToUserRelays();
  }

  // Added for compatibility with code expecting connectToDefaultRelays
  public async connectToDefaultRelays(): Promise<string[]> {
    return this.connectToUserRelays();
  }
  
  // Helper to get relay URLs
  public getRelayUrls(): string[] {
    return this.getRelayStatus()
      .filter(relay => relay.status === 'connected')
      .map(relay => relay.url);
  }
  
  public async addRelay(relayUrl: string, readWrite: boolean = true): Promise<boolean> {
    return this.relayService.addRelay(relayUrl, readWrite);
  }

  // Add method for adding multiple relays
  public async addMultipleRelays(relayUrls: string[]): Promise<number> {
    return this.relayService.addMultipleRelays(relayUrls);
  }
  
  public removeRelay(relayUrl: string): void {
    this.relayService.removeRelay(relayUrl);
  }
  
  public getRelayStatus(): Relay[] {
    return this.relayService.getRelayStatus();
  }
  
  // Method to get relays for a user
  public async getRelaysForUser(pubkey: string): Promise<string[]> {
    return this.relayService.getRelaysForUser(pubkey);
  }

  // Event publication - delegating to EventService
  public async publishEvent(event: Partial<NostrEvent>): Promise<string | null> {
    return this.eventService.publishEvent(event);
  }
  
  public async publishProfileMetadata(metadata: Record<string, any>): Promise<boolean> {
    return this.eventService.publishProfileMetadata(metadata);
  }
  
  // Subscription management
  public subscribe(
    filters: NostrFilter[],
    onEvent: (event: NostrEvent) => void,
    relays?: string[]
  ): string {
    const connectedRelays = relays || this.getConnectedRelayUrls();
    return this.subscriptionManager.subscribe(connectedRelays, filters, onEvent);
  }
  
  public unsubscribe(subId: string): void {
    this.subscriptionManager.unsubscribe(subId);
  }
  
  // Social features - delegating to SocialService
  public isFollowing(pubkey: string): boolean {
    return this.socialService.isFollowing(pubkey);
  }
  
  public async followUser(pubkey: string): Promise<boolean> {
    return this.socialService.followUser(pubkey);
  }
  
  public async unfollowUser(pubkey: string): Promise<boolean> {
    return this.socialService.unfollowUser(pubkey);
  }
  
  public async sendDirectMessage(recipientPubkey: string, content: string): Promise<string | null> {
    return this.directMessageService.sendDirectMessage(recipientPubkey, content);
  }
  
  /**
   * React to a note with specific emoji (NIP-25)
   */
  public async reactToPost(eventId: string, emoji: string = "+"): Promise<string | null> {
    return this.socialService.reactToEvent(eventId, emoji);
  }
  
  /**
   * Repost a note (NIP-18)
   */
  public async repostNote(eventId: string, authorPubkey: string): Promise<string | null> {
    const connectedRelays = this.getConnectedRelayUrls();
    // Use first relay as hint
    const relayHint = connectedRelays.length > 0 ? connectedRelays[0] : null;
    
    return this.socialService.repostEvent(eventId, authorPubkey, relayHint);
  }

  // Utility methods for handling pubkeys
  public formatPubkey(pubkey: string): string {
    return this.userManager.formatPubkey(pubkey);
  }
  
  public getNpubFromHex(hexPubkey: string): string {
    return this.userManager.getNpubFromHex(hexPubkey);
  }
  
  public getHexFromNpub(npub: string): string {
    return this.userManager.getHexFromNpub(npub);
  }
  
  // Community methods - delegating to CommunityService
  public async fetchCommunity(communityId: string): Promise<any> {
    return this.communityService.fetchCommunity(communityId);
  }
  
  public async createCommunity(name: string, description: string): Promise<string | null> {
    // Return null since this is not implemented yet
    return null;
  }
  
  public async createProposal(
    communityId: string,
    title: string,
    description: string,
    options: string[],
    category: any,
    minQuorum?: number,
    endsAt?: number
  ): Promise<string | null> {
    // Return null since this is not implemented yet
    return null;
  }
  
  public async voteOnProposal(proposalId: string, optionIndex: number): Promise<string | null> {
    // Return null since this is not implemented yet
    return null;
  }
  
  // Bookmark methods - delegating to BookmarkService
  public async isBookmarked(eventId: string): Promise<boolean> {
    return this.bookmarkService.isBookmarked(eventId);
  }
  
  public async addBookmark(eventId: string, collectionId?: string, tags?: string[], note?: string): Promise<boolean> {
    return this.bookmarkService.addBookmark(eventId, collectionId, tags, note);
  }
  
  public async removeBookmark(eventId: string): Promise<boolean> {
    return this.bookmarkService.removeBookmark(eventId);
  }
  
  public async getBookmarks(): Promise<string[]> {
    return this.bookmarkService.getBookmarks();
  }
  
  public async getBookmarkCollections(): Promise<BookmarkCollection[]> {
    return this.bookmarkService.getBookmarkCollections();
  }
  
  public async getBookmarkMetadata(): Promise<BookmarkWithMetadata[]> {
    return this.bookmarkService.getBookmarkMetadata();
  }
  
  public async createBookmarkCollection(name: string, color?: string, description?: string): Promise<string | null> {
    return this.bookmarkService.createBookmarkCollection(name, color, description);
  }
  
  public async processPendingOperations(): Promise<void> {
    return this.bookmarkService.processPendingOperations();
  }
  
  // Profile methods - delegating to ProfileService
  public async getEvents(ids: string[]): Promise<any[]> {
    try {
      return Promise.all(ids.map(id => this.getEventById(id)));
    } catch (e) {
      console.error("Error getting events:", e);
      return [];
    }
  }
  
  public async getEventById(id: string): Promise<any> {
    return this.eventService.getEventById(id);
  }
  
  public async getProfilesByPubkeys(pubkeys: string[]): Promise<Record<string, any>> {
    return this.profileService.getProfilesByPubkeys(pubkeys);
  }
  
  public async getUserProfile(pubkey: string): Promise<any> {
    return this.profileService.getUserProfile(pubkey);
  }
  
  public async verifyNip05(identifier: string, expectedPubkey: string): Promise<boolean> {
    return this.profileService.verifyNip05(identifier, expectedPubkey);
  }
  
  // User Moderation (NIP-51) - delegating to UserModService
  public async muteUser(pubkey: string): Promise<boolean> {
    return this.userModService.muteUser(pubkey);
  }

  public async unmuteUser(pubkey: string): Promise<boolean> {
    return this.userModService.unmuteUser(pubkey);
  }

  public async isUserMuted(pubkey: string): Promise<boolean> {
    return this.userModService.isUserMuted(pubkey);
  }
  
  public async blockUser(pubkey: string): Promise<boolean> {
    return this.userModService.blockUser(pubkey);
  }

  public async unblockUser(pubkey: string): Promise<boolean> {
    return this.userModService.unblockUser(pubkey);
  }

  public async isUserBlocked(pubkey: string): Promise<boolean> {
    return this.userModService.isUserBlocked(pubkey);
  }
  
  // Private helper methods
  private async fetchFollowingList(): Promise<void> {
    if (!this.publicKey) return;
    
    try {
      await this.connectToRelays(["wss://relay.damus.io", "wss://relay.nostr.band", "wss://nos.lol"]);
      
      const filters = [
        {
          kinds: [EVENT_KINDS.CONTACTS],
          authors: [this.publicKey],
          limit: 1
        }
      ];
      
      const subId = this.subscribe(
        filters,
        (event) => {
          // Extract pubkeys from p tags
          const pubkeys = event.tags
            .filter(tag => tag.length >= 2 && tag[0] === 'p')
            .map(tag => tag[1]);
            
          this.userManager.setFollowing(pubkeys);
        }
      );
      
      // Cleanup subscription after a short time
      setTimeout(() => {
        this.unsubscribe(subId);
      }, 5000);
    } catch (error) {
      console.error("Error fetching following list:", error);
    }
  }
  
  private getConnectedRelayUrls(): string[] {
    return this.getRelayStatus()
      .filter(relay => relay.status === 'connected')
      .map(relay => relay.url);
  }
}

// Create and export a singleton instance
export const nostrService = new NostrService();
