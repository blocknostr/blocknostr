
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
    console.log("ContactsManager initialized");
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
    console.log(`ContactsManager.followUser called for: ${pubkeyToFollow}`);
    const publicKey = this.userManager.publicKey;
    if (!publicKey) {
      console.error("No public key available, cannot follow user");
      return false;
    }
    
    try {
      // Get current contact list
      const contactList = await this.getContactList(pool, publicKey, relayUrls);
      
      // Check if already following
      if (contactList.following.includes(pubkeyToFollow)) {
        console.log(`Already following ${pubkeyToFollow}`);
        return true; // Already following
      }
      
      // Add to in-memory following list
      this.userManager.addFollowing(pubkeyToFollow);
      
      // Create updated contact list event
      const updatedTags = [...(contactList.tags || []), ["p", pubkeyToFollow]];
      
      const event = {
        kind: EVENT_KINDS.CONTACTS,
        content: contactList.content || '',
        tags: updatedTags
      };
      
      console.log(`Publishing CONTACTS event (kind ${EVENT_KINDS.CONTACTS}) to ${relayUrls.length} relays`);
      const eventId = await this.eventManager.publishEvent(pool, publicKey, privateKey, event, relayUrls);
      
      if (eventId) {
        console.log(`Successfully published follow event with ID: ${eventId}`);
      } else {
        console.error("Failed to publish follow event");
      }
      
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
    console.log(`ContactsManager.unfollowUser called for: ${pubkeyToUnfollow}`);
    const publicKey = this.userManager.publicKey;
    if (!publicKey) {
      console.error("No public key available, cannot unfollow user");
      return false;
    }
    
    try {
      // Get current contact list
      const contactList = await this.getContactList(pool, publicKey, relayUrls);
      
      // Check if actually following
      if (!contactList.following.includes(pubkeyToUnfollow)) {
        console.log(`Not following ${pubkeyToUnfollow}, nothing to unfollow`);
        return true; // Not following, nothing to do
      }
      
      // Remove from in-memory following list
      this.userManager.removeFollowing(pubkeyToUnfollow);
      
      // Create updated contact list event
      const updatedTags = (contactList.tags || []).filter(tag => !(tag[0] === 'p' && tag[1] === pubkeyToUnfollow));
      
      const event = {
        kind: EVENT_KINDS.CONTACTS,
        content: contactList.content || '',
        tags: updatedTags
      };
      
      console.log(`Publishing CONTACTS event (kind ${EVENT_KINDS.CONTACTS}) to ${relayUrls.length} relays`);
      const eventId = await this.eventManager.publishEvent(pool, publicKey, privateKey, event, relayUrls);
      
      if (eventId) {
        console.log(`Successfully published unfollow event with ID: ${eventId}`);
      } else {
        console.error("Failed to publish unfollow event");
      }
      
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
    console.log(`Getting contact list for ${pubkey} from ${relayUrls.length} relays`);
    return new Promise((resolve) => {
      const defaultResult: ContactList = {
        following: [],
        followers: [],
        muted: [],
        blocked: [],
        pubkeys: [],
        tags: [],
        content: ''
      };
      
      if (relayUrls.length === 0) {
        console.warn("No relay URLs provided for getContactList");
        resolve(defaultResult);
        return;
      }
      
      // Create a filter for contact list events
      const filter: Filter = {
        kinds: [EVENT_KINDS.CONTACTS],
        authors: [pubkey],
        limit: 1
      };
      
      console.log(`Subscribing to CONTACTS events (kind ${EVENT_KINDS.CONTACTS}) for ${pubkey}`);
      
      // Using a single filter now, not an array
      const sub = pool.subscribe(relayUrls, filter, {
        onevent: (event) => {
          console.log(`Received contact list event for ${pubkey}:`, event);
          // Extract p tags (pubkeys) and other tags
          const pTags = event.tags.filter(tag => tag.length >= 2 && tag[0] === 'p');
          const pubkeys = pTags.map(tag => tag[1]);
          
          console.log(`Found ${pubkeys.length} contacts for ${pubkey}`);
          
          resolve({
            following: pubkeys,  // Set extracted pubkeys as following
            followers: [],
            muted: [],
            blocked: [],
            pubkeys,
            tags: event.tags,
            content: event.content
          });
        }
      });
      
      // Set a timeout to ensure we resolve even if no contact list is found
      setTimeout(() => {
        sub.close();
        console.log(`Timeout reached while getting contact list for ${pubkey}`);
        resolve(defaultResult);
      }, 5000);
    });
  }
}

