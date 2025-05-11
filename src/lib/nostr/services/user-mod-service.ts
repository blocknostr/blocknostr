
import { SimplePool } from 'nostr-tools';
import { EVENT_KINDS } from '../constants';
import { EventService } from './event-service';

/**
 * Service for user moderation (muting, blocking)
 * Implements NIP-51 for lists
 */
export class UserModService {
  constructor(
    private pool: SimplePool,
    private eventService: EventService,
    private getPublicKey: () => string | null,
    private getConnectedRelayUrls: () => string[]
  ) {}
  
  /**
   * Mute a user
   */
  async muteUser(pubkey: string): Promise<boolean> {
    try {
      // Get current mute list
      const mutedUsers = await this.getMutedUsers();
      
      // If already muted, no need to publish a new event
      if (mutedUsers.includes(pubkey)) {
        return true;
      }
      
      // Create new mute list event
      const eventId = await this.eventService.publishEvent({
        kind: EVENT_KINDS.MUTE_LIST,
        content: '',
        tags: [
          ['d', 'mute-list'],
          ...mutedUsers.map(pk => ['p', pk]),
          ['p', pubkey]
        ]
      });
      
      return !!eventId;
    } catch (error) {
      console.error('Error muting user:', error);
      return false;
    }
  }
  
  /**
   * Unmute a user
   */
  async unmuteUser(pubkey: string): Promise<boolean> {
    try {
      // Get current mute list
      const mutedUsers = await this.getMutedUsers();
      
      // If not muted, no need to publish a new event
      if (!mutedUsers.includes(pubkey)) {
        return true;
      }
      
      // Create new mute list event without the specified user
      const updatedList = mutedUsers.filter(pk => pk !== pubkey);
      
      const eventId = await this.eventService.publishEvent({
        kind: EVENT_KINDS.MUTE_LIST,
        content: '',
        tags: [
          ['d', 'mute-list'],
          ...updatedList.map(pk => ['p', pk])
        ]
      });
      
      return !!eventId;
    } catch (error) {
      console.error('Error unmuting user:', error);
      return false;
    }
  }
  
  /**
   * Check if a user is muted
   */
  async isUserMuted(pubkey: string): Promise<boolean> {
    const mutedUsers = await this.getMutedUsers();
    return mutedUsers.includes(pubkey);
  }
  
  /**
   * Get list of muted users
   */
  async getMutedUsers(): Promise<string[]> {
    const currentPubkey = this.getPublicKey();
    if (!currentPubkey) return [];
    
    const relays = this.getConnectedRelayUrls();
    if (relays.length === 0) return [];
    
    try {
      // Get the most recent mute list event
      const events = await this.pool.querySync(relays, {
        kinds: [EVENT_KINDS.MUTE_LIST],
        authors: [currentPubkey],
        '#d': ['mute-list'],
        limit: 1
      });
      
      if (events.length === 0) {
        return [];
      }
      
      // Extract pubkeys from 'p' tags
      const mutedUsers = events[0].tags
        .filter(tag => tag.length >= 2 && tag[0] === 'p')
        .map(tag => tag[1]);
      
      return mutedUsers;
    } catch (error) {
      console.error('Error getting muted users:', error);
      return [];
    }
  }
  
  /**
   * Block a user
   */
  async blockUser(pubkey: string): Promise<boolean> {
    try {
      // Get current block list
      const blockedUsers = await this.getBlockedUsers();
      
      // If already blocked, no need to publish a new event
      if (blockedUsers.includes(pubkey)) {
        return true;
      }
      
      // Create new block list event
      const eventId = await this.eventService.publishEvent({
        kind: EVENT_KINDS.BLOCK_LIST,
        content: '',
        tags: [
          ['d', 'block-list'],
          ...blockedUsers.map(pk => ['p', pk]),
          ['p', pubkey]
        ]
      });
      
      return !!eventId;
    } catch (error) {
      console.error('Error blocking user:', error);
      return false;
    }
  }
  
  /**
   * Unblock a user
   */
  async unblockUser(pubkey: string): Promise<boolean> {
    try {
      // Get current block list
      const blockedUsers = await this.getBlockedUsers();
      
      // If not blocked, no need to publish a new event
      if (!blockedUsers.includes(pubkey)) {
        return true;
      }
      
      // Create new block list event without the specified user
      const updatedList = blockedUsers.filter(pk => pk !== pubkey);
      
      const eventId = await this.eventService.publishEvent({
        kind: EVENT_KINDS.BLOCK_LIST,
        content: '',
        tags: [
          ['d', 'block-list'],
          ...updatedList.map(pk => ['p', pk])
        ]
      });
      
      return !!eventId;
    } catch (error) {
      console.error('Error unblocking user:', error);
      return false;
    }
  }
  
  /**
   * Check if a user is blocked
   */
  async isUserBlocked(pubkey: string): Promise<boolean> {
    const blockedUsers = await this.getBlockedUsers();
    return blockedUsers.includes(pubkey);
  }
  
  /**
   * Get list of blocked users
   */
  async getBlockedUsers(): Promise<string[]> {
    const currentPubkey = this.getPublicKey();
    if (!currentPubkey) return [];
    
    const relays = this.getConnectedRelayUrls();
    if (relays.length === 0) return [];
    
    try {
      // Get the most recent block list event
      const events = await this.pool.querySync(relays, {
        kinds: [EVENT_KINDS.BLOCK_LIST],
        authors: [currentPubkey],
        '#d': ['block-list'],
        limit: 1
      });
      
      if (events.length === 0) {
        return [];
      }
      
      // Extract pubkeys from 'p' tags
      const blockedUsers = events[0].tags
        .filter(tag => tag.length >= 2 && tag[0] === 'p')
        .map(tag => tag[1]);
      
      return blockedUsers;
    } catch (error) {
      console.error('Error getting blocked users:', error);
      return [];
    }
  }
}
