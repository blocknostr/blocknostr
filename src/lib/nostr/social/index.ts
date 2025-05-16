import { SimplePool } from 'nostr-tools';
import { NostrEvent } from '../types';
import { ReactionCounts, SocialManagerOptions } from './types';
import { InteractionsManager } from './interactions';
import { ContactsManager } from './contacts';
import { EventManager } from '../event';
import { UserManager } from '../user';
import { MessagesManager } from './messages';

export class SocialManager {
  private pool: SimplePool;
  private options: SocialManagerOptions;
  private interactionsManager: InteractionsManager;
  private contactsManager: ContactsManager | null = null;
  private eventManager: EventManager | null = null;
  private userManager: UserManager | null = null;
  private messagesManager: MessagesManager | null = null;

  constructor(pool: SimplePool, options: SocialManagerOptions = {}) {
    this.pool = pool;
    this.options = {
      cacheExpiration: 5 * 60 * 1000, // 5 minutes
      maxCacheSize: 1000,
      enableMetrics: false,
      ...options
    };
    this.interactionsManager = new InteractionsManager(pool, {});

    // Initialize required managers if provided through options
    if (options.eventManager instanceof EventManager) {
      this.eventManager = options.eventManager;
      this.messagesManager = new MessagesManager(this.eventManager);
    }

    if (options.userManager instanceof UserManager) {
      this.userManager = options.userManager;
    }

    // Initialize contacts manager if dependencies are available
    if (this.eventManager && this.userManager) {
      this.contactsManager = new ContactsManager(this.eventManager, this.userManager);
      console.log("ContactsManager initialized in SocialManager");
    }
  }

  // Initialize managers after construction if they weren't available at construction time
  public initializeManagers(eventManager: EventManager, userManager: UserManager): void {
    if (!this.eventManager) {
      this.eventManager = eventManager;
    }

    if (!this.userManager) {
      this.userManager = userManager;
    }

    if (!this.contactsManager && this.eventManager && this.userManager) {
      this.contactsManager = new ContactsManager(this.eventManager, this.userManager);
      console.log("ContactsManager initialized after construction in SocialManager");
    }
  }

  // Implement methods needed for service.ts
  async followUser(
    pool: SimplePool,
    pubkey: string,
    privateKey: string | null,
    relays: string[]
  ): Promise<boolean> {
    console.log(`SocialManager.followUser called for pubkey: ${pubkey}`);

    // Use ContactsManager if available
    if (this.contactsManager) {
      console.log(`Delegating to ContactsManager.followUser for pubkey: ${pubkey}`);
      return this.contactsManager.followUser(pool, pubkey, privateKey, relays);
    } else {
      console.warn(`ContactsManager not available, cannot follow user: ${pubkey}`);
      return false;
    }
  }

  async unfollowUser(
    pool: SimplePool,
    pubkey: string,
    privateKey: string | null,
    relays: string[]
  ): Promise<boolean> {
    console.log(`SocialManager.unfollowUser called for pubkey: ${pubkey}`);

    // Use ContactsManager if available
    if (this.contactsManager) {
      console.log(`Delegating to ContactsManager.unfollowUser for pubkey: ${pubkey}`);
      return this.contactsManager.unfollowUser(pool, pubkey, privateKey, relays);
    } else {
      console.warn(`ContactsManager not available, cannot unfollow user: ${pubkey}`);
      return false;
    }
  }

  async sendDirectMessage(
    pool: SimplePool,
    recipientPubkey: string,
    content: string,
    senderPubkey: string | null,
    privateKey: string | null,
    relays: string[]
  ): Promise<string | null> {
    if (!this.messagesManager) {
      if (this.eventManager) {
        this.messagesManager = new MessagesManager(this.eventManager);
      } else {
        console.error("No EventManager available for sending direct message");
        return null;
      }
    }
    return this.messagesManager.sendDirectMessage(
      pool,
      recipientPubkey,
      content,
      senderPubkey,
      privateKey,
      relays
    );
  }

  async reactToEvent(
    pool: SimplePool,
    eventId: string,
    emoji: string,
    pubkey: string | null,
    privateKey: string | null,
    relays: string[]
  ): Promise<string | null> {
    console.log(`Reacting to event ${eventId} with ${emoji}`);
    return "reaction-id"; // Placeholder implementation
  }

  async repostEvent(
    pool: SimplePool,
    eventId: string,
    authorPubkey: string,
    relayHint: string | null,
    pubkey: string | null,
    privateKey: string | null,
    relays: string[]
  ): Promise<string | null> {
    console.log(`Reposting event ${eventId}`);
    return "repost-id"; // Placeholder implementation
  }

  // Method to get reaction counts
  async getReactionCounts(eventId: string, relays: string[]): Promise<ReactionCounts> {
    // Return default values for now
    return {
      likes: 0,
      reposts: 0,
      replies: 0,
      zaps: 0,
      zapAmount: 0
    };
  }
}
