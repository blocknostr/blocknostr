
import { SimplePool, nip19, getEventHash } from 'nostr-tools';
import { NostrEvent } from './types';
import { EVENT_KINDS } from './constants';
import { UserManager } from './user';
import { toast } from 'sonner';

export class SocialManager {
  private eventManager: any;
  private userManager: UserManager;
  
  constructor(eventManager: any, userManager: UserManager) {
    this.eventManager = eventManager;
    this.userManager = userManager;
  }
  
  /**
   * Follow a user by adding them to the contact list
   * Implements NIP-02: https://github.com/nostr-protocol/nips/blob/master/02.md
   */
  public async followUser(
    pool: SimplePool,
    pubkeyToFollow: string,
    privateKey: string | null,
    relayUrls: string[]
  ): Promise<boolean> {
    if (!this.userManager.publicKey) return false;
    
    try {
      // First, get current contact list
      const contacts = await this.getContactList(pool, this.userManager.publicKey, relayUrls);
      
      // Check if already following
      if (contacts.pubkeys.includes(pubkeyToFollow)) {
        return true; // Already following
      }
      
      // Add the new pubkey to follow to the contacts list
      contacts.pubkeys.push(pubkeyToFollow);
      
      // Create the event tags (proper NIP-02 format: ['p', <pubkey>, <relay URL>, <petname>])
      const tags = contacts.pubkeys.map(key => {
        // Find existing tag if available
        const existingTag = contacts.tags.find(tag => tag[1] === key);
        if (existingTag) {
          return existingTag;
        }
        // Create a new tag with default values
        return ['p', key];
      });
      
      // Create the contact list event (kind 3)
      const event: Partial<NostrEvent> = {
        kind: EVENT_KINDS.CONTACTS,
        tags: tags,
        content: contacts.content || '', // Preserve existing content
        created_at: Math.floor(Date.now() / 1000),
      };
      
      // Publish the event
      const eventId = await this.eventManager.publishEvent(
        pool,
        this.userManager.publicKey,
        privateKey,
        event,
        relayUrls
      );
      
      if (eventId) {
        // Update local state
        this.userManager.addFollowing(pubkeyToFollow);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error following user:", error);
      return false;
    }
  }
  
  /**
   * Unfollow a user by removing them from the contact list
   * Implements NIP-02: https://github.com/nostr-protocol/nips/blob/master/02.md
   */
  public async unfollowUser(
    pool: SimplePool,
    pubkeyToUnfollow: string,
    privateKey: string | null,
    relayUrls: string[]
  ): Promise<boolean> {
    if (!this.userManager.publicKey) return false;
    
    try {
      // Get current contact list
      const contacts = await this.getContactList(pool, this.userManager.publicKey, relayUrls);
      
      // Check if actually following
      if (!contacts.pubkeys.includes(pubkeyToUnfollow)) {
        return true; // Already not following
      }
      
      // Remove the pubkey from the list
      const filteredPubkeys = contacts.pubkeys.filter(key => key !== pubkeyToUnfollow);
      
      // Create the event tags, removing the user to unfollow
      const tags = contacts.tags.filter(tag => tag[1] !== pubkeyToUnfollow);
      
      // Create the contact list event (kind 3)
      const event: Partial<NostrEvent> = {
        kind: EVENT_KINDS.CONTACTS,
        tags: tags,
        content: contacts.content || '', // Preserve existing content
        created_at: Math.floor(Date.now() / 1000),
      };
      
      // Publish the event
      const eventId = await this.eventManager.publishEvent(
        pool,
        this.userManager.publicKey,
        privateKey,
        event,
        relayUrls
      );
      
      if (eventId) {
        // Update local state
        this.userManager.removeFollowing(pubkeyToUnfollow);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error unfollowing user:", error);
      return false;
    }
  }
  
  /**
   * Get the current contact list for a user
   * @returns Object containing the pubkeys, full tags array, and content
   */
  private async getContactList(
    pool: SimplePool,
    pubkey: string,
    relayUrls: string[]
  ): Promise<{ pubkeys: string[], tags: string[][], content: string }> {
    return new Promise((resolve) => {
      // Initialize with empty arrays
      let pubkeys: string[] = [];
      let tags: string[][] = [];
      let content = '';
      
      // Subscribe to contact list events - Fix for SimplePool (using subscribe instead of sub)
      const sub = pool.subscribe(
        relayUrls,
        [
          {
            kinds: [EVENT_KINDS.CONTACTS],
            authors: [pubkey],
            limit: 1
          }
        ],
        {
          // Event callback
          event: (event: NostrEvent) => {
            if (event.kind === EVENT_KINDS.CONTACTS) {
              // Extract pubkeys from p tags
              tags = event.tags.filter(tag => tag.length >= 2 && tag[0] === 'p');
              pubkeys = tags.map(tag => tag[1]);
              content = event.content;
              
              // Close subscription after getting the event
              sub.close();
              resolve({ pubkeys, tags, content });
            }
          }
        }
      );
      
      // Set timeout to avoid waiting forever
      setTimeout(() => {
        sub.close();
        resolve({ pubkeys, tags, content });
      }, 5000);
    });
  }
  
  /**
   * Send a direct message to a user
   * NIP-04: Encrypted Direct Messages
   */
  public async sendDirectMessage(
    pool: SimplePool,
    recipientPubkey: string,
    content: string,
    senderPubkey: string | null,
    privateKey: string | null,
    relayUrls: string[]
  ): Promise<string | null> {
    if (!senderPubkey) {
      toast.error("You must be logged in to send messages");
      return null;
    }
    
    try {
      // Use NIP-04 encryption through extension (standard method)
      let encryptedContent = content;
      let encryptionSuccessful = false;
      
      if (window.nostr?.nip04) {
        // Use NIP-04 encryption through extension
        try {
          encryptedContent = await window.nostr.nip04.encrypt(recipientPubkey, content);
          encryptionSuccessful = true;
          console.log("Message encrypted with NIP-04");
        } catch (e) {
          console.error("NIP-04 encryption failed:", e);
        }
      }
      
      if (!encryptionSuccessful) {
        toast.error("Message encryption failed - install a Nostr extension with NIP-04 support");
        return null;
      }
      
      // Create the direct message event (NIP-17)
      const event = {
        kind: EVENT_KINDS.ENCRYPTED_DM, // Using kind 14 (NIP-17)
        content: encryptedContent,
        tags: [
          ['p', recipientPubkey]
        ]
      };
      
      // Publish to relays
      return await this.eventManager.publishEvent(
        pool,
        senderPubkey,
        privateKey,
        event,
        relayUrls
      );
    } catch (error) {
      console.error("Error sending direct message:", error);
      toast.error("Failed to send message");
      return null;
    }
  }
}
