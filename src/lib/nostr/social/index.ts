import { SimplePool } from 'nostr-tools';
import { NostrEvent } from '../types';
import { ReactionCounts, SocialManagerOptions } from './types';
import { InteractionsManager } from './interactions';
import { ContactsManager } from './contacts';
import { EventManager } from '../event';
import { UserManager } from '../user';

export class SocialManager {
  private pool: SimplePool;
  private options: SocialManagerOptions;
  private interactionsManager: InteractionsManager;
  private contactsManager: ContactsManager | null = null;
  private eventManager: EventManager | null = null;
  private userManager: UserManager | null = null;

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

  /**
   * Repost an event (NIP-18)
   */
  async repostEvent(
    pool: SimplePool,
    eventId: string,
    authorPubkey: string,
    relayHint: string | null,
    senderPubkey: string | null,
    privateKey: string | null,
    relayUrls: string[]
  ): Promise<string | null> {
    if (!senderPubkey) return null;
    
    try {
      // Create repost event (kind 6)
      const event = {
        kind: EVENT_KINDS.REPOST,
        content: '',
        tags: [
          ['e', eventId, relayHint || ''],
          ['p', authorPubkey]
        ]
      };
      
      return this.eventManager.publishEvent(pool, senderPubkey, privateKey, event, relayUrls);
    } catch (error) {
      console.error("Error reposting event:", error);
      return null;
    }
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

