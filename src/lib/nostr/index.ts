
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
import { verifyNip05, fetchNip05Data } from './nip05';
import { toast } from 'sonner';
import type { ProposalCategory } from '@/types/community';
import type { BookmarkCollection, BookmarkWithMetadata } from './bookmark';

class NostrService {
  private userManager: UserManager;
  public relayManager: RelayManager;
  private subscriptionManager: SubscriptionManager;
  private eventManager: EventManager;
  public socialManager: SocialManager; // Changed to public for NIP implementation
  private communityManager: CommunityManager;
  private bookmarkManager: BookmarkManager;
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
  
  public async signOut(): Promise<void> {
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

  /**
   * Fetch a community by its ID
   * @param communityId - The ID of the community to fetch
   * @returns Promise resolving to community data or null if not found
   */
  public async fetchCommunity(communityId: string): Promise<{
    id: string;
    name: string;
    description: string;
    image: string;
    creator: string;
    createdAt: number;
    members: string[];
    uniqueId: string;
  } | null> {
    if (!communityId) return null;
    
    try {
      const connectedRelays = this.getConnectedRelayUrls();
      if (connectedRelays.length === 0) {
        await this.connectToDefaultRelays();
      }
      
      return new Promise((resolve) => {
        const subId = this.subscribe(
          [
            {
              kinds: [EVENT_KINDS.COMMUNITY],
              ids: [communityId],
              limit: 1
            }
          ],
          (event) => {
            try {
              // Parse content and extract community data
              const content = JSON.parse(event.content);
              
              // Get members from p tags
              const members = event.tags
                .filter(tag => tag.length >= 2 && tag[0] === 'p')
                .map(tag => tag[1]);
              
              // Extract unique identifier from d tag
              const dTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'd');
              const uniqueId = dTag ? dTag[1] : '';
              
              // Construct community object
              const community = {
                id: event.id,
                name: content.name || '',
                description: content.description || '',
                image: content.image || '',
                creator: content.creator || event.pubkey,
                createdAt: content.createdAt || event.created_at,
                members,
                uniqueId
              };
              
              resolve(community);
              
              // Cleanup subscription after receiving the community
              setTimeout(() => {
                this.unsubscribe(subId);
              }, 100);
            } catch (e) {
              console.error("Error parsing community:", e);
              resolve(null);
            }
          }
        );
        
        // Set a timeout to resolve with null if no community is found
        setTimeout(() => {
          this.unsubscribe(subId);
          resolve(null);
        }, 5000);
      });
    } catch (error) {
      console.error("Error fetching community:", error);
      return null;
    }
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
      // First try to get profile for potential NIP-05 identifier
      const profile = await this.getUserProfile(recipientPubkey);
      
      if (profile?.nip05) {
        // If recipient has NIP-05, try to fetch relay preferences from it
        const nip05Data = await this.fetchNip05Data(profile.nip05);
        if (nip05Data?.relays) {
          recipientRelays = Object.keys(nip05Data.relays);
        }
      }
      
      // If no relays found yet, try to find a kind:10050 relay list event
      if (recipientRelays.length === 0) {
        recipientRelays = await this.getRelaysForUser(recipientPubkey);
      }
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
  
  // Community features
  public async createCommunity(name: string, description: string): Promise<string | null> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.communityManager.createCommunity(
      this.pool,
      name,
      description,
      this.publicKey,
      null, // We're not storing private keys
      connectedRelays
    );
  }
  
  public async createProposal(
    communityId: string, 
    title: string, 
    description: string, 
    options: string[],
    category?: ProposalCategory,
    minQuorum?: number,
    endsAt?: number
  ): Promise<string | null> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.communityManager.createProposal(
      this.pool,
      communityId,
      title,
      description,
      options,
      this.publicKey,
      null, // We're not storing private keys
      connectedRelays,
      category || 'other',
      minQuorum,
      endsAt
    );
  }
  
  public async voteOnProposal(proposalId: string, optionIndex: number): Promise<string | null> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.communityManager.voteOnProposal(
      this.pool,
      proposalId,
      optionIndex,
      this.publicKey,
      null, // We're not storing private keys
      connectedRelays
    );
  }

  // Utility methods
  public formatPubkey(pubkey: string, format: 'hex' | 'npub' = 'npub'): string {
    return this.userManager.formatPubkey(pubkey, format);
  }
  
  public getNpubFromHex(hex: string): string {
    return this.userManager.getNpubFromHex(hex);
  }
  
  public getHexFromNpub(npub: string): string {
    return this.userManager.getHexFromNpub(npub);
  }
  
  // Add getUserProfile method with improved implementation
  public async getUserProfile(pubkey: string): Promise<{
    name?: string;
    display_name?: string;
    picture?: string;
    nip05?: string;
    about?: string;
    banner?: string;
    website?: string;
    lud16?: string;
    [key: string]: any;
  } | null> {
    if (!pubkey) return null;
    
    try {
      const connectedRelays = this.getConnectedRelayUrls();
      if (connectedRelays.length === 0) {
        await this.connectToDefaultRelays();
      }
      
      return new Promise((resolve) => {
        const subId = this.subscribe(
          [
            {
              kinds: [EVENT_KINDS.META],
              authors: [pubkey],
              limit: 1
            }
          ],
          (event) => {
            try {
              const profile = JSON.parse(event.content);
              // Store the raw event tags for NIP-39 verification
              if (Array.isArray(event.tags) && event.tags.length > 0) {
                profile.tags = event.tags;
              }
              resolve(profile);
              
              // Cleanup subscription after receiving the profile
              setTimeout(() => {
                this.unsubscribe(subId);
              }, 100);
            } catch (e) {
              console.error("Error parsing profile:", e);
              resolve(null);
            }
          }
        );
        
        // Set a timeout to resolve with null if no profile is found
        setTimeout(() => {
          this.unsubscribe(subId);
          resolve(null);
        }, 5000);
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  /**
   * Verify a NIP-05 identifier and check if it matches the expected pubkey
   * @param identifier - NIP-05 identifier in the format username@domain.com
   * @param expectedPubkey - The pubkey that should match the NIP-05 identifier
   * @returns True if the NIP-05 identifier resolves to the expected pubkey
   */
  public async verifyNip05(identifier: string, expectedPubkey: string): Promise<boolean> {
    const pubkey = await verifyNip05(identifier);
    return pubkey !== null && pubkey === expectedPubkey;
  }

  /**
   * Fetch additional data associated with a NIP-05 identifier
   * @param identifier - NIP-05 identifier in the format username@domain.com
   * @returns NIP-05 data including relays
   */
  public async fetchNip05Data(identifier: string): Promise<{
    relays?: Record<string, { read: boolean; write: boolean }>;
    [key: string]: any;
  } | null> {
    return fetchNip05Data(identifier);
  }
  
  // Bookmark methods
  async addBookmark(
    eventId: string, 
    collectionId?: string,
    tags?: string[],
    note?: string
  ): Promise<boolean> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.bookmarkManager.addBookmark(
      this.pool,
      this.publicKey,
      null, // We're not storing private keys
      eventId,
      connectedRelays,
      collectionId,
      tags,
      note
    );
  }
  
  async removeBookmark(eventId: string): Promise<boolean> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.bookmarkManager.removeBookmark(
      this.pool,
      this.publicKey,
      null, // We're not storing private keys
      eventId,
      connectedRelays
    );
  }
  
  async getBookmarks(): Promise<string[]> {
    if (!this.publicKey) return [];
    const connectedRelays = this.getConnectedRelayUrls();
    return this.bookmarkManager.getBookmarkList(
      this.pool,
      this.publicKey,
      connectedRelays
    );
  }
  
  async isBookmarked(eventId: string): Promise<boolean> {
    if (!this.publicKey) return false;
    const connectedRelays = this.getConnectedRelayUrls();
    return this.bookmarkManager.isBookmarked(
      this.pool,
      this.publicKey,
      eventId,
      connectedRelays
    );
  }

  // Collection methods
  async createBookmarkCollection(
    name: string,
    color?: string,
    description?: string
  ): Promise<string | null> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.bookmarkManager.createCollection(
      this.pool,
      this.publicKey,
      null, // We're not storing private keys
      name,
      connectedRelays,
      color,
      description
    );
  }

  async updateBookmarkCollection(
    collectionId: string,
    updates: Partial<BookmarkCollection>
  ): Promise<boolean> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.bookmarkManager.updateCollection(
      this.pool,
      this.publicKey,
      null, // We're not storing private keys
      collectionId,
      updates,
      connectedRelays
    );
  }

  async deleteBookmarkCollection(collectionId: string): Promise<boolean> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.bookmarkManager.deleteCollection(
      this.pool,
      this.publicKey,
      null, // We're not storing private keys
      collectionId,
      connectedRelays
    );
  }

  async getBookmarkCollections(): Promise<BookmarkCollection[]> {
    if (!this.publicKey) return [];
    const connectedRelays = this.getConnectedRelayUrls();
    return this.bookmarkManager.getCollections(
      this.pool,
      this.publicKey,
      connectedRelays
    );
  }

  // Metadata methods
  async updateBookmarkMetadata(
    eventId: string,
    collectionId?: string,
    tags?: string[],
    note?: string
  ): Promise<boolean> {
    const connectedRelays = this.getConnectedRelayUrls();
    return this.bookmarkManager.updateBookmarkMetadata(
      this.pool,
      this.publicKey,
      null, // We're not storing private keys
      eventId,
      connectedRelays,
      collectionId,
      tags,
      note
    );
  }

  async getBookmarkMetadata(): Promise<BookmarkWithMetadata[]> {
    if (!this.publicKey) return [];
    const connectedRelays = this.getConnectedRelayUrls();
    return this.bookmarkManager.getBookmarkMetadata(
      this.pool,
      this.publicKey,
      connectedRelays
    );
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

// Create singleton instance
const nostrService = new NostrService();
export { nostrService };

// Re-export types from internal modules
// Fix: Use 'export type' instead of 'export' for type re-exports
export type { NostrEvent, Relay } from './types';
export type { NostrProfileMetadata } from './types';
export { EVENT_KINDS } from './constants';

// Re-export from social module
export { SocialManager } from './social';
export type { ReactionCounts, ContactList } from './social/types';

// Re-export from community module
export type { ProposalCategory } from '@/types/community';

// Re-export from bookmark module
export type { BookmarkCollection, BookmarkWithMetadata } from './bookmark';
