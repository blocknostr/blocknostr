
import { SimplePool, type Filter, type Event } from 'nostr-tools';
import { toast } from "@/lib/toast";
import { NostrEvent } from '../../types';
import { contentCache } from '../../cache/content-cache';

export interface UserListOptions {
  kind: number;
  identifier: string;
  cacheGetter: () => string[] | null;
  cacheSetter: (list: string[]) => void;
}

/**
 * Base utility class for managing user lists like mute lists and block lists
 * Provides common functionality for adding/removing users and retrieving lists
 */
export class UserListBase {
  protected pool: SimplePool;
  protected getPublicKey: () => string | null;
  protected getConnectedRelayUrls: () => string[];
  protected options: UserListOptions;

  constructor(
    pool: SimplePool,
    getPublicKey: () => string | null,
    getConnectedRelayUrls: () => string[],
    options: UserListOptions
  ) {
    this.pool = pool;
    this.getPublicKey = getPublicKey;
    this.getConnectedRelayUrls = getConnectedRelayUrls;
    this.options = options;
  }

  /**
   * Gets the current user list from cache or relays
   * @returns Array of pubkeys in the list
   */
  async getUserList(): Promise<string[]> {
    const currentUserPubkey = this.getPublicKey();
    if (!currentUserPubkey) {
      return [];
    }

    // Check cache first
    const cachedList = this.options.cacheGetter();
    if (cachedList) {
      return cachedList;
    }

    // If not in cache, fetch from relays
    try {
      const relays = this.getConnectedRelayUrls();
      
      // Create a proper Filter object for querySync
      const filter: Filter = {
        kinds: [this.options.kind],
        authors: [currentUserPubkey],
        limit: 1
      };

      // Use querySync with a single filter
      const events = await this.pool.querySync(relays, filter);

      if (events && events.length > 0) {
        // Extract pubkeys from the 'p' tags
        const pubkeys = events[0].tags
          .filter(tag => tag.length >= 2 && tag[0] === 'p')
          .map(tag => tag[1]);
        
        // Cache the result
        this.options.cacheSetter(pubkeys);
        
        return pubkeys;
      }
      
      // If no events found, return empty array
      return [];
    } catch (error) {
      console.error(`Error fetching ${this.options.identifier} list:`, error);
      return [];
    }
  }

  /**
   * Checks if a user is in the list
   * @param pubkey The pubkey to check
   * @returns True if the user is in the list
   */
  async isUserInList(pubkey: string): Promise<boolean> {
    if (!pubkey) return false;
    
    const list = await this.getUserList();
    return list.includes(pubkey);
  }

  /**
   * Adds a user to the list
   * @param pubkeyToAdd The pubkey of the user to add
   * @returns Whether the operation was successful
   */
  async addUserToList(pubkeyToAdd: string): Promise<boolean> {
    const currentUserPubkey = this.getPublicKey();
    if (!currentUserPubkey) {
      toast.error(`You must be logged in to manage ${this.options.identifier} list`);
      return false;
    }

    // Prevent adding yourself
    if (pubkeyToAdd === currentUserPubkey) {
      toast.error(`You cannot add yourself to ${this.options.identifier} list`);
      return false;
    }

    try {
      // Get current list
      const userList = await this.getUserList();
      
      // Check if already in list
      if (userList.includes(pubkeyToAdd)) {
        return true; // Already in list
      }

      // Add to list
      userList.push(pubkeyToAdd);
      
      // Create list tags following NIP-51
      const tags = userList.map(pubkey => ['p', pubkey]);
      tags.push(['d', this.options.identifier]); // NIP-51 requires 'd' tag with identifier value

      // Create and publish the event
      const event = {
        kind: this.options.kind,
        tags: tags,
        content: '', // NIP-51 lists have empty content
        created_at: Math.floor(Date.now() / 1000),
        pubkey: currentUserPubkey
      } as Event;

      const relays = this.getConnectedRelayUrls();
      
      // Use the browser extension to sign and publish
      if (window.nostr) {
        const signedEvent = await window.nostr.signEvent(event);
        
        await this.pool.publish(relays, signedEvent as Event);
        
        // Update local cache
        this.options.cacheSetter(userList);
        
        return true;
      } else {
        toast.error("No Nostr extension found");
        return false;
      }
    } catch (error) {
      console.error(`Error adding user to ${this.options.identifier} list:`, error);
      toast.error(`Failed to add user to ${this.options.identifier} list`);
      return false;
    }
  }

  /**
   * Removes a user from the list
   * @param pubkeyToRemove The pubkey of the user to remove
   * @returns Whether the operation was successful
   */
  async removeUserFromList(pubkeyToRemove: string): Promise<boolean> {
    const currentUserPubkey = this.getPublicKey();
    if (!currentUserPubkey) {
      toast.error(`You must be logged in to manage ${this.options.identifier} list`);
      return false;
    }

    try {
      // Get current list
      const userList = await this.getUserList();
      
      // Check if not in list
      if (!userList.includes(pubkeyToRemove)) {
        return true; // Already not in list
      }

      // Remove from list
      const updatedList = userList.filter(pubkey => pubkey !== pubkeyToRemove);
      
      // Create list tags following NIP-51
      const tags = updatedList.map(pubkey => ['p', pubkey]);
      tags.push(['d', this.options.identifier]); // NIP-51 requires 'd' tag with identifier value

      // Create and publish the event
      const event = {
        kind: this.options.kind,
        tags: tags,
        content: '', // NIP-51 lists have empty content
        created_at: Math.floor(Date.now() / 1000),
        pubkey: currentUserPubkey
      } as Event;

      const relays = this.getConnectedRelayUrls();
      
      // Use the browser extension to sign and publish
      if (window.nostr) {
        const signedEvent = await window.nostr.signEvent(event);
        
        await this.pool.publish(relays, signedEvent as Event);
        
        // Update local cache
        this.options.cacheSetter(updatedList);
        
        return true;
      } else {
        toast.error("No Nostr extension found");
        return false;
      }
    } catch (error) {
      console.error(`Error removing user from ${this.options.identifier} list:`, error);
      toast.error(`Failed to remove user from ${this.options.identifier} list`);
      return false;
    }
  }
}

