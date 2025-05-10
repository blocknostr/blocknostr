
import { SimplePool } from 'nostr-tools';
import { toast } from "sonner";
import { EventManager } from './event';
import { EVENT_KINDS } from './constants';
import { UserManager } from './user';

export class SocialManager {
  private eventManager: EventManager;
  private userManager: UserManager;
  
  constructor(eventManager: EventManager, userManager: UserManager) {
    this.eventManager = eventManager;
    this.userManager = userManager;
  }
  
  async followUser(
    pool: SimplePool,
    pubkey: string,
    privateKey: string | null,
    relays: string[]
  ): Promise<boolean> {
    const currentUserPubkey = this.userManager.publicKey;
    if (!currentUserPubkey) {
      toast.error("You must be logged in to follow users");
      return false;
    }
    
    try {
      // Add to local following set
      this.userManager.addFollowing(pubkey);
      
      // Publish updated contacts list
      const event = {
        kind: EVENT_KINDS.CONTACTS,
        content: '',
        tags: Array.from(this.userManager.following).map(pk => ['p', pk])
      };
      
      const eventId = await this.eventManager.publishEvent(
        pool,
        currentUserPubkey,
        privateKey,
        event,
        relays
      );
      
      return !!eventId;
    } catch (error) {
      console.error("Error following user:", error);
      return false;
    }
  }
  
  async unfollowUser(
    pool: SimplePool,
    pubkey: string,
    privateKey: string | null,
    relays: string[]
  ): Promise<boolean> {
    const currentUserPubkey = this.userManager.publicKey;
    if (!currentUserPubkey) {
      toast.error("You must be logged in to unfollow users");
      return false;
    }
    
    try {
      // Remove from local following set
      this.userManager.removeFollowing(pubkey);
      
      // Publish updated contacts list
      const event = {
        kind: EVENT_KINDS.CONTACTS,
        content: '',
        tags: Array.from(this.userManager.following).map(pk => ['p', pk])
      };
      
      const eventId = await this.eventManager.publishEvent(
        pool,
        currentUserPubkey,
        privateKey,
        event,
        relays
      );
      
      return !!eventId;
    } catch (error) {
      console.error("Error unfollowing user:", error);
      return false;
    }
  }
  
  async sendDirectMessage(
    pool: SimplePool,
    recipientPubkey: string,
    content: string,
    currentUserPubkey: string | null,
    privateKey: string | null,
    relays: string[]
  ): Promise<string | null> {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to send messages");
      return null;
    }
    
    try {
      // Encrypt message using NIP-04 if available through extension
      let encryptedContent = content;
      
      if (window.nostr && window.nostr.nip04) {
        encryptedContent = await window.nostr.nip04.encrypt(recipientPubkey, content);
      } else {
        toast.error("Message encryption not available - install a Nostr extension with NIP-04 support");
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
        currentUserPubkey,
        privateKey,
        event,
        relays
      );
    } catch (error) {
      console.error("Error sending direct message:", error);
      toast.error("Failed to send message");
      return null;
    }
  }
}
