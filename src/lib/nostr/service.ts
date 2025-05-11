
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
import { NostrServiceAdapter } from './service-adapter';

/**
 * Main Nostr service that coordinates all functionality and managers
 * Implementation follows the latest NIP standards
 */
class NostrService {
  private userManager: UserManager;
  public relayManager: RelayManager;
  private subscriptionManager: SubscriptionManager;
  private eventManager: EventManager;
  private socialManagerInstance: SocialManager;
  public communityManager: CommunityManager;
  public bookmarkManager: BookmarkManagerFacade;
  private pool: SimplePool;
  private adapter: NostrServiceAdapter;
  
  constructor() {
    // Initialize SimplePool first
    this.pool = new SimplePool();
    
    // Initialize managers
    this.userManager = new UserManager();
    this.relayManager = new RelayManager(this.pool);
    this.subscriptionManager = new SubscriptionManager(this.pool);
    this.eventManager = new EventManager();
    this.socialManagerInstance = new SocialManager(this.eventManager, this.userManager);
    this.communityManager = new CommunityManager(this.eventManager);
    this.bookmarkManager = new BookmarkManagerFacade(this.eventManager);
    
    // Initialize adapter
    this.adapter = new NostrServiceAdapter(this);
    
    // Load user data
    this.userManager.loadUserKeys();
    this.userManager.loadFollowing();
    
    // Connect to relays
    this.relayManager.connectToUserRelays();
    
    // Fetch following list and relay list if user is logged in
    if (this.publicKey) {
      this.fetchFollowingList();
    }
  }
  
  // Expose the adapter as getter
  get socialManager() {
    return this.socialManagerInstance;
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
  public async connectToRelays(relayUrls: string[]): Promise<void> {
    return this.relayManager.connectToRelays(relayUrls);
  }
  
  public async connectToUserRelays(): Promise<void> {
    return this.relayManager.connectToUserRelays();
  }
  
  public async addRelay(relayUrl: string, readWrite: boolean = true): Promise<boolean> {
    return this.relayManager.addRelay(relayUrl, readWrite);
  }
  
  public removeRelay(relayUrl: string): void {
    this.relayManager.removeRelay(relayUrl);
  }
  
  public getRelayStatus(): Relay[] {
    return this.relayManager.getRelayStatus();
  }
  
  // Method to get relays for a user
  public async getRelaysForUser(pubkey: string): Promise<string[]> {
    return this.relayManager.getRelaysForUser(pubkey);
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
    return this.socialManagerInstance.followUser(
      this.pool,
      pubkey,
      null, // We're not storing private keys
      connectedRelays
    );
  }
  
  public async unfollowUser(pubkey: string): Promise<boolean> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.socialManagerInstance.unfollowUser(
      this.pool,
      pubkey,
      null, // We're not storing private keys
      connectedRelays
    );
  }
  
  public async sendDirectMessage(recipientPubkey: string, content: string): Promise<string | null> {
    const connectedRelays = this.getConnectedRelayUrls();
    
    // Try to find recipient's preferred relays
    let recipientRelays: string[] = [];
    
    try {
      // Try to fetch relay preferences from relay list event
      recipientRelays = await this.getRelaysForUser(recipientPubkey);
    } catch (error) {
      console.error("Error finding recipient's relays:", error);
    }
    
    // Combine connected relays with recipient's relays
    const publishToRelays = Array.from(new Set([...connectedRelays, ...recipientRelays]));
    
    return this.socialManagerInstance.sendDirectMessage(
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
    return this.socialManagerInstance.reactToEvent(
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
    
    return this.socialManagerInstance.repostEvent(
      this.pool,
      eventId,
      authorPubkey,
      relayHint,
      this.publicKey,
      null, // We're not storing private keys
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
    return this.communityManager.fetchCommunity(this.pool, communityId, this.getConnectedRelayUrls());
  }
  
  public async createCommunity(name: string, description: string): Promise<string | null> {
    return this.communityManager.createCommunity(
      this.pool,
      name,
      description,
      this.publicKey,
      null, // We're not storing private keys
      this.getConnectedRelayUrls()
    );
  }
  
  public async createProposal(
    communityId: string,
    title: string,
    description: string,
    options: string[],
    category: ProposalCategory | string,
    minQuorum?: number,
    endsAt?: number
  ): Promise<string | null> {
    return this.communityManager.createProposal(
      this.pool,
      communityId,
      title,
      description,
      options,
      category as ProposalCategory,
      this.publicKey,
      null, // We're not storing private keys
      this.getConnectedRelayUrls(),
      minQuorum,
      endsAt
    );
  }
  
  public async voteOnProposal(proposalId: string, optionIndex: number): Promise<string | null> {
    return this.communityManager.voteOnProposal(
      this.pool,
      proposalId,
      optionIndex,
      this.publicKey,
      null, // We're not storing private keys
      this.getConnectedRelayUrls()
    );
  }
  
  // Bookmark methods
  public async isBookmarked(eventId: string): Promise<boolean> {
    return this.bookmarkManager.isBookmarked(eventId);
  }
  
  public async addBookmark(eventId: string, collectionId?: string, tags?: string[], note?: string): Promise<boolean> {
    return this.bookmarkManager.addBookmark(
      this.pool,
      eventId,
      this.publicKey,
      null, // We're not storing private keys
      this.getConnectedRelayUrls(),
      collectionId,
      tags,
      note
    );
  }
  
  public async removeBookmark(eventId: string): Promise<boolean> {
    return this.bookmarkManager.removeBookmark(
      this.pool,
      eventId,
      this.publicKey,
      null, // We're not storing private keys
      this.getConnectedRelayUrls()
    );
  }
  
  public async getBookmarks(): Promise<string[]> {
    return this.bookmarkManager.getBookmarks(
      this.pool,
      this.publicKey,
      this.getConnectedRelayUrls()
    );
  }
  
  public async getBookmarkCollections(): Promise<BookmarkCollection[]> {
    return this.bookmarkManager.getBookmarkCollections(
      this.pool,
      this.publicKey,
      this.getConnectedRelayUrls()
    );
  }
  
  public async getBookmarkMetadata(): Promise<BookmarkWithMetadata[]> {
    return this.bookmarkManager.getBookmarkMetadata(
      this.pool,
      this.publicKey,
      this.getConnectedRelayUrls()
    );
  }
  
  public async createBookmarkCollection(name: string, color?: string, description?: string): Promise<string | null> {
    return this.bookmarkManager.createBookmarkCollection(
      this.pool,
      name,
      this.publicKey,
      null, // We're not storing private keys
      this.getConnectedRelayUrls(),
      color,
      description
    );
  }
  
  public async processPendingOperations(): Promise<void> {
    return this.bookmarkManager.processPendingOperations(
      this.pool,
      this.publicKey,
      null, // We're not storing private keys
      this.getConnectedRelayUrls()
    );
  }
  
  public async getEvents(ids: string[]): Promise<any[]> {
    return this.eventManager.getEvents(
      this.pool,
      ids,
      this.getConnectedRelayUrls()
    );
  }
  
  public async getEventById(id: string): Promise<any> {
    return this.eventManager.getEventById(
      this.pool,
      id,
      this.getConnectedRelayUrls()
    );
  }
  
  public async getProfilesByPubkeys(pubkeys: string[]): Promise<Record<string, any>> {
    return this.eventManager.getProfilesByPubkeys(
      this.pool,
      pubkeys,
      this.getConnectedRelayUrls()
    );
  }
  
  // Profile methods
  public async getUserProfile(pubkey: string): Promise<any> {
    return this.eventManager.getUserProfile(
      this.pool,
      pubkey,
      this.getConnectedRelayUrls()
    );
  }
  
  public async verifyNip05(identifier: string, expectedPubkey: string): Promise<boolean> {
    return this.eventManager.verifyNip05(identifier, expectedPubkey);
  }
  
  private async fetchFollowingList(): Promise<void> {
    if (!this.publicKey) return;
    
    try {
      await this.connectToRelays(["wss://relay.damus.io", "wss://relay.nostr.band", "wss://nos.lol"]);
      
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
  
  private getConnectedRelayUrls(): string[] {
    return this.getRelayStatus()
      .filter(relay => relay.status === 'connected')
      .map(relay => relay.url);
  }
  
  // User Moderation (NIP-51)
  public async muteUser(pubkey: string): Promise<boolean> {
    // Implementation for muting a user
    try {
      const event = {
        kind: 10000,
        content: "",
        tags: [
          ["d", "mute-list"],
          ["p", pubkey]
        ]
      };
      
      const eventId = await this.publishEvent(event);
      return !!eventId;
    } catch (error) {
      console.error("Error muting user:", error);
      return false;
    }
  }

  public async unmuteUser(pubkey: string): Promise<boolean> {
    // Implementation for unmuting a user - publish updated list without the user
    try {
      // Get current mute list
      const mutedUsers = await this.getMutedUsers();
      const updatedList = mutedUsers.filter(p => p !== pubkey);
      
      // Create new replacement event
      const event = {
        kind: 10000,
        content: "",
        tags: [
          ["d", "mute-list"],
          ...updatedList.map(p => ["p", p])
        ]
      };
      
      const eventId = await this.publishEvent(event);
      return !!eventId;
    } catch (error) {
      console.error("Error unmuting user:", error);
      return false;
    }
  }

  public async isUserMuted(pubkey: string): Promise<boolean> {
    const mutedUsers = await this.getMutedUsers();
    return mutedUsers.includes(pubkey);
  }
  
  private async getMutedUsers(): Promise<string[]> {
    if (!this.publicKey) return [];
    
    try {
      return new Promise((resolve) => {
        const mutedUsers: string[] = [];
        
        // Subscribe to mute list events
        const subId = this.subscribe(
          [
            {
              kinds: [10000],
              authors: [this.publicKey],
              "#d": ["mute-list"]
            }
          ],
          (event) => {
            // Extract pubkeys from p tags
            const pubkeys = event.tags
              .filter(tag => tag.length >= 2 && tag[0] === 'p')
              .map(tag => tag[1]);
            
            mutedUsers.push(...pubkeys);
          }
        );
        
        // Resolve after short timeout
        setTimeout(() => {
          this.unsubscribe(subId);
          resolve([...new Set(mutedUsers)]);
        }, 2000);
      });
    } catch (error) {
      console.error("Error getting muted users:", error);
      return [];
    }
  }
  
  public async blockUser(pubkey: string): Promise<boolean> {
    // Implementation for blocking a user
    try {
      const event = {
        kind: 10000,
        content: "",
        tags: [
          ["d", "block-list"],
          ["p", pubkey]
        ]
      };
      
      const eventId = await this.publishEvent(event);
      return !!eventId;
    } catch (error) {
      console.error("Error blocking user:", error);
      return false;
    }
  }

  public async unblockUser(pubkey: string): Promise<boolean> {
    try {
      // Get current block list
      const blockedUsers = await this.getBlockedUsers();
      const updatedList = blockedUsers.filter(p => p !== pubkey);
      
      // Create new replacement event
      const event = {
        kind: 10000,
        content: "",
        tags: [
          ["d", "block-list"],
          ...updatedList.map(p => ["p", p])
        ]
      };
      
      const eventId = await this.publishEvent(event);
      return !!eventId;
    } catch (error) {
      console.error("Error unblocking user:", error);
      return false;
    }
  }

  public async isUserBlocked(pubkey: string): Promise<boolean> {
    const blockedUsers = await this.getBlockedUsers();
    return blockedUsers.includes(pubkey);
  }
  
  private async getBlockedUsers(): Promise<string[]> {
    if (!this.publicKey) return [];
    
    try {
      return new Promise((resolve) => {
        const blockedUsers: string[] = [];
        
        // Subscribe to block list events
        const subId = this.subscribe(
          [
            {
              kinds: [10000],
              authors: [this.publicKey],
              "#d": ["block-list"]
            }
          ],
          (event) => {
            // Extract pubkeys from p tags
            const pubkeys = event.tags
              .filter(tag => tag.length >= 2 && tag[0] === 'p')
              .map(tag => tag[1]);
            
            blockedUsers.push(...pubkeys);
          }
        );
        
        // Resolve after short timeout
        setTimeout(() => {
          this.unsubscribe(subId);
          resolve([...new Set(blockedUsers)]);
        }, 2000);
      });
    } catch (error) {
      console.error("Error getting blocked users:", error);
      return [];
    }
  }
}

export { NostrService };
