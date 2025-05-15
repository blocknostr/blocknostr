// Import the pool adapter
import { createPoolAdapter } from './utils/pool-adapter';
import { SimplePool, nip19, getPublicKey, getEventHash, validateEvent, finalizeEvent } from 'nostr-tools';
import { EVENT_KINDS, DEFAULT_RELAYS, ERROR_MESSAGES, TIMEOUTS } from './constants';
import { NostrEvent, Relay } from './types';
import { eventManager } from './event';
import { RelayManager } from './relay';
import { SocialManager } from './social';
import { CommunityManager } from './community';
import { ProfileManager } from './profile';

/**
 * Main Nostr service that handles all Nostr-related functionality
 */
class NostrService {
  private pool: SimplePool;
  private relayManager: RelayManager;
  private socialManager: SocialManager;
  private communityManager: CommunityManager;
  private profileManager: ProfileManager;
  
  // Authentication state
  private _publicKey: string | null = null;
  private _privateKey: string | null = null;
  
  constructor() {
    this.pool = new SimplePool();
    this.relayManager = new RelayManager(this.pool);
    this.socialManager = new SocialManager(eventManager);
    this.communityManager = new CommunityManager(eventManager);
    this.profileManager = new ProfileManager(eventManager);
    
    // Try to restore session on initialization
    this.restoreSession();
  }
  
  /**
   * Get the current user's public key
   */
  get publicKey(): string | null {
    return this._publicKey;
  }
  
  /**
   * Check if the user is logged in
   */
  isLoggedIn(): boolean {
    return !!this._publicKey;
  }
  
  /**
   * Check if there are connected relays
   */
  hasConnectedRelays(): boolean {
    const poolAdapter = createPoolAdapter(this.pool);
    const relays = poolAdapter.list();
    return relays.length > 0;
  }
  
  /**
   * Get the list of users the current user is following
   */
  getFollowingList(): string[] {
    return this.socialManager.getFollowingList();
  }
  
  /**
   * Login with NIP-07 extension or private key
   */
  async login(): Promise<string | null> {
    try {
      // Try NIP-07 extension first
      if (window.nostr) {
        try {
          const pubkey = await window.nostr.getPublicKey();
          if (pubkey) {
            this._publicKey = pubkey;
            this._privateKey = null; // Extension manages the private key
            this.saveSession();
            await this.connectToUserRelays();
            return pubkey;
          }
        } catch (err) {
          console.error("Error with NIP-07 extension:", err);
        }
      }
      
      // If extension fails, prompt for private key
      const privateKey = prompt("Enter your private key (nsec or hex):");
      if (!privateKey) return null;
      
      try {
        let pubkey: string;
        
        // Handle nsec format
        if (privateKey.startsWith('nsec')) {
          const { type, data } = nip19.decode(privateKey);
          if (type !== 'nsec') throw new Error("Invalid nsec format");
          pubkey = getPublicKey(data as Uint8Array);
          this._privateKey = privateKey;
        } 
        // Handle hex format
        else if (privateKey.match(/^[0-9a-fA-F]{64}$/)) {
          const privateKeyBytes = new Uint8Array(
            privateKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
          );
          pubkey = getPublicKey(privateKeyBytes);
          this._privateKey = privateKey;
        } else {
          throw new Error("Invalid private key format");
        }
        
        this._publicKey = pubkey;
        this.saveSession();
        await this.connectToUserRelays();
        return pubkey;
      } catch (error) {
        console.error("Error logging in with private key:", error);
        alert("Invalid private key format");
        return null;
      }
    } catch (error) {
      console.error("Login error:", error);
      return null;
    }
  }
  
  /**
   * Sign out the current user
   */
  signOut(): void {
    this._publicKey = null;
    this._privateKey = null;
    localStorage.removeItem('nostr_pubkey');
    localStorage.removeItem('nostr_privkey');
  }
  
  /**
   * Save the current session to localStorage
   */
  private saveSession(): void {
    if (this._publicKey) {
      localStorage.setItem('nostr_pubkey', this._publicKey);
      
      // Only save private key if it's not managed by an extension
      if (this._privateKey && !window.nostr) {
        localStorage.setItem('nostr_privkey', this._privateKey);
      }
    }
  }
  
  /**
   * Restore session from localStorage
   */
  private restoreSession(): void {
    const pubkey = localStorage.getItem('nostr_pubkey');
    const privkey = localStorage.getItem('nostr_privkey');
    
    if (pubkey) {
      this._publicKey = pubkey;
      this._privateKey = privkey;
    }
  }
  
  /**
   * Format a public key for display
   */
  formatPubkey(pubkey: string): string {
    if (!pubkey) return '';
    return `${pubkey.slice(0, 4)}...${pubkey.slice(-4)}`;
  }
  
  /**
   * Convert hex pubkey to npub format
   */
  getNpubFromHex(hexPubkey: string): string {
    try {
      return nip19.npubEncode(hexPubkey);
    } catch (error) {
      console.error("Error converting hex to npub:", error);
      return hexPubkey;
    }
  }
  
  /**
   * Convert npub to hex format
   */
  getHexFromNpub(npub: string): string {
    try {
      const { type, data } = nip19.decode(npub);
      if (type !== 'npub') throw new Error("Not an npub");
      return data as string;
    } catch (error) {
      console.error("Error converting npub to hex:", error);
      return npub;
    }
  }
  
  /**
   * Get account creation date
   */
  async getAccountCreationDate(pubkey: string): Promise<number | null> {
    try {
      // Find the earliest event from this pubkey
      const events = await this.pool.querySync(
        this.getConnectedRelayUrls(),
        { authors: [pubkey], limit: 1, kinds: [0, 1, 2, 3, 4] }
      );
      
      if (events.length === 0) return null;
      
      // Sort by created_at and return the earliest
      events.sort((a, b) => a.created_at - b.created_at);
      return events[0].created_at;
    } catch (error) {
      console.error("Error getting account creation date:", error);
      return null;
    }
  }
  
  /**
   * Subscribe to events
   */
  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]): string {
    const relayUrls = relays || this.getConnectedRelayUrls();
    if (relayUrls.length === 0) {
      console.warn("No relays connected for subscription");
      return "";
    }
    
    // Generate a subscription ID
    const subId = `sub_${Math.random().toString(36).substring(2, 10)}`;
    
    // Create the subscription
    this.pool.sub(relayUrls, filters, {
      id: subId,
      onevent: onEvent
    });
    
    return subId;
  }
  
  /**
   * Unsubscribe from events
   */
  unsubscribe(subId: string): void {
    if (!subId) return;
    this.pool.unsub(subId);
  }
  
  /**
   * Publish an event to connected relays
   */
  async publishEvent(event: any): Promise<string | null> {
    if (!this._publicKey) {
      console.error(ERROR_MESSAGES.NOT_LOGGED_IN);
      return null;
    }
    
    const relayUrls = this.getConnectedRelayUrls();
    if (relayUrls.length === 0) {
      console.error(ERROR_MESSAGES.NO_CONNECTED_RELAYS);
      return null;
    }
    
    // Prepare the event
    const fullEvent = {
      ...event,
      pubkey: this._publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags: event.tags || []
    };
    
    // Calculate the event ID
    const eventId = getEventHash(fullEvent);
    
    try {
      let signedEvent;
      
      // Sign with NIP-07 extension if available
      if (window.nostr) {
        try {
          signedEvent = await window.nostr.signEvent(fullEvent);
        } catch (err) {
          console.error("Error signing with extension:", err);
          return null;
        }
      } 
      // Sign with private key if available
      else if (this._privateKey) {
        let privateKeyBytes: Uint8Array;
        
        // Convert private key to bytes
        if (this._privateKey.startsWith('nsec')) {
          const { data } = nip19.decode(this._privateKey);
          privateKeyBytes = data as Uint8Array;
        } else {
          // Assume hex format
          privateKeyBytes = new Uint8Array(
            this._privateKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
          );
        }
        
        signedEvent = finalizeEvent(fullEvent, privateKeyBytes);
      } else {
        console.error("No signing method available");
        return null;
      }
      
      // Validate the signed event
      if (!validateEvent(signedEvent)) {
        console.error("Invalid event signature");
        return null;
      }
      
      // Publish to relays
      const pubs = this.pool.publish(relayUrls, signedEvent);
      
      // Wait for at least one relay to accept the event
      const timeout = setTimeout(() => {
        console.warn("Event publish timeout");
      }, TIMEOUTS.EVENT_PUBLISH);
      
      try {
        await Promise.race([
          Promise.any(pubs),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout")), TIMEOUTS.EVENT_PUBLISH)
          )
        ]);
        clearTimeout(timeout);
      } catch (error) {
        console.warn("Failed to get relay confirmation:", error);
        // Continue anyway, the event might still propagate
      }
      
      return eventId;
    } catch (error) {
      console.error("Error publishing event:", error);
      return null;
    }
  }
  
  /**
   * Connect to default relays
   */
  async connectToDefaultRelays(): Promise<string[]> {
    return this.relayManager.connectToRelays(DEFAULT_RELAYS);
  }
  
  /**
   * Connect to user's preferred relays
   */
  async connectToUserRelays(): Promise<void> {
    if (!this._publicKey) {
      await this.connectToDefaultRelays();
      return;
    }
    
    // First connect to default relays to be able to fetch user relay list
    const connectedDefaultRelays = await this.connectToDefaultRelays();
    
    if (connectedDefaultRelays.length === 0) {
      console.warn("Could not connect to any default relays");
      return;
    }
    
    // Try to get user's relay list
    const userRelays = await this.relayManager.getRelaysForUser(this._publicKey);
    
    if (!userRelays || Object.keys(userRelays).length === 0) {
      console.log("No custom relays found for user, using defaults");
      return;
    }
    
    // Connect to user's relays
    const userRelayUrls = Object.keys(userRelays);
    await this.relayManager.connectToRelays(userRelayUrls);
  }
  
  /**
   * Get URLs of connected relays
   */
  getConnectedRelayUrls(): string[] {
    const poolAdapter = createPoolAdapter(this.pool);
    return poolAdapter.list();
  }
  
  /**
   * Get relay status information
   */
  getRelayStatus(): Relay[] {
    return this.relayManager.getRelayStatus();
  }
  
  /**
   * Create a community
   */
  async createCommunity(name: string, description: string): Promise<string | null> {
    return this.communityManager.createCommunity(
      this.pool,
      this._publicKey,
      this._privateKey,
      name,
      description,
      this.getConnectedRelayUrls()
    );
  }
  
  /**
   * Create a proposal in a community
   */
  async createProposal(
    communityId: string,
    title: string,
    description: string,
    options: string[],
    category: string
  ): Promise<string | null> {
    return this.communityManager.createProposal(
      this.pool,
      this._publicKey,
      this._privateKey,
      communityId,
      title,
      description,
      options,
      category,
      this.getConnectedRelayUrls()
    );
  }
  
  /**
   * Vote on a proposal
   */
  async voteOnProposal(proposalId: string, optionIndex: number): Promise<boolean> {
    return this.communityManager.voteOnProposal(
      this.pool,
      this._publicKey,
      this._privateKey,
      proposalId,
      optionIndex,
      this.getConnectedRelayUrls()
    );
  }
  
  // Expose managers for direct access
  get communityManager() {
    return this.communityManager;
  }
}

// Create and export a singleton instance
export const nostrService = new NostrService();
