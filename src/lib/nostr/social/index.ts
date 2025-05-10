
import { SimplePool } from 'nostr-tools';
import { NostrEvent } from '../types';
import { EVENT_KINDS } from '../constants';
import { UserManager } from '../user';
import { EventManager } from '../event';
import { ContactsManager } from './contacts';
import { MessagesManager } from './messages';
import { InteractionsManager } from './interactions';
import { ReactionCounts, ContactList } from './types';

/**
 * SocialManager class that coordinates all social interactions
 * with other specialized managers
 */
export class SocialManager {
  private eventManager: EventManager;
  private userManager: UserManager;
  private contactsManager: ContactsManager;
  private messagesManager: MessagesManager;
  private interactionsManager: InteractionsManager;
  
  constructor(eventManager: EventManager, userManager: UserManager) {
    this.eventManager = eventManager;
    this.userManager = userManager;
    this.contactsManager = new ContactsManager(eventManager, userManager);
    this.messagesManager = new MessagesManager(eventManager);
    this.interactionsManager = new InteractionsManager(eventManager, userManager);
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
    return this.contactsManager.followUser(pool, pubkeyToFollow, privateKey, relayUrls);
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
    return this.contactsManager.unfollowUser(pool, pubkeyToUnfollow, privateKey, relayUrls);
  }
  
  /**
   * Get the current contact list for a user
   * @returns Object containing the pubkeys, full tags array, and content
   */
  public async getContactList(
    pool: SimplePool,
    pubkey: string,
    relayUrls: string[]
  ): Promise<ContactList> {
    return this.contactsManager.getContactList(pool, pubkey, relayUrls);
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
    return this.messagesManager.sendDirectMessage(
      pool,
      recipientPubkey,
      content,
      senderPubkey,
      privateKey,
      relayUrls
    );
  }
  
  /**
   * React to a note with specific emoji
   * Implements NIP-25: https://github.com/nostr-protocol/nips/blob/master/25.md
   */
  public async reactToEvent(
    pool: SimplePool,
    eventId: string,
    emoji: string,
    publicKey: string | null,
    privateKey: string | null,
    relayUrls: string[],
    eventPubkey?: string
  ): Promise<string | null> {
    return this.interactionsManager.reactToEvent(
      pool,
      eventId,
      emoji,
      publicKey,
      privateKey,
      relayUrls,
      eventPubkey
    );
  }
  
  /**
   * Repost a note
   * Implements NIP-18: https://github.com/nostr-protocol/nips/blob/master/18.md
   */
  public async repostEvent(
    pool: SimplePool,
    eventId: string,
    eventPubkey: string,
    relayHint: string | null,
    publicKey: string | null,
    privateKey: string | null,
    relayUrls: string[]
  ): Promise<string | null> {
    return this.interactionsManager.repostEvent(
      pool,
      eventId,
      eventPubkey,
      relayHint,
      publicKey,
      privateKey,
      relayUrls
    );
  }
  
  /**
   * Get reaction counts for an event
   * Supports NIP-25: https://github.com/nostr-protocol/nips/blob/master/25.md
   */
  public async getReactionCounts(
    pool: SimplePool,
    eventId: string,
    relayUrls: string[]
  ): Promise<ReactionCounts> {
    return this.interactionsManager.getReactionCounts(pool, eventId, relayUrls);
  }
}

export * from './types';
