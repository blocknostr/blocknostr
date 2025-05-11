
import { SimplePool } from 'nostr-tools';
import { NostrEvent } from '../types';
import { EVENT_KINDS } from '../constants';
import { EventService } from './event-service';

/**
 * Service for social interactions like following, reacting, and reposting
 */
export class SocialService {
  constructor(
    private pool: SimplePool,
    private eventService: EventService,
    private getPublicKey: () => string | null,
    private getFollowing: () => string[],
    private setFollowing: (following: string[]) => void
  ) {}
  
  /**
   * Check if a user is being followed
   */
  isFollowing(pubkey: string): boolean {
    return this.getFollowing().includes(pubkey);
  }
  
  /**
   * Follow a user
   */
  async followUser(pubkey: string, relays?: string[]): Promise<boolean> {
    const currentPubkey = this.getPublicKey();
    if (!currentPubkey) return false;
    
    try {
      const following = this.getFollowing();
      
      // If already following, no need to publish a new event
      if (following.includes(pubkey)) {
        return true;
      }
      
      // Create the new following list with the new pubkey
      const updatedFollowing = [...following, pubkey];
      
      // Create tags for the contact list event
      const tags = updatedFollowing.map(pk => ['p', pk]);
      
      // Publish the contact list event
      const eventId = await this.eventService.publishEvent({
        kind: EVENT_KINDS.CONTACTS,
        tags,
        content: ''
      }, relays);
      
      if (eventId) {
        // Update the following list in memory
        this.setFollowing(updatedFollowing);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error following user:', error);
      return false;
    }
  }
  
  /**
   * Unfollow a user
   */
  async unfollowUser(pubkey: string, relays?: string[]): Promise<boolean> {
    const currentPubkey = this.getPublicKey();
    if (!currentPubkey) return false;
    
    try {
      const following = this.getFollowing();
      
      // If not following, no need to publish a new event
      if (!following.includes(pubkey)) {
        return true;
      }
      
      // Create the new following list without the pubkey
      const updatedFollowing = following.filter(pk => pk !== pubkey);
      
      // Create tags for the contact list event
      const tags = updatedFollowing.map(pk => ['p', pk]);
      
      // Publish the contact list event
      const eventId = await this.eventService.publishEvent({
        kind: EVENT_KINDS.CONTACTS,
        tags,
        content: ''
      }, relays);
      
      if (eventId) {
        // Update the following list in memory
        this.setFollowing(updatedFollowing);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  }
  
  /**
   * React to a post with an emoji (NIP-25)
   */
  async reactToEvent(eventId: string, emoji: string = "+", relays?: string[]): Promise<string | null> {
    try {
      return this.eventService.publishEvent({
        kind: EVENT_KINDS.REACTION,
        content: emoji,
        tags: [
          ['e', eventId]
        ]
      }, relays);
    } catch (error) {
      console.error('Error reacting to post:', error);
      return null;
    }
  }
  
  /**
   * Repost a note (NIP-18)
   */
  async repostEvent(eventId: string, authorPubkey: string, relayHint: string | null = null, relays?: string[]): Promise<string | null> {
    try {
      const tags: string[][] = [
        ['e', eventId],
        ['p', authorPubkey]
      ];
      
      // Add relay hint if provided
      if (relayHint) {
        tags[0].push(relayHint);
      }
      
      return this.eventService.publishEvent({
        kind: EVENT_KINDS.REPOST,
        content: '',
        tags
      }, relays);
    } catch (error) {
      console.error('Error reposting event:', error);
      return null;
    }
  }
}
