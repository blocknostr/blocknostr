
import { SimplePool } from 'nostr-tools';
import { Relay } from './types';
import { TrustRelayManager, RelayTrustLevel, TrustedRelay } from './trustRelays';
import { testRelayConnection } from './utils';
import { toast } from 'sonner';

export class RelayManager {
  private _defaultRelays: Map<string, boolean> = new Map([
    ['wss://relay.damus.io', true],
    ['wss://nos.lol', true],
    ['wss://nostr-pub.wellorder.net', true],
    ['wss://relay.nostr.band', true],
  ]);
  private _userRelays: Map<string, boolean> = new Map();
  private _loadedFromStorage: boolean = false;
  private _connectedRelays: Set<string> = new Set();
  private _trustManager: TrustRelayManager;
  private _pool: SimplePool;
  
  constructor(pool: SimplePool) {
    this._pool = pool;
    this._trustManager = new TrustRelayManager();
    this.loadFromStorage();
  }
  
  get userRelays(): Map<string, boolean> {
    return this._userRelays;
  }
  
  get connectedRelays(): string[] {
    return Array.from(this._connectedRelays);
  }
  
  get trustManager(): TrustRelayManager {
    return this._trustManager;
  }
  
  public loadFromStorage(): void {
    try {
      const savedRelays = localStorage.getItem('nostr_relays');
      if (savedRelays) {
        this._userRelays = new Map(JSON.parse(savedRelays));
        this._loadedFromStorage = true;
      }
    } catch (e) {
      console.error('Error loading relays from storage:', e);
      this._loadedFromStorage = false;
    }
  }
  
  public saveToStorage(): void {
    try {
      localStorage.setItem('nostr_relays', JSON.stringify(Array.from(this._userRelays)));
    } catch (e) {
      console.error('Error saving relays to storage:', e);
    }
  }
  
  public async connectToDefaultRelays(): Promise<void> {
    for (const [url, readWrite] of this._defaultRelays) {
      await this.connectToRelay(url, readWrite);
    }
  }
  
  public async connectToUserRelays(): Promise<void> {
    // If no user relays loaded from storage, connect to defaults
    if (!this._loadedFromStorage || this._userRelays.size === 0) {
      return this.connectToDefaultRelays();
    }
    
    // Connect to user relays
    for (const [url, readWrite] of this._userRelays) {
      await this.connectToRelay(url, readWrite);
    }
  }
  
  public async connectToTrustedRelays(minTrustLevel: RelayTrustLevel = RelayTrustLevel.Default): Promise<void> {
    const relays = this._trustManager.getRelaysByTrustLevel(minTrustLevel);
    
    for (const relay of relays) {
      await this.connectToRelay(relay.url, relay.read && relay.write);
    }
  }
  
  private async connectToRelay(url: string, readWrite: boolean): Promise<boolean> {
    try {
      if (!url.startsWith('wss://')) {
        return false;
      }
      
      // Update trusted relay status to connecting
      this._trustManager.updateRelayStatus(url, 'connecting');
      
      // Calculate latency
      try {
        const startTime = performance.now();
        
        // Fix: Properly await the Promise returned by ensureRelay
        const relayPromise = this._pool.ensureRelay(url);
        const relay = await relayPromise;
        
        // Now connect to the resolved relay object
        await relay.connect();
        
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);
        
        this._connectedRelays.add(url);
        
        // Update trusted relay status and latency
        this._trustManager.updateRelayStatus(url, 'connected');
        this._trustManager.updateRelayLatency(url, latency);
        
        return true;
      } catch (error) {
        console.error(`Failed to connect to relay ${url}:`, error);
        this._trustManager.updateRelayStatus(url, 'error');
        return false;
      }
    } catch (error) {
      console.error(`Error connecting to relay ${url}:`, error);
      this._trustManager.updateRelayStatus(url, 'error');
      return false;
    }
  }
  
  public async addRelay(url: string, readWrite: boolean = true): Promise<boolean> {
    // Don't allow invalid relay URLs
    if (!url.startsWith('wss://')) {
      return false;
    }
    
    // Add to user relays
    this._userRelays.set(url, readWrite);
    this.saveToStorage();
    
    // Add as a trusted relay with default trust level
    this._trustManager.addOrUpdateRelay(url, RelayTrustLevel.Default, true, readWrite);
    
    // Try to connect
    const connected = await this.connectToRelay(url, readWrite);
    return connected;
  }
  
  public removeRelay(url: string): void {
    // Remove from user relays
    this._userRelays.delete(url);
    this.saveToStorage();
    
    // Disconnect from pool
    try {
      this._pool.close([url]);
      this._connectedRelays.delete(url);
      
      // Update trusted relay status
      this._trustManager.updateRelayStatus(url, 'disconnected');
    } catch (e) {
      console.error(`Error disconnecting from relay ${url}:`, e);
    }
  }
  
  public async updateRelayTrust(
    url: string, 
    trustLevel: RelayTrustLevel, 
    read: boolean = true, 
    write: boolean = true
  ): Promise<boolean> {
    const success = this._trustManager.addOrUpdateRelay(url, trustLevel, read, write);
    
    if (success) {
      // If increasing trust, also add to user relays if not already there
      if (trustLevel >= RelayTrustLevel.ReadOnly && !this._userRelays.has(url)) {
        this._userRelays.set(url, read && write);
        this.saveToStorage();
        
        // Try to connect if it's not already connected
        if (!this._connectedRelays.has(url)) {
          await this.connectToRelay(url, read && write);
        }
      }
    }
    
    return success;
  }
  
  public getRelayStatus(): Relay[] {
    // Combine information from both user relays and trusted relays
    const relaysStatus: Relay[] = [];
    
    // Convert trusted relays to basic relay objects
    const trustedRelays = this._trustManager.trustedRelays;
    const userRelayUrls = Array.from(this._userRelays.keys());
    
    // First add all user relays
    for (const url of userRelayUrls) {
      const readWrite = this._userRelays.get(url) || false;
      const trustedRelay = trustedRelays.find(r => r.url === url);
      
      relaysStatus.push({
        url,
        status: trustedRelay?.status || (this._connectedRelays.has(url) ? 'connected' : 'disconnected'),
        read: true,
        write: readWrite
      });
    }
    
    // Add trusted relays that aren't in user relays
    for (const relay of trustedRelays) {
      if (!userRelayUrls.includes(relay.url)) {
        relaysStatus.push({
          url: relay.url,
          status: relay.status,
          read: relay.read,
          write: relay.write
        });
      }
    }
    
    return relaysStatus;
  }
  
  public async testRelayConnection(url: string): Promise<number> {
    try {
      // Test connection and measure latency
      const latency = await testRelayConnection(url);
      
      // Update trusted relay status and latency
      this._trustManager.updateRelayStatus(url, 'connected');
      this._trustManager.updateRelayLatency(url, latency);
      
      return latency;
    } catch (error) {
      console.error(`Failed to connect to relay ${url}:`, error);
      this._trustManager.updateRelayStatus(url, 'error');
      throw error;
    }
  }
}
