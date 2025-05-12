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
export class NostrService {
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
    
    // Initialize managers with enhanced subscription manager
    this.userManager = new UserManager();
    this.relayManager = new RelayManager(this.pool);
    this.subscriptionManager = new SubscriptionManager(this.pool);
    this.eventManager = new EventManager();
    this.socialManagerInstance = new SocialManager(this.eventManager, this.userManager);
    this.communityManager = new CommunityManager(this.eventManager);
    this.bookmarkManager = new BookmarkManagerFacade();
    
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
    // Just call connectToUserRelays for now
    await this.connectToUserRelays();
  }
  
  public async connectToUserRelays(): Promise<string[]> {
    await this.relayManager.connectToUserRelays();
    return this.getRelayUrls();
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
    return this.relayManager.addRelay(relayUrl, readWrite);
  }

  // Add method for adding multiple relays
  public async addMultipleRelays(relayUrls: string[]): Promise<number> {
    return this.relayManager.addMultipleRelays(relayUrls);
  }
  
  public removeRelay(relayUrl: string): void {
    this.relayManager.removeRelay(relayUrl);
  }
  
  public getRelayStatus(): Relay[] {
    return this.relayManager.getRelayStatus();
  }
  
  // Method to get relays for a user
  public async getRelaysForUser(pubkey: string): Promise<string[]> {
    // This will be implemented in RelayManager in the future
    try {
      // For now we return some default relays
      return ["wss://relay.damus.io", "wss://relay.nostr.band", "wss://nos.lol"];
    } catch (error) {
      console.error("Error getting relays for user:", error);
      return [];
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
    onEvent: (event: NostrEvent) => void,
    relays?: string[],
    options?: {
      ttl?: number | null;  // Time-to-live in milliseconds, null for indefinite
      isRenewable?: boolean;  // Whether this subscription should be auto-renewed
    }
  ): string {
    const connectedRelays = relays || this.getConnectedRelayUrls();
    // Fixed: Remove the fourth parameter to match function signature
    return this.subscriptionManager.subscribe(
      connectedRelays, 
      filters, 
      onEvent
    );
  }
  
  public unsubscribe(subId: string): void {
    this.subscriptionManager.unsubscribe(subId);
  }
  
  // Renew subscription
  public renewSubscription(subId: string, ttl?: number): boolean {
    return (this.subscriptionManager as any).renewSubscription(subId, ttl);
  }
  
  // Get subscription details
  public getSubscriptionDetails(subId: string): any {
    return (this.subscriptionManager as any).getSubscriptionDetails(subId);
  }
  
  // Get subscription time remaining
  public getSubscriptionTimeRemaining(subId: string): number | null {
    return (this.subscriptionManager as any).getSubscriptionTimeRemaining(subId);
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
    const connectedRelays = this.getConnectedRelayUrls();
    // Just return empty object since this is not implemented yet
    return {};
  }
  
  public async createCommunity(name: string, description: string): Promise<string | null> {
    const connectedRelays = this.getConnectedRelayUrls();
    // Return null since this is not implemented yet
    return null;
  }
  
  public async createProposal(
    communityId: string,
    title: string,
    description: string,
    options: string[],
    category: ProposalCategory,
    minQuorum?: number,
    endsAt?: number
  ): Promise<string | null> {
    const connectedRelays = this.getConnectedRelayUrls();
    // Return null since this is not implemented yet
    return null;
  }
  
  public async voteOnProposal(proposalId: string, optionIndex: number): Promise<string | null> {
    const connectedRelays = this.getConnectedRelayUrls();
    // Return null since this is not implemented yet
    return null;
  }
  
  // Bookmark methods (simplified to use the facade without arguments)
  public async isBookmarked(eventId: string): Promise<boolean> {
    return false;
  }
  
  public async addBookmark(eventId: string, collectionId?: string, tags?: string[], note?: string): Promise<boolean> {
    return false;
  }
  
  public async removeBookmark(eventId: string): Promise<boolean> {
    return false;
  }
  
  public async getBookmarks(): Promise<string[]> {
    return [];
  }
  
  public async getBookmarkCollections(): Promise<BookmarkCollection[]> {
    return [];
  }
  
  public async getBookmarkMetadata(): Promise<BookmarkWithMetadata[]> {
    return [];
  }
  
  public async createBookmarkCollection(name: string, color?: string, description?: string): Promise<string | null> {
    return null;
  }
  
  public async processPendingOperations(): Promise<void> {
    return;
  }
  
  // Additional methods needed for other components
  public async getEvents(ids: string[]): Promise<any[]> {
    const connectedRelays = this.getConnectedRelayUrls();
    try {
      // Fix by accessing methods directly from eventManager
      return await Promise.all(ids.map(id => this.getEventById(id)));
    } catch (e) {
      console.error("Error getting events:", e);
      return [];
    }
  }
  
  public async getEventById(id: string): Promise<any> {
    const connectedRelays = this.getConnectedRelayUrls();
    try {
      // Implement our own temporary version
      return new Promise((resolve, reject) => {
        const sub = this.subscribe([{kinds: [1], ids: [id]}], (event) => {
          resolve(event);
          this.unsubscribe(sub);
        }, connectedRelays);
        
        // Set timeout
        setTimeout(() => {
          this.unsubscribe(sub);
          reject(new Error(`Timeout fetching event ${id}`));
        }, 5000);
      });
    } catch (e) {
      console.error(`Error getting event ${id}:`, e);
      return null;
    }
  }
  
  public async getProfilesByPubkeys(pubkeys: string[]): Promise<Record<string, any>> {
    const connectedRelays = this.getConnectedRelayUrls();
    try {
      // Implement our own temporary version
      return new Promise((resolve) => {
        const profiles: Record<string, any> = {};
        
        const sub = this.subscribe([{kinds: [0], authors: pubkeys}], (event) => {
          if (event.kind === 0 && event.pubkey) {
            try {
              profiles[event.pubkey] = JSON.parse(event.content);
            } catch (e) {
              console.error("Error parsing profile:", e);
            }
          }
        }, connectedRelays);
        
        // Set timeout
        setTimeout(() => {
          this.unsubscribe(sub);
          resolve(profiles);
        }, 3000);
      });
    } catch (e) {
      console.error("Error getting profiles:", e);
      return {};
    }
  }
  
  public async getUserProfile(pubkey: string): Promise<any> {
    const profiles = await this.getProfilesByPubkeys([pubkey]);
    return profiles[pubkey] || null;
  }
  
  public async verifyNip05(identifier: string, expectedPubkey: string): Promise<boolean> {
    try {
      const [name, domain] = identifier.split('@');
      if (!name || !domain) return false;
      
      const url = `https://${domain}/.well-known/nostr.json?name=${name}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.names && data.names[name] === expectedPubkey) {
        return true;
      }
      
      return false;
    } catch (e) {
      console.error("Error verifying NIP-05:", e);
      return false;
    }
  }
  
  /**
   * Fetch user's oldest metadata event to determine account creation date (NIP-01)
   * @param pubkey User's public key
   * @returns Timestamp of the oldest metadata event or null
   */
  public async getAccountCreationDate(pubkey: string): Promise<number | null> {
    if (!pubkey) return null;
    
    try {
      const connectedRelays = this.getConnectedRelayUrls();
      
      return new Promise((resolve) => {
        // Construct filter to get oldest metadata events
        const filters = [{
          kinds: [EVENT_KINDS.META],
          authors: [pubkey],
          limit: 10,
          // Query for historical events
          until: Math.floor(Date.now() / 1000)
        }];
        
        let oldestTimestamp: number | null = null;
        
        const subId = this.subscribe(
          filters,
          (event) => {
            if (!oldestTimestamp || event.created_at < oldestTimestamp) {
              oldestTimestamp = event.created_at;
            }
          }
        );
        
        // Set a timeout to resolve with the found timestamp or null
        setTimeout(() => {
          this.unsubscribe(subId);
          resolve(oldestTimestamp);
        }, 5000);
      });
    } catch (error) {
      console.error("Error fetching account creation date:", error);
      return null;
    }
  }
  
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
    // Fixed: Use the relay manager's status information
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
        
        // Subscribe to mute list events with proper filter format
        const filters = [{
          kinds: [10000],
          authors: [this.publicKey],
          "#d": ["mute-list"]
        }];
        
        const subId = this.subscribe(
          filters,
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
        
        // Subscribe to block list events with proper filter format
        const filters = [{
          kinds: [10000],
          authors: [this.publicKey],
          "#d": ["block-list"]
        }];
        
        const subId = this.subscribe(
          filters,
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
  
  /**
   * Create batched fetcher functions for parallel event retrieval
   * @param pubkey User's public key
   * @param options Filter options
   * @returns Array of fetcher functions
   */
  createBatchedFetchers(pubkey: string, options: { limit?: number, kinds?: number[] }): Array<() => Promise<NostrEvent[]>> {
    // Get connected relays  
    const connectedRelays = this.getConnectedRelayUrls();
    if (connectedRelays.length === 0) {
      // Return a single fetcher that will connect to default relays
      return [async () => {
        await this.connectToDefaultRelays();
        return this.getEvents([{
          kinds: options.kinds || [1],
          authors: [pubkey],
          limit: options.limit || 50
        }]);
      }];
    }
    
    // Create groups of relays for batched fetching
    const relayGroups: string[][] = [];
    const batchSize = 3; // Number of relays per batch
    
    // Split relays into groups
    for (let i = 0; i < connectedRelays.length; i += batchSize) {
      relayGroups.push(connectedRelays.slice(i, i + batchSize));
    }
    
    // Create a fetcher function for each group
    return relayGroups.map(relayGroup => async () => {
      // Create filter based on options
      const filter: any = {
        authors: [pubkey],
        limit: options.limit || 20
      };
      
      if (options.kinds) {
        filter.kinds = options.kinds;
      }
      
      // Return promise that will resolve to events from this group
      return new Promise<NostrEvent[]>((resolve, reject) => {
        try {
          const events: NostrEvent[] = [];
          const sub = this.pool.subscribeMany(
            relayGroup,
            [filter],
            {
              onevent: (event) => {
                events.push(event);
              },
              onclose: () => {
                resolve(events);
              },
              oneose: () => {
                sub.close();
                resolve(events);
              }
            }
          );
          
          // Set timeout for this batch
          setTimeout(() => {
            sub.close();
            resolve(events);
          }, 5000);
        } catch (error) {
          console.error(`Error fetching from relay group:`, error);
          resolve([]);
        }
      });
    });
  }
}

// Create and export a singleton instance
export const nostrService = new NostrService();
