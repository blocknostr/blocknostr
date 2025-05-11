import { SimplePool } from 'nostr-tools';
import { NostrEvent, Relay } from './types';
import { EVENT_KINDS } from './constants';
import { UserManager } from './user';
import { RelayManager } from './relay';
import { SubscriptionManager } from './subscription';
import { EventManager } from './event';
import { SocialManager } from './social';
import { CommunityManager } from './community';
import { BookmarkManagerFacade } from './bookmark';
import { toast } from 'sonner';
import type { ProposalCategory } from '@/types/community';
import type { BookmarkCollection, BookmarkWithMetadata } from './bookmark';
import { formatPubkey, getHexFromNpub, getNpubFromHex } from './utils/keys';
import { ProfileService } from './services/profile-service';
import { CommunityService } from './services/community-service';
import { BookmarkService } from './services/bookmark-service';
import { ThreadService } from './services/thread/thread-service';
import { SocialInteractionService } from './services/social-interaction-service';

/**
 * Main Nostr service that coordinates all functionality and managers
 * Implementation follows the latest NIP standards
 */
class NostrService {
  private userManager: UserManager;
  public relayManager: RelayManager;
  private subscriptionManager: SubscriptionManager;
  private eventManager: EventManager;
  public socialManager: SocialManager;
  public communityManager: CommunityManager;
  public bookmarkManager: BookmarkManagerFacade;
  private pool: SimplePool;
  private profileService: ProfileService;
  private communityService: CommunityService;
  private bookmarkService: BookmarkService;
  private threadService: ThreadService;
  private socialInteractionService: SocialInteractionService;
  
  constructor() {
    // Initialize SimplePool first
    this.pool = new SimplePool();
    
    // Initialize managers
    this.userManager = new UserManager();
    this.relayManager = new RelayManager(this.pool);
    this.subscriptionManager = new SubscriptionManager(this.pool);
    this.eventManager = new EventManager();
    this.socialManager = new SocialManager(this.eventManager, this.userManager);
    this.communityManager = new CommunityManager(this.eventManager);
    this.bookmarkManager = new BookmarkManagerFacade(this.eventManager);
    
    // Initialize services
    this.profileService = new ProfileService(
      this.pool,
      this.getConnectedRelayUrls.bind(this)
    );
    
    this.communityService = new CommunityService(
      this.communityManager,
      this.getConnectedRelayUrls.bind(this),
      this.pool,
      this.userManager.publicKey
    );
    
    this.initBookmarkService();
    
    // Initialize the thread service
    this.threadService = new ThreadService(
      this.pool,
      this.getConnectedRelayUrls.bind(this)
    );
    
    // Initialize the social interaction service
    this.socialInteractionService = new SocialInteractionService(
      this.pool,
      () => this.userManager.publicKey,
      this.getConnectedRelayUrls.bind(this)
    );
    
    // Load user data
    this.userManager.loadUserKeys();
    this.userManager.loadFollowing();
    
    // Connect to relays
    this.relayManager.connectToUserRelays();
    
    // Fetch following list and relay list if user is logged in
    if (this.publicKey) {
      this.fetchFollowingList();
      this.fetchRelayList(); // Add relay list fetching for NIP-65
    }
  }

  private initBookmarkService() {
    // Create the bookmark manager using the event manager
    const bookmarkManager = new BookmarkManagerFacade(this.eventManager);
    
    // Initialize the bookmark service with the manager
    this.bookmarkService = new BookmarkService(
      bookmarkManager,
      this.pool,
      this.publicKey,
      this.getConnectedRelayUrls.bind(this),
      this.connectToUserRelays.bind(this)
    );
  }

  // Public API for user management
  get publicKey(): string | null {
    return this.userManager.publicKey;
  }
  
  get following(): string[] {
    return this.userManager.following;
  }
  
  get userRelays(): Map<string, boolean> {
    return this.relayManager.userRelays;
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

  // Relay management
  public async connectToDefaultRelays(): Promise<void> {
    await this.relayManager.connectToDefaultRelays();
  }
  
  public async connectToUserRelays(): Promise<void> {
    await this.relayManager.connectToUserRelays();
  }
  
  public async addRelay(relayUrl: string, readWrite: boolean = true): Promise<boolean> {
    const success = await this.relayManager.addRelay(relayUrl, readWrite);
    if (success) {
      // Publish relay list to network
      await this.publishRelayList();
    }
    return success;
  }
  
  public removeRelay(relayUrl: string): void {
    this.relayManager.removeRelay(relayUrl);
    // Publish updated relay list
    this.publishRelayList();
  }
  
  public getRelayStatus(): Relay[] {
    return this.relayManager.getRelayStatus();
  }
  
  // Method to add multiple relays at once
  public async addMultipleRelays(relayUrls: string[]): Promise<number> {
    return this.relayManager.addMultipleRelays(relayUrls);
  }
  
  // Method to get relays for a user
  public async getRelaysForUser(pubkey: string): Promise<string[]> {
    return new Promise((resolve) => {
      const relays: string[] = [];
      
      // Subscribe to relay list event
      const subId = this.subscribe(
        [
          {
            kinds: [EVENT_KINDS.RELAY_LIST],
            authors: [pubkey],
            limit: 1
          }
        ],
        (event) => {
          // Extract relay URLs from r tags
          const relayTags = event.tags.filter(tag => tag[0] === 'r' && tag.length >= 2);
          relayTags.forEach(tag => {
            if (tag[1] && typeof tag[1] === 'string') {
              relays.push(tag[1]);
            }
          });
        }
      );
      
      // Set a timeout to resolve with found relays
      setTimeout(() => {
        this.unsubscribe(subId);
        resolve(relays);
      }, 3000);
    });
  }

  // Event publication
  public async publishEvent(event: Partial<NostrEvent>): Promise<string | null> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.eventManager.publishEvent(
      this.pool,
      this.publicKey,
      null, // We're not storing private keys
      event,
      connectedRelays
    );
  }
  
  public async publishProfileMetadata(metadata: Record<string, any>): Promise<boolean> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.eventManager.publishProfileMetadata(
      this.pool,
      this.publicKey,
      null, // We're not storing private keys
      metadata,
      connectedRelays
    );
  }
  
  // Subscription management
  public subscribe(
    filters: { kinds?: number[], authors?: string[], since?: number, limit?: number, ids?: string[], '#p'?: string[], '#e'?: string[] }[],
    onEvent: (event: NostrEvent) => void
  ): string {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.subscriptionManager.subscribe(connectedRelays, filters, onEvent);
  }
  
  public unsubscribe(subId: string): void {
    this.subscriptionManager.unsubscribe(subId);
  }
  
  // Social features
  public isFollowing(pubkey: string): boolean {
    return this.userManager.isFollowing(pubkey);
  }
  
  public async followUser(pubkey: string): Promise<boolean> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.socialManager.followUser(
      this.pool,
      pubkey,
      null, // We're not storing private keys
      connectedRelays
    );
  }
  
  public async unfollowUser(pubkey: string): Promise<boolean> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.socialManager.unfollowUser(
      this.pool,
      pubkey,
      null, // We're not storing private keys
      connectedRelays
    );
  }
  
  public async sendDirectMessage(recipientPubkey: string, content: string): Promise<string | null> {
    const connectedRelays = this.getConnectedRelayUrls();
    
    // Try to find recipient's preferred relays via NIP-05 or kind:10050 event
    let recipientRelays: string[] = [];
    
    try {
      // Try to fetch relay preferences from relay list event
      recipientRelays = await this.getRelaysForUser(recipientPubkey);
    } catch (error) {
      console.error("Error finding recipient's relays:", error);
    }
    
    // Combine connected relays with recipient's relays
    const publishToRelays = Array.from(new Set([...connectedRelays, ...recipientRelays]));
    
    return this.socialManager.sendDirectMessage(
      this.pool,
      recipientPubkey,
      content,
      this.publicKey,
      null, // We're not storing private keys
      publishToRelays.length > 0 ? publishToRelays : connectedRelays
    );
  }
  
  /**
   * React to a note with specific emoji (NIP-25)
   */
  public async reactToPost(eventId: string, emoji: string = "+"): Promise<string | null> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.socialManager.reactToEvent(
      this.pool,
      eventId,
      emoji,
      this.publicKey,
      null, // We're not storing private keys
      connectedRelays
    );
  }
  
  /**
   * Repost a note (NIP-18)
   */
  public async repostNote(eventId: string, authorPubkey: string): Promise<string | null> {
    const connectedRelays = this.getConnectedRelayUrls();
    // Use first relay as hint
    const relayHint = connectedRelays.length > 0 ? connectedRelays[0] : null;
    
    return this.socialManager.repostEvent(
      this.pool,
      eventId,
      authorPubkey,
      relayHint,
      this.publicKey,
      null, // We're not storing private keys
      connectedRelays
    );
  }
  
  /**
   * Get reaction counts for an event (NIP-25)
   */
  public async getReactionCounts(eventId: string): Promise<{
    likes: number,
    reposts: number,
    userHasLiked: boolean,
    userHasReposted: boolean,
    likers: string[]
  }> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.socialManager.getReactionCounts(
      this.pool,
      eventId,
      connectedRelays
    );
  }

  // Utility methods for handling pubkeys
  public formatPubkey(pubkey: string): string {
    return formatPubkey(pubkey);
  }
  
  public getNpubFromHex(hexPubkey: string): string {
    return getNpubFromHex(hexPubkey);
  }
  
  public getHexFromNpub(npub: string): string {
    return getHexFromNpub(npub);
  }
  
  // Community methods
  public async fetchCommunity(communityId: string): Promise<any> {
    return this.communityService.fetchCommunity(communityId);
  }
  
  public async createCommunity(name: string, description: string): Promise<string | null> {
    return this.communityService.createCommunity(name, description);
  }
  
  public async createProposal(
    communityId: string,
    title: string,
    description: string,
    options: string[],
    category: string,
    minQuorum?: number,
    endsAt?: number
  ): Promise<string | null> {
    return this.communityService.createProposal(
      communityId,
      title,
      description,
      options,
      category as ProposalCategory,
      minQuorum,
      endsAt
    );
  }
  
  public async voteOnProposal(proposalId: string, optionIndex: number): Promise<string | null> {
    return this.communityService.voteOnProposal(proposalId, optionIndex);
  }
  
  // Bookmark methods
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
  
  public async getEvents(ids: string[]): Promise<any[]> {
    const relays = this.getConnectedRelayUrls();
    return this.eventManager.getEvents(ids, relays);
  }
  
  public async getProfilesByPubkeys(pubkeys: string[]): Promise<Record<string, any>> {
    const relays = this.getConnectedRelayUrls();
    return this.profileService.getProfilesByPubkeys(pubkeys, this.pool, relays);
  }
  
  // Profile methods
  public async getUserProfile(pubkey: string): Promise<any> {
    return this.profileService.getUserProfile(pubkey);
  }
  
  public async verifyNip05(identifier: string, expectedPubkey: string): Promise<boolean> {
    return this.profileService.verifyNip05(identifier, expectedPubkey);
  }
  
  public async fetchNip05Data(identifier: string): Promise<any> {
    return this.profileService.fetchNip05Data(identifier);
  }
  
  private async fetchFollowingList(): Promise<void> {
    if (!this.publicKey) return;
    
    try {
      await this.connectToDefaultRelays();
      
      const subId = this.subscribe(
        [
          {
            kinds: [EVENT_KINDS.CONTACTS],
            authors: [this.publicKey],
            limit: 1
          }
        ],
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
  
  /**
   * Publish user's relay list to the network (NIP-65)
   */
  private async publishRelayList(): Promise<string | null> {
    if (!this.publicKey) return null;
    
    // Prepare relay tags with read/write permissions per NIP-65
    const relayList = Array.from(this.userRelays.entries()).map(
      ([url, readWrite]) => {
        // Format: ["r", <relay-url>, <relay-mode>]
        // Where relay-mode is: "read", "write", or undefined for both read+write
        let mode: string | undefined;
        if (readWrite) {
          // Both read and write, use undefined (cleaner JSON)
          mode = undefined;
        } else {
          // Read-only relay
          mode = "read";
        }
        
        return mode ? ['r', url, mode] : ['r', url];
      }
    );
    
    const event = {
      kind: EVENT_KINDS.RELAY_LIST,
      content: '',
      tags: relayList
    };
    
    return await this.publishEvent(event);
  }
  
  private async fetchRelayList(): Promise<void> {
    if (!this.publicKey) return;
    
    try {
      await this.connectToDefaultRelays();
      
      const subId = this.subscribe(
        [
          {
            kinds: [EVENT_KINDS.RELAY_LIST],
            authors: [this.publicKey],
            limit: 1
          }
        ],
        (event) => {
          // Process NIP-65 relay list
          const relayMap = new Map<string, boolean>();
          
          // Extract relay URLs and read/write settings from r tags
          event.tags.forEach(tag => {
            if (Array.isArray(tag) && tag[0] === 'r' && tag.length >= 2) {
              const relayUrl = tag[1];
              // Check the relay permission mode
              // If tag[2] is missing or not "read", it's considered read+write
              const isReadWrite = tag.length < 3 || tag[2] !== "read";
              relayMap.set(relayUrl, isReadWrite);
            }
          });
          
          // Update relay manager with fetched relays
          if (relayMap.size > 0) {
            this.relayManager.setUserRelays(relayMap);
          }
        }
      );
      
      // Cleanup subscription after a short time
      setTimeout(() => {
        this.unsubscribe(subId);
      }, 5000);
    } catch (error) {
      console.error("Error fetching relay list:", error);
    }
  }
  
  private getConnectedRelayUrls(): string[] {
    return this.getRelayStatus()
      .filter(relay => relay.status === 'connected')
      .map(relay => relay.url);
  }
  
  // Thread methods for NIP-10 support
  public async fetchThread(eventId: string): Promise<{
    rootEvent: NostrEvent | null;
    parentEvent: NostrEvent | null;
    replies: NostrEvent[];
  }> {
    return this.threadService.fetchThread(eventId);
  }
  
  public getThreadRootId(event: NostrEvent): string | null {
    return this.threadService.getThreadRootId(event);
  }
  
  public getParentId(event: NostrEvent): string | null {
    return this.threadService.getParentId(event);
  }
  
  // New social interaction methods
  public async muteUser(pubkey: string): Promise<boolean> {
    return this.socialInteractionService.muteUser(pubkey);
  }

  public async unmuteUser(pubkey: string): Promise<boolean> {
    return this.socialInteractionService.unmuteUser(pubkey);
  }

  public async isUserMuted(pubkey: string): Promise<boolean> {
    return this.socialInteractionService.isUserMuted(pubkey);
  }

  public async blockUser(pubkey: string): Promise<boolean> {
    return this.socialInteractionService.blockUser(pubkey);
  }

  public async unblockUser(pubkey: string): Promise<boolean> {
    return this.socialInteractionService.unblockUser(pubkey);
  }

  public async isUserBlocked(pubkey: string): Promise<boolean> {
    return this.socialInteractionService.isUserBlocked(pubkey);
  }
  
  /**
   * Get relay information document using NIP-11
   * @param relayUrl URL of the relay
   * @returns Promise resolving to relay information or null
   */
  public async getRelayInformation(relayUrl: string): Promise<any> {
    // Use the relay info service from the RelayManager
    return this.relayManager.getRelayInformation(relayUrl);
  }
  
  /**
   * Check if a relay supports a specific NIP
   * @param relayUrl URL of the relay
   * @param nipNumber NIP number to check
   * @returns Promise resolving to boolean indicating support
   */
  public async doesRelaySupport(relayUrl: string, nipNumber: number): Promise<boolean> {
    return this.relayManager.doesRelaySupport(relayUrl, nipNumber);
  }
  
  /**
   * Get all relays that support a specific NIP
   * @param nipNumber NIP number to check
   * @returns Promise resolving to array of relay URLs
   */
  public async getRelaysSupportingNIP(nipNumber: number): Promise<string[]> {
    const relayStatus = this.getRelayStatus();
    const results = await Promise.all(
      relayStatus
        .filter(r => r.status === 'connected')
        .map(async relay => {
          const supports = await this.doesRelaySupport(relay.url, nipNumber);
          return { url: relay.url, supports };
        })
    );
    
    return results.filter(r => r.supports).map(r => r.url);
  }
}

export { NostrService };
