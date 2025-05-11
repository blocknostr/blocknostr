
import { nostrService as originalNostrService } from '../service';

/**
 * User moderation adapter methods
 */
export class ModerationAdapter {
  private service: typeof originalNostrService;
  
  constructor(service: typeof originalNostrService) {
    this.service = service;
  }

  // User moderation methods
  async muteUser(pubkey: string) {
    return this.service.muteUser(pubkey);
  }
  
  async unmuteUser(pubkey: string) {
    return this.service.unmuteUser(pubkey);
  }
  
  async isUserMuted(pubkey: string) {
    return this.service.isUserMuted(pubkey);
  }
  
  async blockUser(pubkey: string) {
    return this.service.blockUser(pubkey);
  }
  
  async unblockUser(pubkey: string) {
    return this.service.unblockUser(pubkey);
  }
  
  async isUserBlocked(pubkey: string) {
    return this.service.isUserBlocked(pubkey);
  }
}
