
import { nostrService as originalNostrService } from '../service';
import { toast } from "sonner";

/**
 * Relay management adapter methods
 * Enhanced with better connection handling and logging
 */
export class RelayAdapter {
  private service: typeof originalNostrService;
  private lastConnectAttempt: number = 0;
  private connectPromise: Promise<string[]> | null = null;
  private readonly CONNECT_THROTTLE = 2000; // Minimum time between connection attempts
  
  constructor(service: typeof originalNostrService) {
    this.service = service;
  }

  // Relay methods
  async addRelay(relayUrl: string, readWrite: boolean = true) {
    try {
      const result = await this.service.addRelay(relayUrl, readWrite);
      
      if (result) {
        console.log(`Relay added successfully: ${relayUrl}`);
        // Attempt to connect to the newly added relay
        this.connectToRelay(relayUrl);
      } else {
        console.error(`Failed to add relay: ${relayUrl}`);
      }
      
      return result;
    } catch (error) {
      console.error(`Error adding relay ${relayUrl}:`, error);
      return false;
    }
  }
  
  async connectToRelay(relayUrl: string) {
    try {
      console.log(`Attempting to connect to relay: ${relayUrl}`);
      
      // This is a simple implementation since we don't have direct access to connect to a single relay
      // In a more complete implementation, we would connect to the specific relay
      await this.connectToUserRelays();
      
      return true;
    } catch (error) {
      console.error(`Error connecting to relay ${relayUrl}:`, error);
      return false;
    }
  }
  
  removeRelay(relayUrl: string) {
    try {
      console.log(`Removing relay: ${relayUrl}`);
      return this.service.removeRelay(relayUrl);
    } catch (error) {
      console.error(`Error removing relay ${relayUrl}:`, error);
      return false;
    }
  }
  
  getRelayStatus() {
    try {
      const status = this.service.getRelayStatus();
      console.log("Current relay status:", status);
      return status;
    } catch (error) {
      console.error("Error getting relay status:", error);
      return [];
    }
  }

  // Get relay URLs method
  getRelayUrls() {
    try {
      const urls = this.service.getRelayUrls();
      console.log("Available relay URLs:", urls);
      return urls;
    } catch (error) {
      console.error("Error getting relay URLs:", error);
      return [];
    }
  }
  
  // Get relays for user method
  async getRelaysForUser(pubkey: string) {
    try {
      console.log(`Getting relays for user: ${pubkey}`);
      return this.service.getRelaysForUser(pubkey);
    } catch (error) {
      console.error(`Error getting relays for user ${pubkey}:`, error);
      return [];
    }
  }
  
  // Enhanced connection to default relays with throttling and caching
  async connectToDefaultRelays() {
    return this.throttledConnect(() => {
      console.log("Connecting to default relays...");
      return this.service.connectToUserRelays();
    });
  }
  
  // Enhanced connection to user relays with throttling and caching
  async connectToUserRelays() {
    return this.throttledConnect(() => {
      console.log("Connecting to user relays...");
      return this.service.connectToUserRelays();
    });
  }
  
  // Helper method to throttle connection attempts
  private async throttledConnect(connectFn: () => Promise<string[]>): Promise<string[]> {
    const now = Date.now();
    
    // If we already have a connection attempt in progress, return that promise
    if (this.connectPromise) {
      return this.connectPromise;
    }
    
    // Throttle rapid connection attempts
    if (now - this.lastConnectAttempt < this.CONNECT_THROTTLE) {
      console.log("Connection attempt throttled, waiting...");
      await new Promise(resolve => setTimeout(resolve, this.CONNECT_THROTTLE));
    }
    
    // Set the last connect attempt time and create a new promise
    this.lastConnectAttempt = Date.now();
    
    try {
      this.connectPromise = connectFn();
      const connectedRelays = await this.connectPromise;
      
      console.log(`Connected to ${connectedRelays.length} relays:`, connectedRelays);
      
      if (connectedRelays.length === 0) {
        console.error("Failed to connect to any relays");
        toast.error("Could not connect to any relays");
      } else if (connectedRelays.length < 3) {
        console.warn("Connected to only a few relays, this may impact reliability");
      }
      
      return connectedRelays;
    } catch (error) {
      console.error("Error connecting to relays:", error);
      toast.error("Error connecting to relays");
      return [];
    } finally {
      this.connectPromise = null;
    }
  }
  
  async addMultipleRelays(relayUrls: string[]) {
    try {
      console.log(`Adding multiple relays: ${relayUrls.join(', ')}`);
      return this.service.addMultipleRelays(relayUrls);
    } catch (error) {
      console.error("Error adding multiple relays:", error);
      return 0;
    }
  }
  
  get relayManager() {
    return this.service.relayManager;
  }
}
