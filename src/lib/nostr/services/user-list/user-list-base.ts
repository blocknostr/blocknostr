
import { SimplePool, type Filter, type Event } from 'nostr-tools';
import { toast } from 'sonner';
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
    return this.getTagList('p');
  }

  /**
   * Gets a list of tags of a specific type from cache or relays
   * @param tagType The tag type (e.g., 'p' for pubkeys, 't' for topics)
   * @returns Array of tag values
   */
  async getTagList(tagType: string = 'p'): Promise<string[]> {
    const currentUserPubkey = this.getPublicKey();
    if (!currentUserPubkey) {
      return [];
    }

    // Check cache first if it's a pubkey list
    if (tagType === 'p' && this.options.cacheGetter) {
      const cachedList = this.options.cacheGetter();
      if (cachedList) {
        return cachedList;
      }
    }

    // If not in cache, fetch from relays
    try {
      const relays = this.getConnectedRelayUrls();
      
      // Create a proper Filter object for querySync with correct d tag for NIP-51
      const filter: Filter = {
        kinds: [this.options.kind],
        authors: [currentUserPubkey],
        '#d': [this.options.identifier],
        limit: 1
      };

      // Use querySync with a single filter
      const events = await this.pool.querySync(relays, filter);

      if (events && events.length > 0) {
        // Extract values from the specified tag type
        const tagValues = events[0].tags
          .filter(tag => tag.length >= 2 && tag[0] === tagType)
          .map(tag => tag[1]);
        
        // Cache the result if it's a pubkey list
        if (tagType === 'p' && this.options.cacheSetter) {
          this.options.cacheSetter(tagValues);
        }
        
        return tagValues;
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
    return this.isTagInList('p', pubkey);
  }

  /**
   * Checks if a tag is in the list
   * @param tagType The tag type (e.g., 'p', 't')
   * @param value The tag value to check
   * @returns True if the tag is in the list
   */
  async isTagInList(tagType: string, value: string): Promise<boolean> {
    if (!value) return false;
    
    const list = await this.getTagList(tagType);
    return list.includes(value);
  }

  /**
   * Adds a user to the list
   * @param pubkeyToAdd The pubkey of the user to add
   * @returns Whether the operation was successful
   */
  async addUserToList(pubkeyToAdd: string): Promise<boolean> {
    return this.addTagToList('p', pubkeyToAdd);
  }

  /**
   * Adds a tag to the list
   * @param tagType The tag type (e.g., 'p' for pubkeys, 't' for topics) 
   * @param valueToAdd The value to add
   * @returns Whether the operation was successful
   */
  async addTagToList(tagType: string, valueToAdd: string): Promise<boolean> {
    const currentUserPubkey = this.getPublicKey();
    if (!currentUserPubkey) {
      toast.error(`You must be logged in to manage ${this.options.identifier} list`);
      return false;
    }

    // Prevent adding yourself if it's a pubkey
    if (tagType === 'p' && valueToAdd === currentUserPubkey) {
      toast.error(`You cannot add yourself to ${this.options.identifier} list`);
      return false;
    }

    try {
      // Get current tags
      const tagList = await this.getTagList(tagType);
      
      // Check if already in list
      if (tagList.includes(valueToAdd)) {
        return true; // Already in list
      }

      // Add to list
      tagList.push(valueToAdd);
      
      // Create all tags following NIP-51
      let tags: string[][] = [];
      
      // Add existing tags of the same type
      for (const value of tagList) {
        tags.push([tagType, value]);
      }
      
      // Add d tag with identifier value per NIP-51
      tags.push(['d', this.options.identifier]); 

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
        
        // Update local cache if it's a pubkey list
        if (tagType === 'p' && this.options.cacheSetter) {
          this.options.cacheSetter(tagList);
        }
        
        return true;
      } else {
        toast.error("No Nostr extension found");
        return false;
      }
    } catch (error) {
      console.error(`Error adding to ${this.options.identifier} list:`, error);
      toast.error(`Failed to add to ${this.options.identifier} list`);
      return false;
    }
  }

  /**
   * Removes a user from the list
   * @param pubkeyToRemove The pubkey of the user to remove
   * @returns Whether the operation was successful
   */
  async removeUserFromList(pubkeyToRemove: string): Promise<boolean> {
    return this.removeTagFromList('p', pubkeyToRemove);
  }

  /**
   * Removes a tag from the list
   * @param tagType The tag type (e.g., 'p', 't')
   * @param valueToRemove The tag value to remove
   * @returns Whether the operation was successful
   */
  async removeTagFromList(tagType: string, valueToRemove: string): Promise<boolean> {
    const currentUserPubkey = this.getPublicKey();
    if (!currentUserPubkey) {
      toast.error(`You must be logged in to manage ${this.options.identifier} list`);
      return false;
    }

    try {
      // Get current list
      const tagList = await this.getTagList(tagType);
      
      // Check if not in list
      if (!tagList.includes(valueToRemove)) {
        return true; // Already not in list
      }

      // Remove from list
      const updatedList = tagList.filter(value => value !== valueToRemove);
      
      // Create all tags of the specified type
      let tags: string[][] = [];
      
      // Add remaining tags
      for (const value of updatedList) {
        tags.push([tagType, value]);
      }
      
      // Add d tag with identifier per NIP-51
      tags.push(['d', this.options.identifier]);

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
        
        // Update local cache if it's a pubkey list
        if (tagType === 'p' && this.options.cacheSetter) {
          this.options.cacheSetter(updatedList);
        }
        
        return true;
      } else {
        toast.error("No Nostr extension found");
        return false;
      }
    } catch (error) {
      console.error(`Error removing from ${this.options.identifier} list:`, error);
      toast.error(`Failed to remove from ${this.options.identifier} list`);
      return false;
    }
  }
}
