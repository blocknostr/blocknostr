
import { SimplePool, type Filter } from 'nostr-tools';
import { EventManager } from '../event';
import { UserManager } from '../user';
import { EVENT_KINDS } from '../constants';
import { ContactList } from './types';

export class ContactsManager {
  private eventManager: EventManager;
  private userManager: UserManager;
  
  constructor(eventManager: EventManager, userManager: UserManager) {
    this.eventManager = eventManager;
    this.userManager = userManager;
  }
  
  /**
   * Follow a user by adding them to the contact list
   */
  async followUser(
    pool: SimplePool,
    pubkeyToFollow: string,
    privateKey: string | null,
    relayUrls: string[]
  ): Promise<boolean> {
    const publicKey = this.userManager.publicKey;
    if (!publicKey) return false;
    
    try {
      // Get current contact list
      const { pubkeys, tags, content } = await this.getContactList(pool, publicKey, relayUrls);
      
      // Check if already following
      if (pubkeys.includes(pubkeyToFollow)) {
        return true; // Already following
      }
      
      // Add to in-memory following list
      this.userManager.addFollowing(pubkeyToFollow);
      
      // Create updated contact list event
      const updatedTags = [...tags, ["p", pubkeyToFollow]];
      
      const event = {
        kind: EVENT_KINDS.CONTACTS,
        content,
        tags: updatedTags
      };
      
      const eventId = await this.eventManager.publishEvent(pool, publicKey, privateKey, event, relayUrls);
      return !!eventId;
    } catch (error) {
      console.error("Error following user:", error);
      return false;
    }
  }
  
  /**
   * Unfollow a user by removing them from the contact list
   */
  async unfollowUser(
    pool: SimplePool,
    pubkeyToUnfollow: string,
    privateKey: string | null,
    relayUrls: string[]
  ): Promise<boolean> {
    const publicKey = this.userManager.publicKey;
    if (!publicKey) return false;
    
    try {
      // Get current contact list
      const { pubkeys, tags, content } = await this.getContactList(pool, publicKey, relayUrls);
      
      // Check if actually following
      if (!pubkeys.includes(pubkeyToUnfollow)) {
        return true; // Not following, nothing to do
      }
      
      // Remove from in-memory following list
      this.userManager.removeFollowing(pubkeyToUnfollow);
      
      // Create updated contact list event
      const updatedTags = tags.filter(tag => !(tag[0] === 'p' && tag[1] === pubkeyToUnfollow));
      
      const event = {
        kind: EVENT_KINDS.CONTACTS,
        content,
        tags: updatedTags
      };
      
      const eventId = await this.eventManager.publishEvent(pool, publicKey, privateKey, event, relayUrls);
      return !!eventId;
    } catch (error) {
      console.error("Error unfollowing user:", error);
      return false;
    }
  }
  
  /**
   * Get the current contact list for a user
   * @returns Object containing the pubkeys, full tags array, and content
   */
  async getContactList(
    pool: SimplePool,
    pubkey: string,
    relayUrls: string[]
  ): Promise<ContactList> {
    return new Promise((resolve) => {
      const defaultResult: ContactList = {
        pubkeys: [],
        tags: [],
        content: ''
      };
      
      // Subscribe to contact list events - updated for SimplePool API
      const filters: Filter[] = [
        {
          kinds: [EVENT_KINDS.CONTACTS],
          authors: [pubkey],
          limit: 1
        }
      ];
      
      const sub = pool.sub(relayUrls, filters);
      
      sub.on('event', (event) => {
        // Extract p tags (pubkeys) and other tags
        const pTags = event.tags.filter(tag => tag.length >= 2 && tag[0] === 'p');
        const pubkeys = pTags.map(tag => tag[1]);
        
        resolve({
          pubkeys,
          tags: event.tags,
          content: event.content
        });
      });
      
      // Set a timeout to ensure we resolve even if no contact list is found
      setTimeout(() => {
        pool.close([sub.id]);
        resolve(defaultResult);
      }, 5000);
    });
  }
}
