
import { BaseAdapter } from './base-adapter';

/**
 * Adapter for social interactions (following, messaging, moderation)
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
    return this.service.muteUser?.(pubkey) || false;
  }
  
  async unmuteUser(pubkey: string) {
    return this.service.unmuteUser?.(pubkey) || false;
  }
  
  async isUserMuted(pubkey: string) {
    return this.service.isUserMuted?.(pubkey) || false;
  }
  
  async blockUser(pubkey: string) {
    return this.service.blockUser?.(pubkey) || false;
  }
  
  async unblockUser(pubkey: string) {
    return this.service.unblockUser?.(pubkey) || false;
  }
  
  async isUserBlocked(pubkey: string) {
    return this.service.isUserBlocked?.(pubkey) || false;
  }
  
  // Social manager enhanced methods
  get socialManager() {
    return {
      ...this.service.socialManager,
      likeEvent: async (event: any) => {
        if (this.service.reactToPost) {
          return this.service.reactToPost(event.id);
        }
        return false;
      },
      repostEvent: async (event: any) => {
        if (this.service.repostNote) {
          return this.service.repostNote(event.id, event.pubkey);
        }
        return false;
      },
      getReactionCounts: (eventId: string) => {
        return Promise.resolve({
          likes: 0,
          reposts: 0
        });
      },
      reactToEvent: async (eventId: string, emoji: string = "+") => {
        if (this.service.reactToPost) {
          return this.service.reactToPost(eventId, emoji);
        }
        return false;
      }
    };
  }
}
