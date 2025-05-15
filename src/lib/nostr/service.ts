
import { SimplePool } from 'nostr-tools';
import { EventManager } from './event';
import { CommunityManager } from './community';
import { SocialManager } from './social';
import { RelayManager } from './relay';
import { CommunityService } from './services/community-service';

/**
 * Main Nostr service that coordinates all Nostr-related functionality
 */
export class NostrService {
  private pool: SimplePool;
  private eventManager: EventManager;
  
  // Changed from private to public for adapter access
  public communityManager: CommunityManager;
  public socialManager: SocialManager;
  public relayManager: RelayManager;
  
  // Services
  private communityService: CommunityService;
  
  // User state - changed from private to public for adapter access
  public publicKey: string | null = null;
  public privateKey: string | null = null;
  
  // Public property for adapters to use
  public following: string[] = [];
  
  constructor() {
    this.pool = new SimplePool();
    this.eventManager = new EventManager();
    this.communityManager = new CommunityManager(this.eventManager);
    this.socialManager = new SocialManager();
    this.relayManager = new RelayManager(this.pool);
    
    // Initialize services
    this.initializeServices();
  }
  
  /**
   * Initialize all services
   */
  private initializeServices(): void {
    this.initializeCommunityService();
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
    if (!this.relayManager) return [];
    return this.relayManager.getConnectedRelays().map(relay => relay.url);
  }
  
  /**
   * Publish an event to Nostr network
   * Required by adapters
   */
  publishEvent(event: any): Promise<string | null> {
    if (!this.publicKey || !this.privateKey) return Promise.resolve(null);
    const relays = this.getConnectedRelayUrls();
    return this.eventManager.publishEvent(this.pool, this.publicKey, this.privateKey, event, relays);
  }
  
  /**
   * Subscribe to Nostr events
   * Required by adapters
   */
  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]): string {
    return this.eventManager.subscribe(this.pool, filters, onEvent, relays || this.getConnectedRelayUrls());
  }
  
  /**
   * Unsubscribe from Nostr events
   * Required by adapters
   */
  unsubscribe(subId: string): void {
    this.eventManager.unsubscribe(subId);
  }
  
  /**
   * Connect to user's preferred relays
   * Required by adapters
   */
  async connectToUserRelays(): Promise<boolean> {
    return this.relayManager.connectToUserRelays(this.publicKey);
  }
  
  /**
   * Get relay status information
   * Required by adapters
   */
  getRelayStatus(): Array<{ url: string; status: string; }> {
    return this.relayManager.getRelayStatusArray();
  }
  
  /**
   * Get relay URLs
   * Required by adapters
   */
  getRelayUrls(): string[] {
    return this.relayManager.getRelayUrls();
  }
  
  /**
   * Add a relay
   * Required by adapters
   */
  async addRelay(relayUrl: string, readWrite: boolean = true): Promise<boolean> {
    return this.relayManager.addRelay(relayUrl, readWrite);
  }
  
  /**
   * Remove a relay
   * Required by adapters
   */
  removeRelay(relayUrl: string): void {
    this.relayManager.removeRelay(relayUrl);
  }
  
  /**
   * Create a community (forwarded to community service)
   * Required by adapters
   */
  async createCommunity(name: string, description: string): Promise<string | null> {
    if (!this.communityService) return null;
    return this.communityService.createCommunity(name, description);
  }
  
  /**
   * Create a proposal for a community (forwarded to community service)
   * Required by adapters
   */
  async createProposal(communityId: string, title: string, description: string, options: string[], category: any): Promise<string | null> {
    if (!this.communityService) return null;
    return this.communityService.createProposal(communityId, title, description, options, category);
  }
  
  /**
   * Vote on a proposal (forwarded to community service)
   * Required by adapters
   */
  async voteOnProposal(proposalId: string, optionIndex: number): Promise<string | null> {
    if (!this.communityService) return null;
    return this.communityService.voteOnProposal(proposalId, optionIndex);
  }
  
  /**
   * Check if user is following another user
   * Required by adapters
   */
  isFollowing(pubkey: string): boolean {
    return this.following.includes(pubkey);
  }
  
  /**
   * Follow a user
   * Required by adapters
   */
  async followUser(pubkey: string): Promise<boolean> {
    // Implementation would go here
    console.log(`Following user ${pubkey}`);
    this.following.push(pubkey);
    return true;
  }
  
  /**
   * Unfollow a user
   * Required by adapters
   */
  async unfollowUser(pubkey: string): Promise<boolean> {
    // Implementation would go here
    console.log(`Unfollowing user ${pubkey}`);
    this.following = this.following.filter(p => p !== pubkey);
    return true;
  }
  
  /**
   * Send a direct message to a user
   * Required by adapters
   */
  async sendDirectMessage(recipientPubkey: string, content: string): Promise<string | null> {
    // Implementation would go here
    console.log(`Sending message to ${recipientPubkey}: ${content}`);
    return null;
  }
  
  /**
   * React to a post
   * Required by adapters
   */
  async reactToPost(id: string, emoji: string = "+"): Promise<string | null> {
    // Implementation would go here
    console.log(`Reacting to post ${id} with ${emoji}`);
    return null;
  }
  
  /**
   * Repost a note
   * Required by adapters
   */
  async repostNote(id: string, pubkey: string): Promise<string | null> {
    // Implementation would go here
    console.log(`Reposting note ${id} from ${pubkey}`);
    return null;
  }
  
  /**
   * Get a user profile by pubkey
   * Required by adapters
   */
  async getUserProfile(pubkey: string): Promise<any> {
    // Implementation would go here
    console.log(`Getting profile for ${pubkey}`);
    return null;
  }
  
  /**
   * Get profiles for multiple pubkeys
   * Required by adapters
   */
  async getProfilesByPubkeys(pubkeys: string[]): Promise<Record<string, any>> {
    // Implementation would go here
    console.log(`Getting profiles for ${pubkeys.length} users`);
    return {};
  }
  
  /**
   * Get an event by ID
   * Required by adapters
   */
  async getEventById(id: string): Promise<any> {
    // Implementation would go here
    console.log(`Getting event ${id}`);
    return null;
  }
  
  /**
   * Get multiple events by IDs
   * Required by adapters
   */
  async getEvents(ids: string[]): Promise<any[]> {
    // Implementation would go here
    console.log(`Getting ${ids.length} events`);
    return [];
  }
  
  /**
   * Verify a NIP-05 identifier
   * Required by adapters
   */
  async verifyNip05(identifier: string, pubkey: string): Promise<boolean> {
    // Implementation would go here
    console.log(`Verifying NIP-05 ${identifier} for ${pubkey}`);
    return false;
  }
  
  /**
   * Get account creation date
   * Required by adapters
   */
  async getAccountCreationDate(pubkey: string): Promise<number | null> {
    // Implementation would go here
    console.log(`Getting account creation date for ${pubkey}`);
    return null;
  }
  
  /**
   * Handle user login
   * Required by adapters
   */
  async login(): Promise<boolean> {
    // Implementation would go here
    console.log("User login requested");
    return false;
  }
  
  /**
   * Handle user sign out
   * Required by adapters
   */
  signOut(): void {
    // Implementation would go here
    console.log("User sign out requested");
    this.publicKey = null;
    this.privateKey = null;
  }
  
  /**
   * Mute a user
   * Required by adapters
   */
  async muteUser(pubkey: string): Promise<boolean> {
    // Implementation would go here
    console.log(`Muting user ${pubkey}`);
    return true;
  }
  
  /**
   * Unmute a user
   * Required by adapters
   */
  async unmuteUser(pubkey: string): Promise<boolean> {
    // Implementation would go here
    console.log(`Unmuting user ${pubkey}`);
    return true;
  }
  
  /**
   * Check if a user is muted
   * Required by adapters
   */
  async isUserMuted(pubkey: string): Promise<boolean> {
    // Implementation would go here
    console.log(`Checking if user ${pubkey} is muted`);
    return false;
  }
  
  /**
   * Block a user
   * Required by adapters
   */
  async blockUser(pubkey: string): Promise<boolean> {
    // Implementation would go here
    console.log(`Blocking user ${pubkey}`);
    return true;
  }
  
  /**
   * Unblock a user
   * Required by adapters
   */
  async unblockUser(pubkey: string): Promise<boolean> {
    // Implementation would go here
    console.log(`Unblocking user ${pubkey}`);
    return true;
  }
  
  /**
   * Check if a user is blocked
   * Required by adapters
   */
  async isUserBlocked(pubkey: string): Promise<boolean> {
    // Implementation would go here
    console.log(`Checking if user ${pubkey} is blocked`);
    return false;
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    this.pool.close();
  }
}

// Create and export a singleton instance
export const nostrService = new NostrService();

// Create and export a specialized instance for chat functionality (to be used by hooks)
export const chatNostrService = nostrService;
