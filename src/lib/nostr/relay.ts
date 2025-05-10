
import { SimplePool } from 'nostr-tools';
import { Relay } from './types';

export class RelayManager {
  private relays: Map<string, WebSocket> = new Map();
  private defaultRelays: string[] = [
    'wss://relay.damus.io',
    'wss://relay.nostr.band',
    'wss://nostr.bitcoiner.social'
  ];
  private _userRelays: Map<string, {read: boolean; write: boolean}> = new Map(); // NIP-65 format
  private pool: SimplePool;
  
  constructor(pool: SimplePool) {
    this.pool = pool;
    this.loadUserRelays();
  }
  
  get userRelays(): Map<string, {read: boolean; write: boolean}> {
    return new Map(this._userRelays);
  }
  
  loadUserRelays(): void {
    const savedRelays = localStorage.getItem('nostr_user_relays');
    if (savedRelays) {
      try {
        const relaysObject = JSON.parse(savedRelays);
        // Convert to Map with read/write properties per NIP-65
        this._userRelays = new Map(
          Object.entries(relaysObject).map(([url, value]) => {
            // Handle both old format (boolean) and new format (object with read/write)
            if (typeof value === 'boolean') {
              return [url, { read: true, write: value }];
            } else {
              return [url, value as {read: boolean; write: boolean}];
            }
          })
        );
      } catch (e) {
        console.error('Error loading user relays:', e);
      }
    } else {
      // Default to the app's default relays
      this.defaultRelays.forEach(relay => {
        this._userRelays.set(relay, { read: true, write: true }); // Read/write by default
      });
    }
  }
  
  saveUserRelays(): void {
    const relaysObject = Object.fromEntries(this._userRelays);
    localStorage.setItem('nostr_user_relays', JSON.stringify(relaysObject));
  }
  
  async connectToRelay(relayUrl: string): Promise<boolean> {
    if (this.relays.has(relayUrl)) {
      return true; // Already connected
    }
    
    try {
      const socket = new WebSocket(relayUrl);
      
      return new Promise((resolve) => {
        socket.onopen = () => {
          this.relays.set(relayUrl, socket);
          resolve(true);
        };
        
        socket.onerror = () => {
          resolve(false);
        };
        
        socket.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            // Handle different types of messages from the relay
            if (data[0] === 'EVENT' && data[1]) {
              const subId = data[1];
              const event = data[2];
              
              // Event handling happens in the NostrService class
              // which will use the subscription callbacks
            }
          } catch (e) {
            console.error('Error parsing relay message:', e);
          }
        };
      });
    } catch (error) {
      console.error(`Failed to connect to relay ${relayUrl}:`, error);
      return false;
    }
  }
  
  async connectToDefaultRelays(): Promise<void> {
    const promises = this.defaultRelays.map(url => this.connectToRelay(url));
    await Promise.all(promises);
  }
  
  async connectToUserRelays(): Promise<void> {
    const promises = Array.from(this._userRelays.keys()).map(url => this.connectToRelay(url));
    await Promise.all(promises);
  }
  
  async addRelay(relayUrl: string, readWrite: {read: boolean; write: boolean} = {read: true, write: true}): Promise<boolean> {
    // Validate URL format
    try {
      new URL(relayUrl);
    } catch (e) {
      return false;
    }
    
    // Add to user relays with NIP-65 format
    this._userRelays.set(relayUrl, readWrite);
    this.saveUserRelays();
    
    // Try to connect
    const connected = await this.connectToRelay(relayUrl);
    return connected;
  }
  
  removeRelay(relayUrl: string): void {
    this._userRelays.delete(relayUrl);
    this.saveUserRelays();
    
    // Close connection if exists
    const socket = this.relays.get(relayUrl);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
      this.relays.delete(relayUrl);
    }
  }
  
  getRelayStatus(): Relay[] {
    // First get all relays from userRelays
    const relayMap = new Map<string, Relay>();
    
    // Add all user relays first (even if not connected)
    Array.from(this._userRelays.entries()).forEach(([url, permissions]) => {
      const isConnected = this.relays.has(url) && this.relays.get(url)?.readyState === WebSocket.OPEN;
      const isConnecting = this.relays.has(url) && this.relays.get(url)?.readyState === WebSocket.CONNECTING;
      
      relayMap.set(url, {
        url,
        status: isConnected ? 'connected' : (isConnecting ? 'connecting' : 'disconnected'),
        read: permissions.read,
        write: permissions.write
      });
    });
    
    // Add any connected relays that might not be in userRelays yet
    Array.from(this.relays.entries()).forEach(([url, socket]) => {
      if (!relayMap.has(url)) {
        let status: Relay['status'];
        switch (socket.readyState) {
          case WebSocket.CONNECTING:
            status = 'connecting';
            break;
          case WebSocket.OPEN:
            status = 'connected';
            break;
          default:
            status = 'disconnected';
        }
        
        relayMap.set(url, {
          url,
          status,
          read: true,
          write: true
        });
      }
    });
    
    return Array.from(relayMap.values());
  }
  
  // Update relay permissions
  updateRelayPermissions(relayUrl: string, permissions: {read: boolean; write: boolean}): boolean {
    if (!this._userRelays.has(relayUrl)) {
      return false;
    }
    
    this._userRelays.set(relayUrl, permissions);
    this.saveUserRelays();
    return true;
  }
  
  // New method to add multiple relays at once with NIP-65 format
  async addMultipleRelays(relays: {url: string, read: boolean, write: boolean}[]): Promise<number> {
    if (!relays.length) return 0;
    
    let successCount = 0;
    
    for (const relay of relays) {
      try {
        const success = await this.addRelay(relay.url, {read: relay.read, write: relay.write});
        if (success) successCount++;
      } catch (error) {
        console.error(`Failed to add relay ${relay.url}:`, error);
      }
    }
    
    return successCount;
  }
  
  // Create a NIP-65 formatted relay list for publishing
  getNIP65RelayList(): Record<string, {read: boolean, write: boolean}> {
    return Object.fromEntries(this._userRelays);
  }
}
