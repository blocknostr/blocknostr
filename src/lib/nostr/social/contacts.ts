import { SimplePool } from 'nostr-tools';
import { EVENT_KINDS } from '../constants';
import { NostrEvent } from '../types';
import { ContactList } from './types';

export class ContactsManager {
  private eventManager: any;
  private userManager: any;
  private contactListCache: Map<string, ContactList> = new Map();

  constructor(eventManager: any, userManager: any) {
    this.eventManager = eventManager;
    this.userManager = userManager;
  }

  /**
   * Follow a user by adding their pubkey to the contact list (kind 3)
   */
  async followUser(
    pool: SimplePool,
    pubkey: string,
    privateKey: string | null,
    relays: string[]
  ): Promise<boolean> {
    if (!this.userManager || !this.eventManager) return false;

    try {
      const publicKey = this.userManager.publicKey;
      if (!publicKey || !privateKey) {
        console.warn("Public and private keys are required to follow a user.");
        return false;
      }

      // Get current contact list
      const currentContactList = await this.getContactList(pool, publicKey, relays);
      const currentFollowing = currentContactList?.following || [];

      // Check if already following
      if (currentFollowing.includes(pubkey)) {
        console.log(`Already following ${pubkey}`);
        return true;
      }

      // Add pubkey to the list of people we are following
      const updatedFollowing = [...currentFollowing, pubkey];

      // Create and publish updated contact list event
      const event = {
        kind: EVENT_KINDS.CONTACT_LIST,
        content: "",
        tags: updatedFollowing.map(pk => ["p", pk])
      };

      // Publish the event
      await this.eventManager.publishEvent(pool, publicKey, privateKey, event, relays);
      return true;
    } catch (error) {
      console.error("Error following user:", error);
      return false;
    }
  }

  /**
   * Unfollow a user by removing their pubkey from the contact list (kind 3)
   */
  async unfollowUser(
    pool: SimplePool,
    pubkey: string,
    privateKey: string | null,
    relays: string[]
  ): Promise<boolean> {
    if (!this.userManager || !this.eventManager) return false;

    try {
      const publicKey = this.userManager.publicKey;
      if (!publicKey || !privateKey) {
        console.warn("Public and private keys are required to unfollow a user.");
        return false;
      }

      // Get current contact list
      const currentContactList = await this.getContactList(pool, publicKey, relays);
      const currentFollowing = currentContactList?.following || [];

      // Check if we are actually following the user
      if (!currentFollowing.includes(pubkey)) {
        console.log(`Not following ${pubkey}, cannot unfollow.`);
        return true;
      }

      // Remove the pubkey from the list of people we are following
      const updatedFollowing = currentFollowing.filter(pk => pk !== pubkey);

      // Create and publish updated contact list event
      const event = {
        kind: EVENT_KINDS.CONTACT_LIST,
        content: "",
        tags: updatedFollowing.map(pk => ["p", pk])
      };

      // Publish the event
      await this.eventManager.publishEvent(pool, publicKey, privateKey, event, relays);
      return true;
    } catch (error) {
      console.error("Error unfollowing user:", error);
      return false;
    }
  }

  /**
   * Get the contact list of a user (kind 3)
   */
  async getContactList(pool: SimplePool, pubkey: string, relays: string[]): Promise<ContactList | null> {
    // Check if the contact list is cached
    if (this.contactListCache.has(pubkey)) {
      return this.contactListCache.get(pubkey) || null;
    }

    try {
      // Define filter for contact list event
      const filter = {
        kinds: [EVENT_KINDS.CONTACT_LIST],
        authors: [pubkey],
        limit: 1
      };

      // Fetch contact list event from relays
      const event: NostrEvent | null = await pool.get(relays, filter);

      if (!event) {
        console.warn("No contact list event found, returning empty list.");
        return {
          following: [],
          followers: [],
          muted: [],
          blocked: [],
          pubkeys: [],
          tags: [],
          content: ""
        };
      }

      // Extract pubkeys from 'p' tags
      const following = event.tags.filter(tag => tag[0] === "p").map(tag => tag[1]);

      // Create contact list object
      const contactList: ContactList = {
        following: following,
        followers: [], // This would require a reverse lookup, not implemented here
        muted: [], // Requires mute list implementation
        blocked: [], // Requires block list implementation
        pubkeys: [pubkey],
        tags: event.tags,
        content: event.content
      };

      // Cache the contact list
      this.contactListCache.set(pubkey, contactList);
      return contactList;
    } catch (error) {
      console.error("Error fetching contact list:", error);
      return null;
    }
  }
}
