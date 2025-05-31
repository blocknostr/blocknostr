import { SimplePool } from 'nostr-tools';
import { Relay } from '../types';
import { RelayInfoService } from './relay-info-service';

/**
 * Simplified RelayManager focused on core relay management
 * Removed: Complex performance tracking, circuit breakers, discovery, health monitoring
 * Kept: Basic connection management, relay info, user relay preferences
 */
export class RelayManager {
  private pool: SimplePool;
  private _userRelays: Map<string, boolean> = new Map(); // Map<relayURL, readWrite>
  private defaultRelays: string[] = [
    'wss://relay.damus.io',      // Most reliable free relay
    'wss://nos.lol',             // High availability free relay
    'wss://relay.nostr.band',    // Comprehensive free relay
    'wss://offchain.pub',        // Fast European free relay
    'wss://nostr.wine',          // Good European free relay
    'wss://relay.blocknostr.com' // BlockNostr relay
  ];
  private relayInfoService: RelayInfoService;
  
  constructor(pool: SimplePool) {
    this.pool = pool;
    this.loadUserRelays();
    this.relayInfoService = new RelayInfoService(this.pool);
  }
  
  get userRelays(): Map<string, boolean> {
    return new Map(this._userRelays);
  }
  
  /**
   * Load user relays from local storage
   */
  loadUserRelays(): void {
    const savedRelays = localStorage.getItem('nostr_user_relays');
    if (savedRelays) {
      try {
        const relaysObject = JSON.parse(savedRelays);
        this._userRelays = new Map(Object.entries(relaysObject));
      } catch (e) {
        console.error('Error loading user relays:', e);
      }
    } else {
      // Default to the app's default relays
      this.defaultRelays.forEach(relay => {
        this._userRelays.set(relay, true); // Read/write by default
      });
    }
  }
  
  /**
   * Save user relays to local storage
   */
  saveUserRelays(): void {
    const relaysObject = Object.fromEntries(this._userRelays);
    localStorage.setItem('nostr_user_relays', JSON.stringify(relaysObject));
  }
  
  /**
   * Connect to default relays
   */
  async connectToDefaultRelays(): Promise<void> {
    await this.connectToUserRelays();
  }
  
  /**
   * Connect to user relays using SimplePool
   */
  async connectToUserRelays(): Promise<void> {
    const userRelayUrls = Array.from(this._userRelays.keys());
    
    // If we have few relays, add some defaults
    if (userRelayUrls.length < 3) {
      this.defaultRelays.forEach(relay => {
        if (!this._userRelays.has(relay)) {
          this._userRelays.set(relay, true);
        }
      });
      this.saveUserRelays();
    }
    
    // SimplePool handles the actual connections
    console.log(`Connecting to ${userRelayUrls.length} relays...`);
  }
  
  /**
   * Add a relay
   */
  async addRelay(relayUrl: string, readWrite: boolean = true): Promise<boolean> {
    if (!relayUrl || this._userRelays.has(relayUrl)) {
      return false;
    }
    
    try {
      // Validate URL format
      new URL(relayUrl);
      
      this._userRelays.set(relayUrl, readWrite);
      this.saveUserRelays();
      
      console.log(`Added relay: ${relayUrl}`);
      return true;
    } catch (error) {
      console.error(`Failed to add relay ${relayUrl}:`, error);
      return false;
    }
  }
  
  /**
   * Remove a relay
   */
  removeRelay(relayUrl: string): void {
    this._userRelays.delete(relayUrl);
    this.saveUserRelays();
    console.log(`Removed relay: ${relayUrl}`);
  }
  
  /**
   * Get relay status - simplified version
   */
  getRelayStatus(): Relay[] {
    return Array.from(this._userRelays.keys()).map(url => ({
      url,
      status: 'connected', // SimplePool manages actual connection status
      read: true,
      write: !!this._userRelays.get(url),
      score: 100, // Simplified - no complex scoring
      avgResponse: 200 // Simplified - no complex tracking
    }));
  }
  
  /**
   * Add multiple relays
   */
  async addMultipleRelays(relayUrls: string[]): Promise<number> {
    let successCount = 0;
    
    for (const url of relayUrls) {
      if (await this.addRelay(url)) {
        successCount++;
      }
    }
    
    return successCount;
  }
  
  /**
   * Set user relays
   */
  setUserRelays(relays: Map<string, boolean>): void {
    this._userRelays = new Map(relays);
    this.saveUserRelays();
  }
  
  /**
   * Get relay information
   */
  async getRelayInformation(relayUrl: string): Promise<any | null> {
    return this.relayInfoService.getRelayInfo(relayUrl);
  }
  
  /**
   * Check if relay supports NIP
   */
  async doesRelaySupport(relayUrl: string, nipNumber: number): Promise<boolean> {
    return this.relayInfoService.supportsNIP(relayUrl, nipNumber);
  }
  
  /**
   * Get relay limitations
   */
  async getRelayLimitations(relayUrl: string): Promise<any | null> {
    return this.relayInfoService.getRelayLimitations(relayUrl);
  }
  
  /**
   * Cleanup
   */
  cleanup(): void {
    // SimplePool handles cleanup
    console.log('RelayManager cleanup completed');
  }
}

