
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
   */
  async publishRelayList(relays: { url: string, read: boolean, write: boolean }[]) {
    if (this.service.publishRelayList) {
      return this.service.publishRelayList(relays);
    }
    return false;
  }
  
  get relayManager() {
    return this.service.relayManager;
  }
}
