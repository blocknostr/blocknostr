
import { SimplePool } from 'nostr-tools';
import { Relay } from '../types';

/**
 * Service for managing Nostr relays
 */
export class RelayService {
  private userRelays: Map<string, boolean> = new Map();
  
  constructor(
    private pool: SimplePool,
    private getDefaultRelays: () => string[]
  ) {
    // Initialize with default relays
    this.loadRelaysFromLocalStorage();
  }
  
  /**
   * Load user relays from local storage
   */
  private loadRelaysFromLocalStorage(): void {
    try {
      const savedRelays = localStorage.getItem('nostr_relays');
      if (savedRelays) {
        const parsedRelays = JSON.parse(savedRelays);
        this.userRelays = new Map(Object.entries(parsedRelays));
      } else {
        // Use default relays if none are saved
        const defaultRelays = this.getDefaultRelays();
        defaultRelays.forEach(relay => {
          this.userRelays.set(relay, true); // read/write by default
        });
        this.saveRelaysToLocalStorage();
      }
    } catch (e) {
      console.error('Error loading relays from localStorage:', e);
    }
  }
  
  /**
   * Save user relays to local storage
   */
  private saveRelaysToLocalStorage(): void {
    try {
      const relaysObj = Object.fromEntries(this.userRelays);
      localStorage.setItem('nostr_relays', JSON.stringify(relaysObj));
    } catch (e) {
      console.error('Error saving relays to localStorage:', e);
    }
  }
  
  /**
   * Get user relays
   */
  getUserRelays(): Map<string, boolean> {
    return this.userRelays;
  }
  
  /**
   * Connect to user relays
   */
  async connectToUserRelays(): Promise<string[]> {
    const relayUrls = Array.from(this.userRelays.keys());
    
    // Ensure we have at least some relays
    if (relayUrls.length === 0) {
      const defaultRelays = this.getDefaultRelays();
      defaultRelays.forEach(url => this.userRelays.set(url, true));
      this.saveRelaysToLocalStorage();
      return this.connectToUserRelays();
    }
    
    // Connect to all relays
    relayUrls.forEach(url => {
      try {
        this.pool.ensureRelay(url);
      } catch (e) {
        console.error(`Error connecting to relay ${url}:`, e);
      }
    });
    
    return relayUrls;
  }
  
  /**
   * Add a relay
   */
  async addRelay(relayUrl: string, readWrite: boolean = true): Promise<boolean> {
    try {
      this.userRelays.set(relayUrl, readWrite);
      this.saveRelaysToLocalStorage();
      
      // Attempt to connect to the relay
      this.pool.ensureRelay(relayUrl);
      return true;
    } catch (error) {
      console.error(`Error adding relay ${relayUrl}:`, error);
      return false;
    }
  }
  
  /**
   * Add multiple relays
   */
  async addMultipleRelays(relayUrls: string[]): Promise<number> {
    let successCount = 0;
    
    for (const url of relayUrls) {
      const success = await this.addRelay(url);
      if (success) successCount++;
    }
    
    return successCount;
  }
  
  /**
   * Remove a relay
   */
  removeRelay(relayUrl: string): void {
    this.userRelays.delete(relayUrl);
    this.saveRelaysToLocalStorage();
    
    try {
      // Close the connection if it exists
      this.pool.close([relayUrl]);
    } catch (e) {
      console.error(`Error closing connection to relay ${relayUrl}:`, e);
    }
  }
  
  /**
   * Get relay status
   */
  getRelayStatus(): Relay[] {
    const relayUrls = Array.from(this.userRelays.keys());
    
    return relayUrls.map(url => {
      const isReadWrite = this.userRelays.get(url);
      
      // Check connection status
      let status: 'connected' | 'connecting' | 'disconnected' | 'error' = 'disconnected';
      
      try {
        // This is a simplified check since SimplePool doesn't have getRelay method
        // We'll just assume it's connected if we have it in our relays list
        status = this.userRelays.has(url) ? 'connected' : 'disconnected';
      } catch (e) {
        status = 'error';
      }
      
      return {
        url,
        read: Boolean(isReadWrite),
        write: Boolean(isReadWrite),
        status
      };
    });
  }
  
  /**
   * Get relays for a specific user
   */
  async getRelaysForUser(pubkey: string): Promise<string[]> {
    try {
      // This is a placeholder - in a real implementation we would
      // fetch the user's relay preferences from the network
      return ["wss://relay.damus.io", "wss://relay.nostr.band", "wss://nos.lol"];
    } catch (error) {
      console.error("Error getting relays for user:", error);
      return [];
    }
  }
}
