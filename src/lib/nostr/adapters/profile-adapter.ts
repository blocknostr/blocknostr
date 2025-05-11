
import { nostrService as originalNostrService } from '../service';

/**
 * Profile-related adapter methods
 */
export class ProfileAdapter {
  private service: typeof originalNostrService;
  
  constructor(service: typeof originalNostrService) {
    this.service = service;
  }

  // Profile methods
  async getProfilesByPubkeys(pubkeys: string[]) {
    return this.service.getProfilesByPubkeys(pubkeys);
  }
  
  async getUserProfile(pubkey: string) {
    return this.service.getUserProfile(pubkey);
  }
  
  async verifyNip05(identifier: string, pubkey: string) {
    return this.service.verifyNip05(identifier, pubkey);
  }
}
