
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
    return this.service.connectToUserRelays();
  }
  
  async connectToUserRelays() {
    return this.service.connectToUserRelays();
  }
  
  async addMultipleRelays(relayUrls: string[]) {
    return this.service.addMultipleRelays(relayUrls);
  }
  
  get relayManager() {
    return this.service.relayManager;
  }
}
