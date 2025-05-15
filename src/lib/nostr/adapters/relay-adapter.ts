import { BaseAdapter } from './base-adapter';

/**
 * Adapter for relay-related operations
 */
export class RelayAdapter extends BaseAdapter {
  /**
   * Add a new relay
   */
  async addRelay(relayUrl: string, readWrite: boolean = true): Promise<boolean> {
    try {
      // Normalize relay URL
      if (!relayUrl.startsWith('wss://') && !relayUrl.startsWith('ws://')) {
        relayUrl = `wss://${relayUrl}`;
      }
      
      // Get current relays
      const currentRelays = this.getRelayUrls();
      
      // Check if already connected
      if (currentRelays.includes(relayUrl)) {
        console.log(`Already connected to relay: ${relayUrl}`);
        return true;
      }
      
      // Connect to the relay
      try {
        const connectedRelays = await this.relayManager.connectToRelays([relayUrl]);
        return connectedRelays.length > 0;
      } catch (error) {
        console.error(`Failed to connect to relay ${relayUrl}:`, error);
        return false;
      }
    } catch (error) {
      console.error(`Error adding relay ${relayUrl}:`, error);
      return false;
    }
  }
  
  /**
   * Remove a relay
   */
  removeRelay(relayUrl: string): void {
    try {
      this.relayManager.disconnectFromRelay(relayUrl);
    } catch (error) {
      console.error(`Error removing relay ${relayUrl}:`, error);
    }
  }
  
  /**
   * Get relay status information
   */
  getRelayStatus() {
    return this.service.getRelayStatus();
  }
  
  /**
   * Get URLs of connected relays
   */
  getRelayUrls(): string[] {
    return this.service.getConnectedRelayUrls();
  }
  
  /**
   * Get relays for user (NIP-65)
   */
  async getRelaysForUser(pubkey: string): Promise<Record<string, {read: boolean, write: boolean}>> {
    try {
      return await this.relayManager.getRelaysForUser(pubkey);
    } catch (error) {
      console.error(`Error getting relays for user ${pubkey}:`, error);
      return {};
    }
  }
  
  /**
   * Connect to default relays
   */
  async connectToDefaultRelays(): Promise<string[]> {
    try {
      return await this.service.connectToDefaultRelays();
    } catch (error) {
      console.error("Error connecting to default relays:", error);
      return [];
    }
  }
  
  /**
   * Connect to user relays
   */
  async connectToUserRelays(): Promise<void> {
    try {
      return await this.service.connectToUserRelays();
    } catch (error) {
      console.error("Error connecting to user relays:", error);
    }
  }
  
  /**
   * Add multiple relays at once
   */
  async addMultipleRelays(relayUrls: string[]): Promise<string[]> {
    try {
      // Filter out invalid URLs
      const validUrls = relayUrls.filter(url => url && (url.startsWith('wss://') || url.startsWith('ws://')));
      
      if (validUrls.length === 0) {
        console.warn("No valid relay URLs provided");
        return [];
      }
      
      // Connect to the relays
      return await this.relayManager.connectToRelays(validUrls);
    } catch (error) {
      console.error("Error adding multiple relays:", error);
      return [];
    }
  }
  
  /**
   * Publish relay list (NIP-65)
   */
  async publishRelayList(relays: { url: string, read: boolean, write: boolean }[]): Promise<boolean> {
    try {
      if (!this.service.publicKey) {
        console.error("Cannot publish relay list: not logged in");
        return false;
      }
      
      // Create NIP-65 relay list event
      const event = {
        kind: 10002, // NIP-65 relay list metadata
        content: "",
        tags: relays.map(relay => ["r", relay.url, relay.read ? "read" : "", relay.write ? "write" : ""])
      };
      
      // Publish the event
      const eventId = await this.service.publishEvent(event);
      return !!eventId;
    } catch (error) {
      console.error("Error publishing relay list:", error);
      return false;
    }
  }
  
  /**
   * Access the relay manager
   */
  get relayManager() {
    return this.service.getRelayManager();
  }
}
