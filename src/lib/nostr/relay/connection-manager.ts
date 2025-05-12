import { SimplePool } from 'nostr-tools';

/**
 * Manages connections to Nostr relays
 */
export class ConnectionManager {
  private relays: Map<string, WebSocket> = new Map();
  private connectionStatus: Map<string, { connected: boolean, lastAttempt: number, failures: number }> = new Map();
  private reconnectTimers: Map<string, number> = new Map();
  
  constructor() {
    console.log("ConnectionManager initialized");
    
    // Add event listener for online/offline status
    window.addEventListener('online', this.handleOnlineStatus.bind(this, true));
    window.addEventListener('offline', this.handleOnlineStatus.bind(this, false));
  }
  
  /**
   * Handle online/offline status changes
   * @param isOnline Boolean indicating if browser is online
   */
  private handleOnlineStatus(isOnline: boolean) {
    if (isOnline) {
      console.log('Browser went online, attempting to reconnect to relays');
      // Get all relays that were previously connected
      const relaysToReconnect = Array.from(this.connectionStatus.entries())
        .filter(([_, status]) => status.failures < 3)
        .map(([url]) => url);
        
      // Attempt to reconnect
      if (relaysToReconnect.length > 0) {
        this.connectToRelays(relaysToReconnect);
      }
    } else {
      console.log('Browser went offline, marking relays as disconnected');
      // Mark all as disconnected but don't actually close connections
      // This allows them to reconnect when we come back online
      this.connectionStatus.forEach((status, url) => {
        status.connected = false;
      });
    }
  }
  
  /**
   * Connect to a specific relay
   * @param relayUrl URL of the relay to connect to
   * @param retryCount Number of previous attempts (used for backoff)
   * @returns Promise resolving to boolean indicating connection success
   */
  async connectToRelay(relayUrl: string, retryCount: number = 0): Promise<boolean> {
    // Don't try to connect if browser is offline
    if (!navigator.onLine) {
      console.log(`Browser offline, not connecting to ${relayUrl}`);
      return false;
    }
    
    if (this.relays.has(relayUrl) && this.relays.get(relayUrl)?.readyState === WebSocket.OPEN) {
      console.log(`Already connected to ${relayUrl}`);
      return true; // Already connected
    }
    
    console.log(`Connecting to relay: ${relayUrl}`);
    
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
          console.log(`Connected to relay: ${relayUrl}`);
          this.relays.set(relayUrl, socket);
          status.connected = true;
          status.failures = 0;
          
          // Store connection info in localStorage to assist after page reload
          this.saveConnectionState();
          
          resolve(true);
        };
        
        socket.onerror = (error) => {
          console.error(`Error connecting to relay ${relayUrl}:`, error);
          status.failures++;
          resolve(false);
        };
        
        socket.onclose = () => {
          console.log(`Connection closed to relay: ${relayUrl}`);
          status.connected = false;
          this.relays.delete(relayUrl);
          
          // Exponential backoff for reconnection (max ~1 minute)
          if (retryCount < 6) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 60000);
            console.log(`Will try to reconnect to ${relayUrl} in ${delay}ms`);
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
            // Event handling happens in the NostrService class
          } catch (e) {
            console.error('Error parsing relay message:', e);
          }
        };
        
        // Set timeout for connection
        setTimeout(() => {
          if (socket.readyState !== WebSocket.OPEN) {
            console.log(`Connection timeout for relay: ${relayUrl}`);
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
  
  /**
   * Connect to multiple relays at once
   * @param relayUrls Array of relay URLs to connect to
   * @returns Promise resolving when all connection attempts complete
   */
  async connectToRelays(relayUrls: string[]): Promise<void> {
    console.log(`Attempting to connect to ${relayUrls.length} relays`);
    const startTime = performance.now();
    
    const promises = relayUrls.map(url => this.connectToRelay(url));
    await Promise.all(promises);
    
    const connected = relayUrls.filter(url => this.isConnected(url)).length;
    const duration = Math.round(performance.now() - startTime);
    console.log(`Connected to ${connected} out of ${relayUrls.length} relays in ${duration}ms`);
    
    // Save connection state to localStorage
    this.saveConnectionState();
  }
  
  /**
   * Save connection state to localStorage for persistence across page loads
   */
  private saveConnectionState(): void {
    try {
      const connectedRelays = this.getConnectedRelayUrls();
      localStorage.setItem('nostr_connected_relays', JSON.stringify(connectedRelays));
      localStorage.setItem('nostr_last_connection_time', Date.now().toString());
    } catch (e) {
      console.error("Error saving connection state to localStorage:", e);
    }
  }
  
  /**
   * Try to restore connections from localStorage after page reload
   */
  async restoreConnections(): Promise<boolean> {
    try {
      const connectedRelaysJson = localStorage.getItem('nostr_connected_relays');
      const lastConnectionTime = localStorage.getItem('nostr_last_connection_time');
      
      if (connectedRelaysJson && lastConnectionTime) {
        const timeSinceLastConnection = Date.now() - parseInt(lastConnectionTime);
        if (timeSinceLastConnection < 30000) { // Only restore if less than 30 seconds
          console.log("Restoring relay connections after page reload");
          const connectedRelays = JSON.parse(connectedRelaysJson);
          if (Array.isArray(connectedRelays) && connectedRelays.length > 0) {
            await this.connectToRelays(connectedRelays);
            return this.getConnectedRelayUrls().length > 0;
          }
        }
      }
      return false;
    } catch (e) {
      console.error("Error restoring connections:", e);
      return false;
    }
  }
  
  /**
   * Get the websocket for a connected relay
   * @param relayUrl URL of the relay
   * @returns WebSocket instance or undefined if not connected
   */
  getRelaySocket(relayUrl: string): WebSocket | undefined {
    return this.relays.get(relayUrl);
  }
  
  /**
   * Get URLs of all connected relays
   * @returns Array of connected relay URLs
   */
  getConnectedRelayUrls(): string[] {
    return Array.from(this.relays.keys())
      .filter(url => this.relays.get(url)?.readyState === WebSocket.OPEN);
  }
  
  /**
   * Check if a relay is connected
   * @param relayUrl URL of the relay
   * @returns Boolean indicating if relay is connected
   */
  isConnected(relayUrl: string): boolean {
    return this.relays.has(relayUrl) && 
           this.relays.get(relayUrl)?.readyState === WebSocket.OPEN;
  }
  
  /**
   * Disconnect from a relay
   * @param relayUrl URL of the relay to disconnect from
   */
  disconnect(relayUrl: string): void {
    const socket = this.relays.get(relayUrl);
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      socket.close();
      this.relays.delete(relayUrl);
    }
    
    // Clear any reconnect timer
    if (this.reconnectTimers.has(relayUrl)) {
      window.clearTimeout(this.reconnectTimers.get(relayUrl));
      this.reconnectTimers.delete(relayUrl);
    }
  }
  
  /**
   * Clean up all connections and timers
   */
  cleanup(): void {
    // Close all open connections
    this.relays.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    });
    
    this.relays.clear();
    
    // Clear all reconnect timers
    this.reconnectTimers.forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    
    this.reconnectTimers.clear();
    
    // Remove event listeners
    window.removeEventListener('online', this.handleOnlineStatus.bind(this, true));
    window.removeEventListener('offline', this.handleOnlineStatus.bind(this, false));
  }
}
