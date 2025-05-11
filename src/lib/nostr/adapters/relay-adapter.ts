
import { nostrService as originalNostrService } from '../service';

/**
 * Relay management adapter methods
 */
export class RelayAdapter {
  private service: typeof originalNostrService;
  
  constructor(service: typeof originalNostrService) {
    this.service = service;
  }

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

  // Get relay URLs method
  getRelayUrls() {
    return this.service.getRelayUrls();
  }
  
  // Get relays for user method
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
