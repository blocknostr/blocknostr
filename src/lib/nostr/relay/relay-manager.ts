import { Relay } from "../types";
import { SimplePool } from "nostr-tools";
import { ConnectionManager } from "./connection-manager";

/**
 * Manages relay connections and subscriptions
 */
export class RelayManager {
  private relays: Map<string, Relay> = new Map();
  private pool: SimplePool;
  private connectionManager: ConnectionManager;
  private subscriptions: Map<string, { unsubscribe: () => void }> = new Map();
  private defaultRelays = [
    "wss://relay.damus.io",
    "wss://nos.lol",
    "wss://relay.nostr.band"
  ];
  
  constructor() {
    this.pool = new SimplePool();
    this.connectionManager = new ConnectionManager();
    
    // Initialize with default relays
    this.defaultRelays.forEach(url => {
      this.relays.set(url, {
        url,
        status: 'disconnected',
        read: true,
        write: true
      });
    });
  }
  
  /**
   * Connect to user's preferred relays
   */
  async connectToUserRelays(): Promise<boolean> {
    try {
      console.log("RelayManager: Connecting to user relays...");
      
      // If we have stored user relays, load them
      const userRelaysJson = localStorage.getItem('nostr_relays');
      if (userRelaysJson) {
        try {
          const userRelays = JSON.parse(userRelaysJson);
          
          // Clear existing non-default relays
          for (const url of this.relays.keys()) {
            if (!this.defaultRelays.includes(url)) {
              this.relays.delete(url);
            }
          }
          
          // Add user relays
          for (const relay of userRelays) {
            this.relays.set(relay.url, {
              ...relay,
              status: 'connecting'
            });
          }
        } catch (e) {
          console.error("Error parsing user relays:", e);
        }
      }
      
      // If no relays are defined, use defaults
      if (this.relays.size === 0) {
        return this.connectToDefaultRelays();
      }
      
      // Connect to all relays via ConnectionManager
      const relayUrls = Array.from(this.relays.keys());
      console.log(`RelayManager: Attempting to connect to ${relayUrls.length} relays`);
      
      await this.connectionManager.connectToRelays(relayUrls);
      
      // Update relay statuses based on ConnectionManager state
      relayUrls.forEach(url => {
        const relay = this.relays.get(url);
        if (!relay) return;
        
        relay.status = this.connectionManager.isConnected(url) ? 
          'connected' : 'disconnected';
        
        this.relays.set(url, relay);
      });
      
      // Return success if at least one relay connected
      const connectedCount = Array.from(this.relays.values())
        .filter(r => r.status === 'connected')
        .length;
      
      console.log(`RelayManager: Connected to ${connectedCount}/${relayUrls.length} relays`);
      return connectedCount > 0;
    } catch (error) {
      console.error("Error connecting to user relays:", error);
      return false;
    }
  }
  
  /**
   * Connect to default relays
   */
  async connectToDefaultRelays(): Promise<boolean> {
    try {
      console.log("RelayManager: Connecting to default relays...");
      
      // Connect to default relays via ConnectionManager
      await this.connectionManager.connectToRelays(this.defaultRelays);
      
      // Update relay statuses
      this.defaultRelays.forEach(url => {
        const relay = this.relays.get(url);
        if (!relay) return;
        
        relay.status = this.connectionManager.isConnected(url) ? 
          'connected' : 'disconnected';
        
        this.relays.set(url, relay);
      });
      
      // Return success if at least one relay connected
      const connectedCount = Array.from(this.relays.values())
        .filter(r => r.status === 'connected')
        .length;
      
      console.log(`RelayManager: Connected to ${connectedCount}/${this.defaultRelays.length} default relays`);
      return connectedCount > 0;
    } catch (error) {
      console.error("Error connecting to default relays:", error);
      return false;
    }
  }
  
  /**
   * Connect to a specific relay using ConnectionManager
   */
  private async connectToRelay(url: string): Promise<boolean> {
    try {
      // Update relay status
      const relay = this.relays.get(url);
      if (relay) {
        relay.status = 'connecting';
        this.relays.set(url, relay);
      }
      
      // Use ConnectionManager for actual WebSocket connection
      const connected = await this.connectionManager.connectToRelay(url);
      
      // Update status based on result
      if (relay) {
        relay.status = connected ? 'connected' : 'failed';
        this.relays.set(url, relay);
      }
      
      return connected;
    } catch (error) {
      console.error(`Error connecting to relay ${url}:`, error);
      
      // Update status - Fixed: Use 'failed' instead of 'error'
      const relay = this.relays.get(url);
      if (relay) {
        relay.status = 'failed';
        this.relays.set(url, relay);
      }
      
      return false;
    }
  }
  
  /**
   * Add a new relay
   */
  async addRelay(relayUrl: string, readWrite: boolean = true): Promise<boolean> {
    try {
      // Add relay to list
      this.relays.set(relayUrl, {
        url: relayUrl,
        status: 'disconnected',
        read: readWrite,
        write: readWrite
      });
      
      // Try to connect
      const connected = await this.connectToRelay(relayUrl);
      
      // Save updated relay list
      this.saveRelays();
      
      return connected;
    } catch (error) {
      console.error(`Error adding relay ${relayUrl}:`, error);
      return false;
    }
  }
  
  /**
   * Add multiple relays
   */
  async addMultipleRelays(relayUrls: string[]): Promise<boolean> {
    try {
      // Add relays to list
      for (const url of relayUrls) {
        if (!this.relays.has(url)) {
          this.relays.set(url, {
            url,
            status: 'disconnected',
            read: true,
            write: true
          });
        }
      }
      
      // Try to connect to all
      const connections = await Promise.allSettled(
        relayUrls.map(url => this.connectToRelay(url))
      );
      
      // Save updated relay list
      this.saveRelays();
      
      // Return success if at least one connected
      return connections.some(result => result.status === 'fulfilled' && result.value);
    } catch (error) {
      console.error("Error adding multiple relays:", error);
      return false;
    }
  }
  
  /**
   * Remove a relay
   */
  removeRelay(relayUrl: string): boolean {
    try {
      // Remove relay from list
      const removed = this.relays.delete(relayUrl);
      
      // Save updated relay list
      this.saveRelays();
      
      return removed;
    } catch (error) {
      console.error(`Error removing relay ${relayUrl}:`, error);
      return false;
    }
  }
  
  /**
   * Get relay status
   */
  getRelayStatus(): Relay[] {
    return Array.from(this.relays.values());
  }
  
  /**
   * Get relay URLs
   */
  getRelayUrls(): string[] {
    return Array.from(this.relays.keys());
  }
  
  /**
   * Save relays to local storage
   */
  private saveRelays(): void {
    try {
      const relays = Array.from(this.relays.values());
      localStorage.setItem('nostr_relays', JSON.stringify(relays));
    } catch (error) {
      console.error("Error saving relays:", error);
    }
  }
  
  /**
   * Subscribe to events
   */
  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]): string {
    try {
      // Generate a unique subscription ID
      const subId = `sub-${Math.random().toString(36).slice(2)}`;
      
      // Determine which relays to use
      const relayUrls = relays || Array.from(this.relays.keys()).filter(url => {
        const relay = this.relays.get(url);
        return relay && relay.status === 'connected' && relay.read;
      });
      
      // If no relays, return empty subscription
      if (relayUrls.length === 0) {
        console.warn("No connected relays to subscribe to");
        return subId;
      }
      
      // Create subscription using actual connected relays
      const connectedRelays = relayUrls.filter(url => 
        this.connectionManager.isConnected(url)
      );
      
      if (connectedRelays.length === 0) {
        console.warn("No active websocket connections for subscription");
        return subId;
      }
      
      console.log(`Creating subscription on ${connectedRelays.length} relays`);
      
      const sub = this.pool.subscribeMany(
        connectedRelays,
        filters,
        { onevent: onEvent }
      );
      
      // Store subscription for later cleanup
      this.subscriptions.set(subId, {
        unsubscribe: () => sub.close()
      });
      
      return subId;
    } catch (error) {
      console.error("Error subscribing to events:", error);
      return "";
    }
  }
  
  /**
   * Unsubscribe from events
   */
  unsubscribe(subId: string): boolean {
    try {
      const sub = this.subscriptions.get(subId);
      if (!sub) {
        return false;
      }
      
      // Unsubscribe
      sub.unsubscribe();
      this.subscriptions.delete(subId);
      
      return true;
    } catch (error) {
      console.error(`Error unsubscribing from ${subId}:`, error);
      return false;
    }
  }
  
  /**
   * Publish an event
   */
  async publishEvent(event: Partial<any>, senderPubkey: string | null): Promise<string | null> {
    try {
      if (!senderPubkey) {
        console.error("Cannot publish event: not logged in");
        return null;
      }
      
      // Get write relays
      const writeRelays = Array.from(this.relays.values())
        .filter(relay => relay.status === 'connected' && relay.write)
        .map(relay => relay.url);
      
      if (writeRelays.length === 0) {
        console.error("No connected write relays to publish to");
        return null;
      }
      
      // For now, just return a mock event ID
      // In a real implementation, this would sign and publish the event
      return `mock-event-${Math.random().toString(36).slice(2)}`;
    } catch (error) {
      console.error("Error publishing event:", error);
      return null;
    }
  }
  
  /**
   * Get relays for a user
   */
  async getRelaysForUser(pubkey: string): Promise<string[]> {
    // This would normally fetch the user's relay list
    // For now, just return default relays
    return this.defaultRelays;
  }
  
  /**
   * Clean up connections when manager is destroyed
   */
  cleanup(): void {
    // Clean up connection manager
    this.connectionManager.cleanup();
    
    // Clean up subscriptions
    this.subscriptions.forEach(sub => {
      try {
        sub.unsubscribe();
      } catch (err) {
        console.error("Error cleaning up subscription:", err);
      }
    });
    this.subscriptions.clear();
  }
}
