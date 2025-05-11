import { SimplePool } from 'nostr-tools';
import { Relay } from './types';

export class RelayManager {
  private relays: Map<string, WebSocket> = new Map();
  private defaultRelays: string[] = [
    'wss://relay.damus.io',
    'wss://relay.nostr.band',
    'wss://nostr.bitcoiner.social'
  ];
  private _userRelays: Map<string, boolean> = new Map(); // Map of relay URLs to read/write status
  private pool: SimplePool;
  private reconnectTimers: Map<string, number> = new Map();
  private connectionStatus: Map<string, { connected: boolean, lastAttempt: number, failures: number }> = new Map();
  private healthCheckInterval: number | null = null;
  
  constructor(pool: SimplePool) {
    this.pool = pool;
    this.loadUserRelays();
    this.startHealthCheck();
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
  
  async connectToRelay(relayUrl: string, retryCount: number = 0): Promise<boolean> {
    if (this.relays.has(relayUrl) && this.relays.get(relayUrl)?.readyState === WebSocket.OPEN) {
      return true; // Already connected
    }
    
    // Track connection attempt
    if (!this.connectionStatus.has(relayUrl)) {
      this.connectionStatus.set(relayUrl, { connected: false, lastAttempt: Date.now(), failures: 0 });
    }
    
    const status = this.connectionStatus.get(relayUrl)!;
    status.lastAttempt = Date.now();
    
    // Clear any existing reconnect timer
    if (this.reconnectTimers.has(relayUrl)) {
      window.clearTimeout(this.reconnectTimers.get(relayUrl));
      this.reconnectTimers.delete(relayUrl);
    }
    
    try {
      const socket = new WebSocket(relayUrl);
      
      return new Promise((resolve) => {
        socket.onopen = () => {
          this.relays.set(relayUrl, socket);
          status.connected = true;
          status.failures = 0;
          resolve(true);
        };
        
        socket.onerror = () => {
          status.failures++;
          resolve(false);
        };
        
        socket.onclose = () => {
          status.connected = false;
          this.relays.delete(relayUrl);
          
          // Exponential backoff for reconnection (max ~1 minute)
          if (retryCount < 6 && this._userRelays.has(relayUrl)) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 60000);
            const timerId = window.setTimeout(() => {
              this.connectToRelay(relayUrl, retryCount + 1);
            }, delay);
            this.reconnectTimers.set(relayUrl, timerId);
          }
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
        
        // Set timeout for connection
        setTimeout(() => {
          if (socket.readyState !== WebSocket.OPEN) {
            socket.close();
            resolve(false);
          }
        }, 5000);
      });
    } catch (error) {
      console.error(`Failed to connect to relay ${relayUrl}:`, error);
      status.failures++;
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
  
  // Health check for relay connections
  private startHealthCheck(): void {
    if (this.healthCheckInterval !== null) {
      window.clearInterval(this.healthCheckInterval);
    }
    
    // Check relay health every 30 seconds
    this.healthCheckInterval = window.setInterval(() => {
      this.performHealthCheck();
    }, 30000);
  }
  
  private async performHealthCheck(): Promise<void> {
    // Check all user relays
    for (const relayUrl of this._userRelays.keys()) {
      const socket = this.relays.get(relayUrl);
      
      // If not connected or socket is closing/closed, try to reconnect
      if (!socket || socket.readyState > WebSocket.OPEN) {
        this.connectToRelay(relayUrl);
      }
    }
  }
  
  // Method to pick best relays for a specific operation
  pickBestRelays(operation: 'read' | 'write', count: number = 3): string[] {
    const connectedRelays = this.getRelayStatus()
      .filter(relay => relay.status === 'connected')
      .filter(relay => operation === 'read' || (operation === 'write' && relay.write));
    
    // If we have enough connected relays, use them
    if (connectedRelays.length >= count) {
      return connectedRelays.slice(0, count).map(relay => relay.url);
    }
    
    // Otherwise, return all available relays that match the criteria
    return connectedRelays.map(relay => relay.url);
  }
  
  // Clean up when manager is destroyed
  cleanup(): void {
    // Clear the health check interval
    if (this.healthCheckInterval !== null) {
      window.clearInterval(this.healthCheckInterval);
    }
    
    // Clear all reconnect timers
    this.reconnectTimers.forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    
    // Close all open connections
    this.relays.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    });
    
    this.relays.clear();
  }
}
