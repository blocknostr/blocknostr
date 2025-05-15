// This is a partial file update to ensure proper private key handling
// Find the part where CommunityService is initialized and update it

// ... keep existing code (imports, class definition, etc.)

// Update the initialization of communityService to include getPrivateKey
initializeCommunityService() {
  this.communityService = new CommunityService(
    this.communityManager,
    () => this.getConnectedRelayUrls(),
    this.pool,
    this.publicKey,
    () => this.privateKey // Pass the getPrivateKey function
  );
}

// ... keep existing code (rest of the class methods)
```

I apologize for the confusion. You're right that I need to provide the complete code for the file rather than just a partial update with placeholders. Since I don't have the full content of the original `src/lib/nostr/service.ts` file, I'll need to infer what it might contain based on the other files you've shared.

Here's my best attempt at reconstructing the complete `src/lib/nostr/service.ts` file with the necessary changes:

import { SimplePool } from 'nostr-tools';
import { EventManager } from './event';
import { CommunityManager } from './community';
import { SocialManager } from './social';
import { RelayManager } from './relay';
import { CommunityService } from './services/community-service';
import { SocialService } from './services/social-service';
import { RelayService } from './services/relay-service';
import { DataService } from './services/data-service';

/**
 * Main Nostr service that coordinates all Nostr-related functionality
 */
export class NostrService {
  private pool: SimplePool;
  private eventManager: EventManager;
  private communityManager: CommunityManager;
  private socialManager: SocialManager;
  private relayManager: RelayManager;
  
  // Services
  private communityService: CommunityService;
  private socialService: SocialService;
  private relayService: RelayService;
  private dataService: DataService;
  
  // User state
  private publicKey: string | null = null;
  private privateKey: string | null = null;
  
  constructor() {
    this.pool = new SimplePool();
    this.eventManager = new EventManager();
    this.communityManager = new CommunityManager(this.eventManager);
    this.socialManager = new SocialManager(this.eventManager);
    this.relayManager = new RelayManager(this.pool);
    
    // Initialize services
    this.initializeServices();
  }
  
  /**
   * Initialize all services
   */
  private initializeServices(): void {
    this.initializeCommunityService();
    this.initializeSocialService();
    this.initializeRelayService();
    this.initializeDataService();
  }
  
  /**
   * Initialize community service
   */
  initializeCommunityService() {
    this.communityService = new CommunityService(
      this.communityManager,
      () => this.getConnectedRelayUrls(),
      this.pool,
      this.publicKey,
      () => this.privateKey // Pass the getPrivateKey function
    );
  }
  
  /**
   * Initialize social service
   */
  private initializeSocialService(): void {
    this.socialService = new SocialService(
      this.socialManager,
      () => this.getConnectedRelayUrls(),
      this.pool,
      this.publicKey,
      () => this.privateKey
    );
  }
  
  /**
   * Initialize relay service
   */
  private initializeRelayService(): void {
    this.relayService = new RelayService(
      this.relayManager,
      this.pool,
      this.publicKey
    );
  }
  
  /**
   * Initialize data service
   */
  private initializeDataService(): void {
    this.dataService = new DataService(
      this.eventManager,
      () => this.getConnectedRelayUrls(),
      this.pool
    );
  }
  
  /**
   * Set the user's public key
   */
  setPublicKey(publicKey: string | null): void {
    this.publicKey = publicKey;
    
    // Reinitialize services with new public key
    this.initializeServices();
  }
  
  /**
   * Set the user's private key
   */
  setPrivateKey(privateKey: string | null): void {
    this.privateKey = privateKey;
    
    // No need to reinitialize services as they use a getter function
  }
  
  /**
   * Get the user's public key
   */
  getPublicKey(): string | null {
    return this.publicKey;
  }
  
  /**
   * Get connected relay URLs
   */
  getConnectedRelayUrls(): string[] {
    return this.relayManager.getConnectedRelayUrls();
  }
  
  /**
   * Get relay status
   */
  getRelayStatus(): any[] {
    return this.relayService.getRelayStatus();
  }
  
  /**
   * Connect to user relays
   */
  async connectToUserRelays(): Promise<void> {
    return this.relayService.connectToUserRelays();
  }
  
  /**
   * Connect to default relays
   */
  async connectToDefaultRelays(): Promise<void> {
    return this.relayService.connectToDefaultRelays();
  }
  
  /**
   * Add a relay
   */
  async addRelay(relayUrl: string, readWrite: boolean = true): Promise<boolean> {
    return this.relayService.addRelay(relayUrl, readWrite);
  }
  
  /**
   * Remove a relay
   */
  removeRelay(relayUrl: string): void {
    this.relayService.removeRelay(relayUrl);
  }
  
  /**
   * Add multiple relays
   */
  async addMultipleRelays(relayUrls: string[]): Promise<number> {
    return this.relayService.addMultipleRelays(relayUrls);
  }
  
  /**
   * Get relays for a user
   */
  async getRelaysForUser(pubkey: string): Promise<any> {
    return this.relayService.getRelaysForUser(pubkey);
  }
  
  /**
   * Publish relay list
   */
  async publishRelayList(relays: { url: string, read: boolean, write: boolean }[]): Promise<boolean> {
    return this.relayService.publishRelayList(relays);
  }
  
  /**
   * Create a community
   */
  async createCommunity(name: string, description: string): Promise<string | null> {
    return this.communityService.createCommunity(name, description);
  }
  
  /**
   * Create a proposal
   */
  async createProposal(
    communityId: string,
    title: string,
    description: string,
    options: string[],
    category: string
  ): Promise<string | null> {
    return this.communityService.createProposal(
      communityId,
      title,
      description,
      options,
      category,
      undefined,
      undefined
    );
  }
  
  /**
   * Vote on a proposal
   */
  async voteOnProposal(proposalId: string, optionIndex: number): Promise<string | null> {
    return this.communityService.voteOnProposal(proposalId, optionIndex);
  }
  
  /**
   * Fetch a community
   */
  async fetchCommunity(communityId: string): Promise<any> {
    return this.communityService.fetchCommunity(communityId);
  }
  
  /**
   * Follow a user
   */
  async followUser(pubkey: string): Promise<boolean> {
    return this.socialService.followUser(pubkey);
  }
  
  /**
   * Unfollow a user
   */
  async unfollowUser(pubkey: string): Promise<boolean> {
    return this.socialService.unfollowUser(pubkey);
  }
  
  /**
   * Check if following a user
   */
  async isFollowing(pubkey: string): Promise<boolean> {
    return this.socialService.isFollowing(pubkey);
  }
  
  /**
   * Send a direct message
   */
  async sendDirectMessage(recipientPubkey: string, content: string): Promise<string | null> {
    return this.socialService.sendDirectMessage(recipientPubkey, content);
  }
  
  /**
   * Mute a user
   */
  async muteUser(pubkey: string): Promise<boolean> {
    return this.socialService.muteUser(pubkey);
  }
  
  /**
   * Unmute a user
   */
  async unmuteUser(pubkey: string): Promise<boolean> {
    return this.socialService.unmuteUser(pubkey);
  }
  
  /**
   * Check if a user is muted
   */
  async isUserMuted(pubkey: string): Promise<boolean> {
    return this.socialService.isUserMuted(pubkey);
  }
  
  /**
   * Block a user
   */
  async blockUser(pubkey: string): Promise<boolean> {
    return this.socialService.blockUser(pubkey);
  }
  
  /**
   * Unblock a user
   */
  async unblockUser(pubkey: string): Promise<boolean> {
    return this.socialService.unblockUser(pubkey);
  }
  
  /**
   * Check if a user is blocked
   */
  async isUserBlocked(pubkey: string): Promise<boolean> {
    return this.socialService.isUserBlocked(pubkey);
  }
  
  /**
   * Get an event by ID
   */
  async getEventById(id: string): Promise<any | null> {
    return this.dataService.getEventById(id);
  }
  
  /**
   * Get multiple events
   */
  async getEvents(ids: string[]): Promise<any[]> {
    return this.dataService.getEvents(ids);
  }
  
  /**
   * Get profiles for multiple pubkeys
   */
  async getProfilesByPubkeys(pubkeys: string[]): Promise<Record<string, any>> {
    return this.dataService.getProfilesByPubkeys(pubkeys);
  }
  
  /**
   * Get a user profile
   */
  async getUserProfile(pubkey: string): Promise<Record<string, any> | null> {
    return this.dataService.getUserProfile(pubkey);
  }
  
  /**
   * Verify a NIP-05 identifier
   */
  async verifyNip05(identifier: string, pubkey: string): Promise<boolean> {
    return this.dataService.verifyNip05(identifier, pubkey);
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    this.pool.close();
    this.relayManager.cleanup();
  }
}

// Create and export a singleton instance
export const nostrService = new NostrService();
