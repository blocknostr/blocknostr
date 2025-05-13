
import { BaseAdapter } from './base-adapter';

/**
 * Adapter for relay operations
 */
export class RelayAdapter extends BaseAdapter {
  // Relay methods
  async addRelay(relayUrl: string, readWrite: boolean = true) {
    return this.service.addRelay(relayUrl, readWrite);
  }
  
  removeRelay(relayUrl: string) {
    return this.service.removeRelay(relayUrl);
  }
  
  getRelayStatus() {
    return this.service.getRelayStatus();
  }

  getRelayUrls() {
    return this.service.getRelayUrls();
  }
  
  async getRelaysForUser(pubkey: string) {
    return this.service.getRelaysForUser(pubkey);
  }
  
  async connectToDefaultRelays() {
    return this.service.connectToDefaultRelays();
  }
  
  async connectToUserRelays() {
    return this.service.connectToUserRelays();
  }
  
  async addMultipleRelays(relayUrls: string[]) {
    return this.service.addMultipleRelays(relayUrls);
  }
  
  /**
   * Publish relay list according to NIP-65
   * Note: Implementation stub since the base service doesn't have this method yet
   */
  async publishRelayList(relays: { url: string, read: boolean, write: boolean }[]) {
    console.warn('publishRelayList is not fully implemented in the service yet');
    
    // If the service has the method, use it
    if (this.service.relayManager?.publishRelayList) {
      return this.service.relayManager.publishRelayList(relays);
    }
    
    // Return false as default for compatibility
    return false;
  }
  
  get relayManager() {
    return this.service.relayManager;
  }
}
