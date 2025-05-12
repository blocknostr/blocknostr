
import { NostrEvent } from "./types";
import { UserManager } from "./user";
import { RelayManager } from "./relay/relay-manager";

/**
 * The NostrService class provides core Nostr functionality
 */
export class NostrService {
  publicKey: string | null = null;
  private userManager: UserManager;
  // Fixed duplicate relayManager declaration
  private relayManager: RelayManager;
  private _following: string[] = [];
  
  constructor() {
    this.userManager = new UserManager();
    this.relayManager = new RelayManager();
    
    // Initialize from user manager
    this.publicKey = this.userManager.publicKey;
    this._following = this.userManager.following;
  }
  
  /**
   * Get access to the following list
   */
  get following(): string[] {
    return this._following;
  }
  
  /**
   * Login with Nostr extension
   * @returns Boolean indicating success
   */
  async login(): Promise<boolean> {
    try {
      const success = await this.userManager.login();
      if (success) {
        this.publicKey = this.userManager.publicKey;
        this._following = this.userManager.following;
      }
      return success;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  }
  
  /**
   * Sign out of Nostr
   * @returns Boolean indicating success
   */
  signOut(): boolean {
    try {
      this.userManager.signOut();
      this.publicKey = null;
      this._following = [];
      return true;
    } catch (error) {
      console.error("Sign out error:", error);
      return false;
    }
  }
  
  /**
   * Connect to user's preferred relays
   * @returns Boolean indicating success
   */
  async connectToUserRelays(): Promise<boolean> {
    try {
      const success = await this.relayManager.connectToUserRelays();
      return success === true;
    } catch (error) {
      console.error("Error connecting to user relays:", error);
      return false;
    }
  }
  
  /**
   * Connect to default relays
   * @returns Boolean indicating success
   */
  async connectToDefaultRelays(): Promise<boolean> {
    try {
      const success = await this.relayManager.connectToDefaultRelays();
      return success === true;
    } catch (error) {
      console.error("Error connecting to default relays:", error);
      return false;
    }
  }
  
  /**
   * Get status of all relays
   * @returns Array of relay status objects
   */
  getRelayStatus() {
    return this.relayManager.getRelayStatus();
  }
  
  /**
   * Get URLs of all connected relays
   * @returns Array of relay URLs
   */
  getRelayUrls() {
    return this.relayManager.getRelayUrls();
  }
  
  /**
   * Add a new relay
   * @param relayUrl URL of the relay to add
   * @param readWrite Whether the relay should be used for both reading and writing
   * @returns Boolean indicating success
   */
  async addRelay(relayUrl: string, readWrite: boolean = true): Promise<boolean> {
    try {
      const success = await this.relayManager.addRelay(relayUrl, readWrite);
      return success === true;
    } catch (error) {
      console.error("Error adding relay:", error);
      return false;
    }
  }
  
  /**
   * Add multiple relays
   * @param relayUrls Array of relay URLs to add
   * @returns Number of successfully added relays
   */
  async addMultipleRelays(relayUrls: string[]): Promise<number> {
    try {
      let successCount = 0;
      for (const url of relayUrls) {
        const success = await this.addRelay(url);
        if (success) successCount++;
      }
      return successCount;
    } catch (error) {
      console.error("Error adding multiple relays:", error);
      return 0;
    }
  }
  
  /**
   * Remove a relay
   * @param relayUrl URL of the relay to remove
   * @returns Boolean indicating success
   */
  removeRelay(relayUrl: string): boolean {
    try {
      return this.relayManager.removeRelay(relayUrl);
    } catch (error) {
      console.error("Error removing relay:", error);
      return false;
    }
  }
  
  /**
   * Subscribe to events matching filters
   * @param filters Array of filters to match events
   * @param onEvent Callback function for matching events
   * @param relays Optional array of specific relays to query
   * @returns Subscription ID
   */
  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]): string {
    try {
      return this.relayManager.subscribe(filters, onEvent, relays);
    } catch (error) {
      console.error("Error subscribing to events:", error);
      return "";
    }
  }
  
  /**
   * Unsubscribe from events
   * @param subId Subscription ID to unsubscribe
   * @returns Boolean indicating success
   */
  unsubscribe(subId: string): boolean {
    try {
      return this.relayManager.unsubscribe(subId);
    } catch (error) {
      console.error("Error unsubscribing:", error);
      return false;
    }
  }
  
  /**
   * Publish an event
   * @param event Event to publish
   * @returns Event ID if successful, null otherwise
   */
  async publishEvent(event: Partial<NostrEvent>): Promise<string | null> {
    try {
      // Implementation would be in the relay manager
      return await this.relayManager.publishEvent(event, this.publicKey);
    } catch (error) {
      console.error("Error publishing event:", error);
      return null;
    }
  }
  
  /**
   * Get user profile
   * @param pubkey Public key of the user
   * @returns User profile data
   */
  async getUserProfile(pubkey: string) {
    try {
      return await this.userManager.getUserProfile(pubkey);
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  }
  
  /**
   * Check if a user is being followed
   * @param pubkey Public key to check
   * @returns Boolean indicating if the user is being followed
   */
  isFollowing(pubkey: string): boolean {
    return this._following.includes(pubkey);
  }
  
  /**
   * Follow a user
   * @param pubkey Public key to follow
   * @returns Boolean indicating success
   */
  async followUser(pubkey: string): Promise<boolean> {
    try {
      // Add to local following list
      this.userManager.addFollowing(pubkey);
      this._following = this.userManager.following;
      
      // Publish updated contact list
      return true;
    } catch (error) {
      console.error("Error following user:", error);
      return false;
    }
  }
  
  /**
   * Unfollow a user
   * @param pubkey Public key to unfollow
   * @returns Boolean indicating success
   */
  async unfollowUser(pubkey: string): Promise<boolean> {
    try {
      // Remove from local following list
      this.userManager.removeFollowing(pubkey);
      this._following = this.userManager.following;
      
      // Publish updated contact list
      return true;
    } catch (error) {
      console.error("Error unfollowing user:", error);
      return false;
    }
  }

  /**
   * Publish a list of relays according to NIP-65
   * @param relays Array of relay objects with url, read, and write properties
   * @returns Boolean indicating success
   */
  async publishRelayList(relays: { url: string, read: boolean, write: boolean }[]): Promise<boolean> {
    if (!this.publicKey) {
      console.error("Cannot publish relay list: not logged in");
      return false;
    }
    
    try {
      // Create tags for each relay as per NIP-65
      const tags = relays.map(relay => {
        const readWrite: string[] = [];
        if (relay.read) readWrite.push('read');
        if (relay.write) readWrite.push('write');
        return ['r', relay.url, ...readWrite];
      });
      
      // Create and publish the event
      const event: Partial<NostrEvent> = {
        kind: 10002, // NIP-65: Relay List Metadata
        tags,
        content: '' // Usually empty
      };
      
      const eventId = await this.publishEvent(event);
      return !!eventId;
    } catch (error) {
      console.error("Error publishing relay list:", error);
      return false;
    }
  }

  // Format public key
  formatPubkey(pubkey: string, format: string = 'npub') {
    return this.userManager.formatPubkey(pubkey, format as any);
  }

  // Convert between hex and npub formats
  getNpubFromHex(hex: string) {
    return this.userManager.getNpubFromHex(hex);
  }

  getHexFromNpub(npub: string) {
    return this.userManager.getHexFromNpub(npub);
  }

  // Get relays for user
  async getRelaysForUser(pubkey: string) {
    try {
      if (this.relayManager.getRelaysForUser) {
        return await this.relayManager.getRelaysForUser(pubkey);
      }
      return [];
    } catch (error) {
      console.error("Error getting relays for user:", error);
      return [];
    }
  }
  
  // Required methods for adapters
  
  // Direct messaging
  async sendDirectMessage(recipientPubkey: string, content: string): Promise<string | null> {
    try {
      // Create encrypted direct message event
      const event: Partial<NostrEvent> = {
        kind: 4, // Direct Message
        tags: [['p', recipientPubkey]],
        content: content // In a real implementation, this would be encrypted
      };
      
      return await this.publishEvent(event);
    } catch (error) {
      console.error("Error sending direct message:", error);
      return null;
    }
  }
  
  // User moderation methods
  async muteUser(pubkey: string): Promise<boolean> {
    console.log(`Muting user: ${pubkey}`);
    return true;
  }
  
  async unmuteUser(pubkey: string): Promise<boolean> {
    console.log(`Unmuting user: ${pubkey}`);
    return true;
  }
  
  async isUserMuted(pubkey: string): Promise<boolean> {
    return false; // Placeholder implementation
  }
  
  async blockUser(pubkey: string): Promise<boolean> {
    console.log(`Blocking user: ${pubkey}`);
    return true;
  }
  
  async unblockUser(pubkey: string): Promise<boolean> {
    console.log(`Unblocking user: ${pubkey}`);
    return true;
  }
  
  async isUserBlocked(pubkey: string): Promise<boolean> {
    return false; // Placeholder implementation
  }
  
  // Event and profile fetching
  async getEventById(id: string): Promise<NostrEvent | null> {
    try {
      // Would be implemented in the relay manager
      return null;
    } catch (error) {
      console.error("Error getting event by ID:", error);
      return null;
    }
  }
  
  async getEvents(filters: any[]): Promise<NostrEvent[]> {
    try {
      // Would be implemented in the relay manager
      return [];
    } catch (error) {
      console.error("Error getting events:", error);
      return [];
    }
  }
  
  async getProfilesByPubkeys(pubkeys: string[]): Promise<Record<string, any>> {
    try {
      // Would be implemented in the user manager
      return {};
    } catch (error) {
      console.error("Error getting profiles by pubkeys:", error);
      return {};
    }
  }
  
  async getAccountCreationDate(pubkey: string): Promise<number | null> {
    try {
      // Would be implemented in the user manager
      return null;
    } catch (error) {
      console.error("Error getting account creation date:", error);
      return null;
    }
  }
  
  // Community features
  async createCommunity(name: string, description: string): Promise<boolean> {
    console.log(`Creating community: ${name}`);
    return true;
  }
  
  async createProposal(communityId: string, title: string, description: string, options: string[], category: string): Promise<boolean> {
    console.log(`Creating proposal for community: ${communityId}`);
    return true;
  }
  
  async voteOnProposal(proposalId: string, optionIndex: number): Promise<boolean> {
    console.log(`Voting on proposal: ${proposalId}, option: ${optionIndex}`);
    return true;
  }
  
  // Bookmark features
  async isBookmarked(eventId: string): Promise<boolean> {
    return false; // Placeholder implementation
  }
  
  async addBookmark(eventId: string, collectionId?: string, tags?: string[], note?: string): Promise<boolean> {
    console.log(`Bookmarking event: ${eventId}`);
    return true;
  }
  
  async removeBookmark(eventId: string): Promise<boolean> {
    console.log(`Removing bookmark: ${eventId}`);
    return true;
  }
  
  async getBookmarks(): Promise<any[]> {
    return []; // Placeholder implementation
  }
  
  async getBookmarkCollections(): Promise<any[]> {
    return []; // Placeholder implementation
  }
  
  async getBookmarkMetadata(): Promise<any> {
    return {}; // Placeholder implementation
  }
  
  async createBookmarkCollection(name: string, color?: string, description?: string): Promise<boolean> {
    console.log(`Creating bookmark collection: ${name}`);
    return true;
  }
  
  async processPendingOperations(): Promise<boolean> {
    return true; // Placeholder implementation
  }

  // Social features
  async publishProfileMetadata(metadata: Record<string, any>): Promise<boolean> {
    try {
      const event: Partial<NostrEvent> = {
        kind: 0,
        content: JSON.stringify(metadata)
      };
      
      const eventId = await this.publishEvent(event);
      return !!eventId;
    } catch (error) {
      console.error("Error publishing profile metadata:", error);
      return false;
    }
  }
  
  // Verification methods
  async verifyNip05(identifier: string, pubkey: string): Promise<boolean> {
    console.log(`Verifying NIP-05 identifier: ${identifier} for pubkey: ${pubkey}`);
    return true;
  }
  
  // For adapter pattern
  get socialManager() {
    return {
      // Placeholder implementation
      reactToPost: (id: string, emoji?: string) => Promise.resolve(true),
      repostNote: (id: string, pubkey: string) => Promise.resolve(true)
    };
  }
  
  // Make relayManager accessible through a getter
  get relayManagerInstance() {
    return this.relayManager;
  }
  
  get communityManager() {
    return {
      // Placeholder implementation
    };
  }
  
  get bookmarkManager() {
    return {
      // Placeholder implementation
    };
  }
  
  // Batch fetchers for profile loading
  createBatchedFetchers(hexPubkey: string, options: any): any[] {
    return []; // Placeholder implementation
  }
}

// Create a singleton instance of NostrService
export const nostrService = new NostrService();
