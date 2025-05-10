
import { SimplePool } from 'nostr-tools';
import { NostrEvent, Relay } from './types';
import { EVENT_KINDS } from './constants';
import { UserManager } from './user';
import { RelayManager } from './relay';
import { SubscriptionManager } from './subscription';
import { EventManager } from './event';
import { SocialManager } from './social';
import { CommunityManager } from './community';
import { toast } from 'sonner';

class NostrService {
  private userManager: UserManager;
  private relayManager: RelayManager;
  private subscriptionManager: SubscriptionManager;
  private eventManager: EventManager;
  private socialManager: SocialManager;
  private communityManager: CommunityManager;
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
    return this.socialManager.sendDirectMessage(
      this.pool,
      recipientPubkey,
      content,
      this.publicKey,
      null, // We're not storing private keys
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
  
  public async createProposal(communityId: string, title: string, description: string, options: string[], endsAt?: number): Promise<string | null> {
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
  
  // Add getUserProfile method with proper implementation
  public async getUserProfile(pubkey: string): Promise<{
    name?: string;
    displayName?: string;
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
  
  // Private helper methods
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
export const nostrService = new NostrService();

// Export types and constants
export type { NostrEvent, Relay } from './types';
export { EVENT_KINDS } from './constants';
