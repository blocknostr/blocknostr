
import { NostrEvent } from "./types";
import { UserManager } from "./user";
import { RelayManager } from "./relay/relay-manager";

/**
 * The NostrService class provides core Nostr functionality
 */
export class NostrService {
  publicKey: string | null = null;
  private userManager: UserManager;
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
      return await this.relayManager.connectToUserRelays();
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
      return await this.relayManager.connectToDefaultRelays();
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
      return await this.relayManager.addRelay(relayUrl, readWrite);
    } catch (error) {
      console.error("Error adding relay:", error);
      return false;
    }
  }
  
  /**
   * Add multiple relays
   * @param relayUrls Array of relay URLs to add
   * @returns Boolean indicating success
   */
  async addMultipleRelays(relayUrls: string[]): Promise<boolean> {
    try {
      return await this.relayManager.addMultipleRelays(relayUrls);
    } catch (error) {
      console.error("Error adding multiple relays:", error);
      return false;
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

  // Add basic method stubs for other functionality needed by components

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
    return this.relayManager.getRelaysForUser(pubkey);
  }
}

// Create a singleton instance of NostrService
export const nostrService = new NostrService();
