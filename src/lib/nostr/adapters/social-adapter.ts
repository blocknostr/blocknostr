
import { nostrService as originalNostrService } from '../service';

/**
 * Social interactions adapter methods (following, reactions, etc.)
 */
export class SocialAdapter {
  private service: typeof originalNostrService;
  
  constructor(service: typeof originalNostrService) {
    this.service = service;
  }
  
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
  
  get socialManager() {
    return {
      ...this.service.socialManager,
      likeEvent: (event: any) => {
        return this.service.reactToPost(event.id);
      },
      repostEvent: (event: any) => {
        return this.service.repostNote(event.id, event.pubkey);
      },
      // Add missing getReactionCounts method
      getReactionCounts: (eventId: string) => {
        // Implement a basic version that returns zeros
        return Promise.resolve({
          likes: 0,
          reposts: 0
        });
      },
      // Add missing reactToEvent method
      reactToEvent: (eventId: string, emoji: string = "+") => {
        return this.service.reactToPost(eventId, emoji);
      }
    };
  }
}
