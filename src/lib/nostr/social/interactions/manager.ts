
import { SimplePool, type Filter } from 'nostr-tools';
import { EventManager } from '../../event';
import { UserManager } from '../../user';
import { EVENT_KINDS } from '../../constants';
import { ReactionCounts } from '../types';
import { getReactionCounts } from './reactions';

export class InteractionsManager {
  private pool: SimplePool;
  private eventManager?: EventManager;
  private userManager?: UserManager;
  
  constructor(pool: SimplePool, options: { eventManager?: EventManager, userManager?: UserManager } = {}) {
    this.pool = pool;
    this.eventManager = options.eventManager;
    this.userManager = options.userManager;
  }
  
  /**
   * React to a note with specific emoji
   * Implements NIP-25: https://github.com/nostr-protocol/nips/blob/master/25.md
   */
  async reactToEvent(
    pool: SimplePool,
    eventId: string,
    emoji: string,
    publicKey: string | null,
    privateKey: string | null,
    relayUrls: string[],
    eventPubkey?: string
  ): Promise<string | null> {
    if (!publicKey || !this.eventManager) return null;
    
    try {
      // Create reaction event (kind 7)
      const event = {
        kind: EVENT_KINDS.REACTION,
        content: emoji,
        tags: [
          ["e", eventId] // Reference to the original event
        ]
      };
      
      // Add pubkey tag if available (helps with indexing)
      if (eventPubkey) {
        event.tags.push(["p", eventPubkey]);
      }
      
      return this.eventManager.publishEvent(pool, publicKey, privateKey, event, relayUrls);
    } catch (error) {
      console.error("Error reacting to event:", error);
      return null;
    }
  }
  
  /**
   * Repost a note
   * Implements NIP-18: https://github.com/nostr-protocol/nips/blob/master/18.md
   */
  async repostEvent(
    pool: SimplePool,
    eventId: string,
    eventPubkey: string,
    relayHint: string | null,
    publicKey: string | null,
    privateKey: string | null,
    relayUrls: string[]
  ): Promise<string | null> {
    if (!publicKey || !this.eventManager) return null;
    
    try {
      // Create tags for repost
      const tags = [
        ["e", eventId, relayHint || ""],
        ["p", eventPubkey]
      ];
      
      // Create repost event (kind 6)
      const event = {
        kind: EVENT_KINDS.REPOST,
        content: JSON.stringify({
          event_id: eventId,
          relay: relayHint,
          pubkey: eventPubkey,
          event: { id: eventId, pubkey: eventPubkey }
        }),
        tags
      };
      
      return this.eventManager.publishEvent(pool, publicKey, privateKey, event, relayUrls);
    } catch (error) {
      console.error("Error reposting event:", error);
      return null;
    }
  }
  
  /**
   * Get reaction counts for an event
   * Supports NIP-25: https://github.com/nostr-protocol/nips/blob/master/25.md
   */
  async getReactionCounts(
    pool: SimplePool,
    eventId: string,
    relayUrls: string[]
  ): Promise<ReactionCounts> {
    const currentPubkey = this.userManager?.publicKey || null;
    return getReactionCounts(pool, eventId, relayUrls, currentPubkey);
  }
}
