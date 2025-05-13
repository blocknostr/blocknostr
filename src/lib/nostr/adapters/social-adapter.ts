
import { BaseAdapter } from './base-adapter';

/**
 * Adapter for social operations (following, muting, blocking, etc.)
 */
export class SocialAdapter extends BaseAdapter {
  // Social methods
  isFollowing(pubkey: string) {
    return this.service.isFollowing(pubkey);
  }
  
  async followUser(pubkey: string) {
    return this.service.followUser(pubkey);
  }
  
  async unfollowUser(pubkey: string) {
    return this.service.unfollowUser(pubkey);
  }
  
  async sendDirectMessage(recipientPubkey: string, content: string) {
    return this.service.sendDirectMessage(recipientPubkey, content);
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
  
  async reactToPost(eventId: string, emoji: string = '+') {
    return this.service.reactToPost(eventId, emoji);
  }
  
  async repostNote(eventId: string, authorPubkey: string) {
    return this.service.repostNote(eventId, authorPubkey);
  }
  
  get socialManager() {
    return this.service.socialManager;
  }
}
