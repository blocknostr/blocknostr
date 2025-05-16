
import { BaseAdapter } from './base-adapter';
import { EVENT_KINDS } from '../constants';

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
    if (this.service.muteUser) {
      return this.service.muteUser(pubkey);
    }
    return false;
  }
  
  async unmuteUser(pubkey: string) {
    if (this.service.unmuteUser) {
      return this.service.unmuteUser(pubkey);
    }
    return false;
  }
  
  async isUserMuted(pubkey: string) {
    if (this.service.isUserMuted) {
      return this.service.isUserMuted(pubkey);
    }
    return false;
  }
  
  async blockUser(pubkey: string) {
    if (this.service.blockUser) {
      return this.service.blockUser(pubkey);
    }
    return false;
  }
  
  async unblockUser(pubkey: string) {
    if (this.service.unblockUser) {
      return this.service.unblockUser(pubkey);
    }
    return false;
  }
  
  async isUserBlocked(pubkey: string) {
    if (this.service.isUserBlocked) {
      return this.service.isUserBlocked(pubkey);
    }
    return false;
  }
  
  // Add the reactToEvent method
  async reactToEvent(eventId: string, emoji: string = "+") {
    if (this.service.reactToPost) {
      return this.service.reactToPost(eventId, emoji);
    }
    return false;
  }
  
  // Social manager enhanced methods
  get socialManager() {
    return {
      ...this.service.socialManager,
      likeEvent: (event: any) => {
        return this.service.reactToPost(event.id);
      },
      repostEvent: (event: any) => {
        return this.service.repostNote(event.id, event.pubkey);
      },
      getReactionCounts: (eventId: string) => {
        return Promise.resolve({
          likes: 0,
          reposts: 0
        });
      },
      reactToEvent: (eventId: string, emoji: string = "+") => {
        return this.reactToEvent(eventId, emoji);
      }
    };
  }
}
