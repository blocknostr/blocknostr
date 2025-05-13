
import { EventManager } from '../event';
import { UserManager } from '../user';
import { SimplePool } from 'nostr-tools';
import { NostrEvent } from '../types';
import { EVENT_KINDS } from '../constants';
import { InteractionsManager } from './interactions';
import { ContactsManager } from './contacts';
import { MessagesManager } from './messages';

/**
 * Social Manager class to handle all social interactions
 * Implements all NIPs related to social interactions
 * including NIP-04, NIP-25, NIP-26, etc.
 */
export class SocialManager {
  private eventManager: EventManager;
  private userManager: UserManager;
  private interactionManager: InteractionsManager;
  private contactManager: ContactsManager;
  private messageManager: MessagesManager;
  
  constructor(eventManager: EventManager, userManager: UserManager) {
    this.eventManager = eventManager;
    this.userManager = userManager;
    this.interactionManager = new InteractionsManager(this.eventManager, this.userManager);
    this.contactManager = new ContactsManager(this.userManager);
    this.messageManager = new MessagesManager(this.eventManager);
  }
  
  /**
   * Follow a user (NIP-02)
   * @param pool SimplePool to use for publishing
   * @param pubkeyToFollow Public key to follow
   * @param privateKey Private key to sign with (optional)
   * @param relays Relays to publish to
   * @returns Promise resolving to boolean indicating success
   */
  public async followUser(pool: SimplePool, pubkeyToFollow: string, privateKey: string | null = null, relays: string[] = []): Promise<boolean> {
    const userPubkey = this.userManager.publicKey;
    if (!userPubkey) return false;
    
    try {
      // Forward to contact manager
      const success = await this.contactManager.addContact(pubkeyToFollow);
      
      if (success) {
        // Update local following list
        this.userManager.addFollowing(pubkeyToFollow);
      }
      
      return success;
    } catch (error) {
      console.error("Error following user:", error);
      return false;
    }
  }
  
  /**
   * Unfollow a user (NIP-02)
   * @param pool SimplePool to use for publishing
   * @param pubkeyToUnfollow Public key to unfollow
   * @param privateKey Private key to sign with (optional)
   * @param relays Relays to publish to
   * @returns Promise resolving to boolean indicating success
   */
  public async unfollowUser(pool: SimplePool, pubkeyToUnfollow: string, privateKey: string | null = null, relays: string[] = []): Promise<boolean> {
    const userPubkey = this.userManager.publicKey;
    if (!userPubkey) return false;
    
    try {
      // Forward to contact manager
      const success = await this.contactManager.removeContact(pubkeyToUnfollow);
      
      if (success) {
        // Update local following list
        this.userManager.removeFollowing(pubkeyToUnfollow);
      }
      
      return success;
    } catch (error) {
      console.error("Error unfollowing user:", error);
      return false;
    }
  }
  
  /**
   * React to an event (NIP-25)
   * @param pool SimplePool to use for publishing
   * @param eventId ID of event to react to
   * @param emoji Emoji to react with (default: '+')
   * @param pubkey Public key of reactor (optional, default: current user)
   * @param privateKey Private key to sign with (optional)
   * @param relays Relays to publish to
   * @returns Promise resolving to reaction event ID or null
   */
  public async reactToEvent(
    pool: SimplePool,
    eventId: string,
    emoji: string = "+",
    pubkey?: string | null,
    privateKey: string | null = null,
    relays: string[] = []
  ): Promise<string | null> {
    // Forward to interaction manager
    return this.interactionManager.reactToEvent(pool, eventId, emoji, pubkey, privateKey, relays);
  }
  
  /**
   * Repost an event (NIP-18)
   * @param pool SimplePool to use for publishing
   * @param eventId ID of event to repost
   * @param authorPubkey Author of original event
   * @param relayHint Relay hint for the original event
   * @param pubkey Public key of reposter (optional, default: current user)
   * @param privateKey Private key to sign with (optional)
   * @param relays Relays to publish to
   * @returns Promise resolving to repost event ID or null
   */
  public async repostEvent(
    pool: SimplePool,
    eventId: string,
    authorPubkey: string,
    relayHint: string | null,
    pubkey?: string | null,
    privateKey: string | null = null,
    relays: string[] = []
  ): Promise<string | null> {
    // Forward to interaction manager
    return this.interactionManager.repostEvent(pool, eventId, authorPubkey, relayHint, pubkey, privateKey, relays);
  }
  
  /**
   * Send a direct message to a user (NIP-04/NIP-44)
   * @param pool SimplePool to use for publishing
   * @param recipientPubkey Recipient's public key
   * @param content Message content to send
   * @param senderPubkey Sender's public key (default: current user)
   * @param privateKey Private key to sign with (optional)
   * @param relays Relays to publish to
   * @returns Promise resolving to message event ID or null
   */
  public async sendDirectMessage(
    pool: SimplePool,
    recipientPubkey: string,
    content: string,
    senderPubkey?: string | null,
    privateKey: string | null = null,
    relays: string[] = []
  ): Promise<string | null> {
    // Forward to message manager
    return this.messageManager.sendDirectMessage(pool, recipientPubkey, content, senderPubkey, privateKey, relays);
  }
}
