
import { SimplePool } from 'nostr-tools';
import { NostrEvent, Relay } from './types';
import { EVENT_KINDS } from './constants';
import { UserManager } from './user';
import { RelayManager } from './relay';
import { SubscriptionManager } from './subscription';
import { EventManager } from './event';
import { SocialManager } from './social';
import { CommunityManager } from './community';
import { BookmarkManager } from './bookmark';
import { toast } from 'sonner';
import type { ProposalCategory } from '@/types/community';
import type { BookmarkCollection, BookmarkWithMetadata } from './bookmark';
import { formatPubkey, getHexFromNpub, getNpubFromHex } from './utils/keys';

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
  public bookmarkManager: BookmarkManager;
  private pool: SimplePool;
  
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
    this.bookmarkManager = new BookmarkManager(this.eventManager);
    
    // Load user data
    this.userManager.loadUserKeys();
    this.userManager.loadFollowing();
    
    // Connect to relays
    this.relayManager.connectToUserRelays();
    
    // Fetch following list if user is logged in
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
    const connectedRelays = this.getConnectedRelayUrls();
    return this.communityManager.fetchCommunity(communityId, this.pool, connectedRelays);
  }
  
  public async createCommunity(name: string, description: string): Promise<string | null> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.communityManager.createCommunity(
      name, 
      description, 
      this.publicKey, 
      connectedRelays,
      this.pool
    );
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
    const connectedRelays = this.getConnectedRelayUrls();
    return this.communityManager.createProposal(
      communityId,
      title,
      description,
      options,
      this.publicKey,
      connectedRelays,
      category as ProposalCategory,
      minQuorum,
      endsAt,
      this.pool
    );
  }
  
  public async voteOnProposal(proposalId: string, optionIndex: number): Promise<string | null> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.communityManager.voteOnProposal(
      proposalId,
      optionIndex,
      this.publicKey,
      connectedRelays,
      this.pool
    );
  }
  
  // Bookmark methods
  public async isBookmarked(eventId: string): Promise<boolean> {
    return this.bookmarkManager.isBookmarked(eventId);
  }
  
  public async addBookmark(eventId: string, collectionId?: string, tags?: string[], note?: string): Promise<boolean> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.bookmarkManager.addBookmark(
      eventId, 
      this.publicKey, 
      null, // We're not storing private keys
      connectedRelays,
      this.pool,
      collectionId, 
      tags, 
      note
    );
  }
  
  public async removeBookmark(eventId: string): Promise<boolean> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.bookmarkManager.removeBookmark(
      eventId, 
      this.publicKey, 
      null, // We're not storing private keys
      connectedRelays,
      this.pool
    );
  }
  
  public async getBookmarks(): Promise<string[]> {
    return this.bookmarkManager.getBookmarks(this.publicKey);
  }
  
  public async getBookmarkCollections(): Promise<BookmarkCollection[]> {
    return this.bookmarkManager.getBookmarkCollections(this.publicKey);
  }
  
  public async getBookmarkMetadata(): Promise<BookmarkWithMetadata[]> {
    return this.bookmarkManager.getBookmarkMetadata(this.publicKey);
  }
  
  public async createBookmarkCollection(name: string, color?: string, description?: string): Promise<string | null> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.bookmarkManager.createBookmarkCollection(
      name,
      this.publicKey,
      null, // We're not storing private keys
      connectedRelays,
      this.pool,
      color,
      description
    );
  }
  
  // Profile methods
  public async getUserProfile(pubkey: string): Promise<any> {
    // Create a new instance of ProfileService
    const profileService = new ProfileService(
      this.pool,
      this.getConnectedRelayUrls.bind(this)
    );
    return profileService.getUserProfile(pubkey);
  }
  
  public async verifyNip05(identifier: string, expectedPubkey: string): Promise<boolean> {
    const profileService = new ProfileService(
      this.pool,
      this.getConnectedRelayUrls.bind(this)
    );
    return profileService.verifyNip05(identifier, expectedPubkey);
  }
  
  public async fetchNip05Data(identifier: string): Promise<any> {
    const profileService = new ProfileService(
      this.pool,
      this.getConnectedRelayUrls.bind(this)
    );
    return profileService.fetchNip05Data(identifier);
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
  
  private async publishRelayList(): Promise<string | null> {
    if (!this.publicKey) return null;
    
    const relayList = Array.from(this.userRelays.entries()).map(
      ([url, readWrite]) => ['r', url, readWrite ? 'read write' : 'read']
    );
    
    const event = {
      kind: EVENT_KINDS.RELAY_LIST,
      content: '',
      tags: relayList
    };
    
    return await this.publishEvent(event);
  }
  
  private getConnectedRelayUrls(): string[] {
    return this.getRelayStatus()
      .filter(relay => relay.status === 'connected')
      .map(relay => relay.url);
  }
}

export { NostrService };
