
import { SimplePool } from 'nostr-tools';
import { NostrEvent, Relay } from './types';
import { SocialManager } from './social';

/**
 * Core NostrService that provides all Nostr protocol functionality
 */
export class NostrService {
  private pool: SimplePool;
  private _publicKey: string | null = null;
  private _relays: Relay[] = [];
  private _following: string[] = [];
  private subscriptions: Map<string, any> = new Map();
  
  // Add required manager properties
  public socialManager: SocialManager;
  
  constructor() {
    this.pool = new SimplePool();
    
    // Initialize socialManager
    this.socialManager = new SocialManager(this.pool);
    
    // Initialize with default relays
    this._relays = [
      { url: "wss://relay.damus.io", read: true, write: true, status: 'disconnected' },
      { url: "wss://nos.lol", read: true, write: true, status: 'disconnected' },
      { url: "wss://nostr.bitcoiner.social", read: true, write: true, status: 'disconnected' },
      { url: "wss://relay.nostr.band", read: true, write: true, status: 'disconnected' }
    ];
  }
  
  // Authentication methods
  set publicKey(key: string | null) {
    this._publicKey = key;
  }
  
  get publicKey(): string | null {
    return this._publicKey;
  }
  
  // Key formatting methods
  formatPubkey(pubkey: string, format: 'short' | 'medium' | 'full' = 'short'): string {
    if (!pubkey) return '';
    
    if (format === 'short') {
      return pubkey.slice(0, 5) + '...' + pubkey.slice(-5);
    } else if (format === 'medium') {
      return pubkey.slice(0, 8) + '...' + pubkey.slice(-8);
    }
    
    return pubkey;
  }
  
  getNpubFromHex(hex: string): string {
    // Simple mock implementation
    return `npub${hex.substring(0, 10)}`;
  }
  
  getHexFromNpub(npub: string): string {
    // Simple mock implementation
    return npub.startsWith('npub') ? npub.substring(4) : npub;
  }
  
  getHexFromNote(noteId: string): string {
    // Simple mock implementation
    return noteId.startsWith('note1') ? noteId.substring(5) : noteId;
  }
  
  // Following methods
  get following(): string[] {
    return this._following;
  }
  
  isFollowing(pubkey: string): Promise<boolean> {
    return Promise.resolve(this._following.includes(pubkey));
  }
  
  followUser(pubkey: string): Promise<boolean> {
    if (!this._following.includes(pubkey)) {
      this._following.push(pubkey);
    }
    return Promise.resolve(true);
  }
  
  unfollowUser(pubkey: string): Promise<boolean> {
    this._following = this._following.filter(pk => pk !== pubkey);
    return Promise.resolve(true);
  }
  
  // Relay methods
  get relays(): Relay[] {
    return this._relays;
  }
  
  addRelay(url: string): Promise<boolean> {
    if (!this._relays.some(r => r.url === url)) {
      this._relays.push({ url, read: true, write: true, status: 'connecting' });
    }
    return Promise.resolve(true);
  }
  
  removeRelay(url: string): Promise<boolean> {
    this._relays = this._relays.filter(r => r.url !== url);
    return Promise.resolve(true);
  }
  
  getRelayStatus(): Relay[] {
    return this._relays;
  }
  
  getRelayUrls(): string[] {
    return this._relays.map(r => r.url);
  }
  
  connectToDefaultRelays(): Promise<string[]> {
    return Promise.resolve(this.getRelayUrls());
  }
  
  connectToUserRelays(): Promise<void> {
    return Promise.resolve();
  }
  
  addMultipleRelays(relayUrls: string[]): Promise<boolean> {
    for (const url of relayUrls) {
      if (!this._relays.some(r => r.url === url)) {
        this._relays.push({ url, read: true, write: true, status: 'connecting' });
      }
    }
    return Promise.resolve(true);
  }
  
  // Subscription methods
  subscribe(filters: any[], onEvent: (event: any) => void, options?: any): string {
    const subId = `sub-${Math.random().toString(36).substring(2, 10)}`;
    this.subscriptions.set(subId, { filters, onEvent });
    return subId;
  }
  
  unsubscribe(subId: string): void {
    this.subscriptions.delete(subId);
  }
  
  // User profile methods
  getUserProfile(pubkey: string): Promise<any> {
    return Promise.resolve({
      name: `User ${pubkey.substring(0, 5)}`,
      about: 'No profile data available',
      picture: ''
    });
  }
  
  getProfilesByPubkeys(pubkeys: string[]): Promise<Record<string, any>> {
    const profiles: Record<string, any> = {};
    for (const pubkey of pubkeys) {
      profiles[pubkey] = {
        name: `User ${pubkey.substring(0, 5)}`,
        about: 'No profile data available',
        picture: ''
      };
    }
    return Promise.resolve(profiles);
  }
}

// Export a singleton instance
export const nostrService = new NostrService();
