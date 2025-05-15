import { SimplePool } from 'nostr-tools';
import { EventManager } from './event';
import { CommunityManager } from './community';
import { SocialManager } from './social';
import { RelayManager } from './relay';
import { CommunityService } from './services/community-service';
import { formatPubkey, getNpubFromHex, getHexFromNpub } from './utils/keys';
import { Relay, NostrFilter } from './types';
import { CircuitState } from './relay/circuit/circuit-breaker';

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
    // Create a SimplePool with proper initialization (no arguments)
    this.pool = new SimplePool();
    this.eventManager = new EventManager();
    this.communityManager = new CommunityManager(this.eventManager);
    this.socialManager = new SocialManager();
    
    // Fix: Pass the pool to RelayManager constructor with proper arguments
    // The RelayManager expects SimplePool as the first argument
    this.relayManager = new RelayManager(this.pool, {});
    
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
      this.publicKey
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
    
    // Get connections from relay manager
    const relays = this.relayManager.getRelayStatus();
    return relays.filter(relay => relay.status === 'connected').map(relay => relay.url);
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
  subscribe(filters: NostrFilter[], onEvent: (event: any) => void, relays?: string[]): string {
    const subId = `sub_${Math.random().toString(36).substring(2, 15)}`;
    // Use subscribeMany with proper options
    const sub = this.pool.subscribeMany(
      relays || this.getConnectedRelayUrls(), 
      filters, 
      { onevent: onEvent }
    );
    
    return subId;
  }
  
  /**
   * Unsubscribe from Nostr events
   * Required by adapters
   */
  unsubscribe(subId: string): void {
    // Create an array with the subId since close expects an array
    this.pool.close([subId]);
  }
  
  /**
   * Connect to user's preferred relays
   * Required by adapters
   */
  async connectToUserRelays(): Promise<boolean> {
    try {
      await this.relayManager.connectToUserRelays();
      return true;
    } catch (error) {
      console.error("Failed to connect to user relays:", error);
      return false;
    }
  }
  
  /**
   * Get relay status information
   * Required by adapters
   */
  getRelayStatus(): Relay[] {
    const relayStatus = this.relayManager.getRelayStatus();
    // Create a proper Relay object for each relay status with defaults for required properties
    return relayStatus.map(relay => ({
      url: relay.url,
      status: relay.status,
      read: relay.read ?? true, // Use nullish coalescing for optional properties
      write: relay.write ?? true,
      score: 50, // Default score
      avgResponse: 0, // Default response time
      circuitStatus: CircuitState.CLOSED, // Default circuit status
      isRequired: false // Default required status
    }));
  }
  
  /**
   * Get relay URLs
   * Required by adapters
   */
  getRelayUrls(): string[] {
    return this.relayManager.getRelayStatus().map(relay => relay.url);
  }
  
  /**
   * Add a relay
   * Required by adapters
   */
  async addRelay(relayUrl: string, readWrite: boolean = true): Promise<boolean> {
    return this.relayManager.addRelay(relayUrl);
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
   */
  async voteOnProposal(proposalId: string, optionIndex: number): Promise<string | null> {
    if (!this.communityService) return null;
    return this.communityService.voteOnProposal(proposalId, optionIndex);
  }
  
  /**
   * Check if user is following another user
   */
  isFollowing(pubkey: string): boolean {
    return this.following.includes(pubkey);
  }
  
  /**
   * Follow a user
   */
  async followUser(pubkey: string): Promise<boolean> {
    // Implementation would go here
    console.log(`Following user ${pubkey}`);
    this.following.push(pubkey);
    return true;
  }
  
  /**
   * Unfollow a user
   */
  async unfollowUser(pubkey: string): Promise<boolean> {
    // Implementation would go here
    console.log(`Unfollowing user ${pubkey}`);
    this.following = this.following.filter(p => p !== pubkey);
    return true;
  }
  
  /**
   * Send a direct message to a user
   */
  async sendDirectMessage(recipientPubkey: string, content: string): Promise<string | null> {
    // Implementation would go here
    console.log(`Sending message to ${recipientPubkey}: ${content}`);
    return null;
  }
  
  /**
   * React to a post
   */
  async reactToPost(id: string, emoji: string = "+"): Promise<string | null> {
    // Implementation would go here
    console.log(`Reacting to post ${id} with ${emoji}`);
    return null;
  }
  
  /**
   * Repost a note
   */
  async repostNote(id: string, pubkey: string): Promise<string | null> {
    // Implementation would go here
    console.log(`Reposting note ${id} from ${pubkey}`);
    return null;
  }
  
  /**
   * Get a user profile by pubkey
   */
  async getUserProfile(pubkey: string): Promise<any> {
    // Implementation would go here
    console.log(`Getting profile for ${pubkey}`);
    return null;
  }
  
  /**
   * Get profiles for multiple pubkeys
   */
  async getProfilesByPubkeys(pubkeys: string[]): Promise<Record<string, any>> {
    // Implementation would go here
    console.log(`Getting profiles for ${pubkeys.length} users`);
    return {};
  }
  
  /**
   * Get an event by ID
   */
  async getEventById(id: string): Promise<any> {
    // Implementation would go here
    console.log(`Getting event ${id}`);
    return null;
  }
  
  /**
   * Get multiple events by IDs
   */
  async getEvents(ids: string[]): Promise<any[]> {
    // Implementation would go here
    console.log(`Getting ${ids.length} events`);
    return [];
  }
  
  /**
   * Verify a NIP-05 identifier
   */
  async verifyNip05(identifier: string, pubkey: string): Promise<boolean> {
    // Implementation would go here
    console.log(`Verifying NIP-05 ${identifier} for ${pubkey}`);
    return false;
  }
  
  /**
   * Get account creation date
   */
  async getAccountCreationDate(pubkey: string): Promise<number | null> {
    // Implementation would go here
    console.log(`Getting account creation date for ${pubkey}`);
    return null;
  }
  
  /**
   * Handle user login
   */
  async login(options?: any): Promise<boolean> {
    // Implementation would go here
    console.log("User login requested", options);
    return false;
  }
  
  /**
   * Handle user sign out
   */
  signOut(): void {
    // Implementation would go here
    console.log("User sign out requested");
    this.publicKey = null;
    this.privateKey = null;
  }
  
  /**
   * Mute a user
   */
  async muteUser(pubkey: string): Promise<boolean> {
    // Implementation would go here
    console.log(`Muting user ${pubkey}`);
    return true;
  }
  
  /**
   * Unmute a user
   */
  async unmuteUser(pubkey: string): Promise<boolean> {
    // Implementation would go here
    console.log(`Unmuting user ${pubkey}`);
    return true;
  }
  
  /**
   * Check if a user is muted
   */
  async isUserMuted(pubkey: string): Promise<boolean> {
    // Implementation would go here
    console.log(`Checking if user ${pubkey} is muted`);
    return false;
  }
  
  /**
   * Block a user
   */
  async blockUser(pubkey: string): Promise<boolean> {
    // Implementation would go here
    console.log(`Blocking user ${pubkey}`);
    return true;
  }
  
  /**
   * Unblock a user
   */
  async unblockUser(pubkey: string): Promise<boolean> {
    // Implementation would go here
    console.log(`Unblocking user ${pubkey}`);
    return true;
  }
  
  /**
   * Check if a user is blocked
   */
  async isUserBlocked(pubkey: string): Promise<boolean> {
    // Implementation would go here
    console.log(`Checking if user ${pubkey} is blocked`);
    return false;
  }
  
  /**
   * Format a public key
   */
  formatPubkey(pubkey: string): string {
    return formatPubkey(pubkey);
  }
  
  /**
   * Convert a hex pubkey to npub format
   */
  getNpubFromHex(hexPubkey: string): string {
    return getNpubFromHex(hexPubkey);
  }
  
  /**
   * Convert an npub to hex format
   */
  getHexFromNpub(npub: string): string {
    return getHexFromNpub(npub);
  }
  
  /**
   * Publish profile metadata
   */
  async publishProfileMetadata(metadata: Record<string, any>): Promise<string | null> {
    // Implementation would go here
    console.log(`Publishing profile metadata:`, metadata);
    return null;
  }
  
  /**
   * Get relays for user
   */
  async getRelaysForUser(pubkey: string): Promise<string[]> {
    // Implementation would go here
    console.log(`Getting relays for user ${pubkey}`);
    return [
      'wss://relay.damus.io',
      'wss://nostr.bitcoiner.social',
      'wss://relay.nostr.band',
      'wss://nos.lol'
    ];
  }
  
  /**
   * Add multiple relays at once
   */
  async addMultipleRelays(relayUrls: string[]): Promise<number> {
    let successCount = 0;
    for (const url of relayUrls) {
      try {
        const success = await this.addRelay(url);
        if (success) successCount++;
      } catch (error) {
        console.error(`Failed to add relay ${url}:`, error);
      }
    }
    return successCount;
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    this.pool.close([]);
  }
}

// Create and export a singleton instance
export const nostrService = new NostrService();

// Create and export a specialized instance for chat functionality (to be used by hooks)
export const chatNostrService = nostrService;
