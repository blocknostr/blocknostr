import { SimplePool } from 'nostr-tools';
import { Relay, SubCloser } from './types';

export class RelayManager {
  private relays: Map<string, WebSocket> = new Map();
  private defaultRelays: string[] = [
    'wss://relay.damus.io',
    'wss://relay.nostr.band',
    'wss://nostr.bitcoiner.social'
  ];
  private _userRelays: Map<string, boolean> = new Map(); // Map of relay URLs to read/write status
  private pool: SimplePool;
  private subClosers: Map<string, SubCloser> = new Map(); // Store SubCloser functions
  
  constructor(pool: SimplePool) {
    this.pool = pool;
    this.loadUserRelays();
  }
  
  get userRelays(): Map<string, boolean> {
    return new Map(this._userRelays);
  }
  
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
  
  async addRelay(relayUrl: string, readWrite: boolean = true): Promise<boolean> {
    // Validate URL format
    try {
      new URL(relayUrl);
    } catch (e) {
      return false;
    }
    
    // Add to user relays
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
    Array.from(this._userRelays.keys()).forEach(url => {
      const isConnected = this.relays.has(url) && this.relays.get(url)?.readyState === WebSocket.OPEN;
      const isConnecting = this.relays.has(url) && this.relays.get(url)?.readyState === WebSocket.CONNECTING;
      
      relayMap.set(url, {
        url,
        status: isConnected ? 'connected' : (isConnecting ? 'connecting' : 'disconnected'),
        read: true,
        write: !!this._userRelays.get(url)
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
  
  async getRelaysForUser(pubkey: string): Promise<string[]> {
    return new Promise((resolve) => {
      const relays: string[] = [];
      
      // Subscribe to relay list event
      const subId = `relay_${Math.random().toString(36).substr(2, 9)}`;
      
      const subCloser = this.pool.subscribeMany(
        Array.from(this._userRelays.keys()),
        [
          {
            kinds: [10050], // Relay list events
            authors: [pubkey],
            limit: 1
          }
        ],
        {
          onevent: (event) => {
            // Extract relay URLs from r tags
            const relayTags = event.tags.filter(tag => tag[0] === 'r' && tag.length >= 2);
            relayTags.forEach(tag => {
              if (tag[1] && typeof tag[1] === 'string') {
                relays.push(tag[1]);
              }
            });
          }
        }
      );
      
      // Store the closer function
      this.subClosers.set(subId, subCloser);
      
      // Set a timeout to resolve with found relays
      setTimeout(() => {
        // Execute the closer function
        if (this.subClosers.has(subId)) {
          this.subClosers.get(subId)?.();
          this.subClosers.delete(subId);
        }
        resolve(relays);
      }, 3000);
    });
  }
  
  // New method to add multiple relays at once
  async addMultipleRelays(relayUrls: string[]): Promise<number> {
    if (!relayUrls.length) return 0;
    
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
}
