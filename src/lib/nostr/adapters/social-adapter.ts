
import { BaseAdapter } from './base-adapter';
import { NostrEvent } from '../types';

/**
 * Adapter for social interactions like following, muting, and blocking users
 */
export class SocialAdapter extends BaseAdapter {
  /**
   * Check if the current user is following a pubkey
   */
  isFollowing(pubkey: string): boolean {
    return this.service.socialManager.isFollowing(pubkey);
  }
  
  /**
   * Follow a user
   */
  async followUser(pubkey: string): Promise<boolean> {
    return this.service.socialManager.followUser(pubkey);
  }
  
  /**
   * Unfollow a user
   */
  async unfollowUser(pubkey: string): Promise<boolean> {
    return this.service.socialManager.unfollowUser(pubkey);
  }
  
  /**
   * Send a direct message to a user
   */
  async sendDirectMessage(recipientPubkey: string, content: string): Promise<string | null> {
    return this.service.sendDirectMessage(recipientPubkey, content);
  }
  
  /**
   * Mute a user
   */
  async muteUser(pubkey: string): Promise<boolean> {
    return this.service.socialManager.muteUser(pubkey);
  }
  
  /**
   * Unmute a user
   */
  async unmuteUser(pubkey: string): Promise<boolean> {
    return this.service.socialManager.unmuteUser(pubkey);
  }
  
  /**
   * Check if a user is muted
   */
  async isUserMuted(pubkey: string): Promise<boolean> {
    return this.service.socialManager.isUserMuted(pubkey);
  }
  
  /**
   * Block a user
   */
  async blockUser(pubkey: string): Promise<boolean> {
    return this.service.socialManager.blockUser(pubkey);
  }
  
  /**
   * Unblock a user
   */
  async unblockUser(pubkey: string): Promise<boolean> {
    return this.service.socialManager.unblockUser(pubkey);
  }
  
  /**
   * Check if a user is blocked
   */
  async isUserBlocked(pubkey: string): Promise<boolean> {
    return this.service.socialManager.isUserBlocked(pubkey);
  }
  
  /**
   * Access the social manager
   */
  get socialManager() {
    return {
      likeEvent: (eventId: string): Promise<string | null> => {
        return this.service.socialManager.reactToPost(eventId, '+');
      },
      repostEvent: (event: NostrEvent): Promise<string | null> => {
        return this.service.socialManager.repostNote(event.id, event.pubkey || '');
      },
      getReactionCounts: (eventId: string): Promise<{ likes: number, reposts: number }> => {
        return this.service.socialManager.getReactionCounts(eventId);
      },
      reactToEvent: (eventId: string, emoji?: string): Promise<string | null> => {
        return this.service.socialManager.reactToPost(eventId, emoji || '+');
      }
    };
  }
  
  /**
   * React to a post
   */
  async reactToPost(eventId: string, reaction: string = '+'): Promise<string | null> {
    return this.service.socialManager.reactToPost(eventId, reaction);
  }
  
  /**
   * Repost a note
   */
  async repostNote(eventId: string, authorPubkey: string): Promise<string | null> {
    return this.service.socialManager.repostNote(eventId, authorPubkey);
  }
}
