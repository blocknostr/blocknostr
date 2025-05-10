
import { SimplePool, Filter } from 'nostr-tools';
import { NostrEvent } from '../types';
import { EVENT_KINDS } from '../constants';
import { EventManager } from '../event';
import { UserManager } from '../user';
import { toast } from 'sonner';
import { ReactionCounts } from './types';

/**
 * InteractionsManager handles reactions, reposts and other social interactions
 */
export class InteractionsManager {
  private eventManager: EventManager;
  private userManager: UserManager;
  
  constructor(eventManager: EventManager, userManager: UserManager) {
    this.eventManager = eventManager;
    this.userManager = userManager;
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
    if (!publicKey) {
      toast.error("You must be logged in to react to posts");
      return null;
    }
    
    try {
      // Create tags according to NIP-25
      const tags = [
        ['e', eventId], // Reference to the event being reacted to
        ['p', eventPubkey || ''] // Reference to the pubkey of the event creator (if available)
      ];
      
      // Remove empty pubkey tag if not provided
      if (!eventPubkey) {
        tags.pop();
      }
      
      // Create the reaction event (kind 7)
      const event: Partial<NostrEvent> = {
        kind: EVENT_KINDS.REACTION,
        content: emoji, // "+" for like, or specific emoji
        tags: tags,
        created_at: Math.floor(Date.now() / 1000),
      };
      
      // Publish to relays
      return await this.eventManager.publishEvent(
        pool,
        publicKey,
        privateKey,
        event,
        relayUrls
      );
    } catch (error) {
      console.error("Error reacting to event:", error);
      toast.error("Failed to react to post");
      return null;
    }
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
    if (!publicKey) {
      toast.error("You must be logged in to repost");
      return null;
    }
    
    try {
      // Create tags according to NIP-18
      const tags = [
        ['e', eventId, relayHint || ''], // Include relay hint if available
        ['p', eventPubkey]
      ];

      // Remove relay hint if not provided
      if (!relayHint) {
        tags[0] = ['e', eventId];
      }
      
      // Create the repost event (kind 6)
      const event: Partial<NostrEvent> = {
        kind: EVENT_KINDS.REPOST,
        content: "", // Empty content for standard reposts
        tags: tags,
        created_at: Math.floor(Date.now() / 1000),
      };
      
      // Publish to relays
      return await this.eventManager.publishEvent(
        pool,
        publicKey,
        privateKey,
        event,
        relayUrls
      );
    } catch (error) {
      console.error("Error reposting:", error);
      toast.error("Failed to repost");
      return null;
    }
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
    return new Promise((resolve) => {
      let likes = 0;
      let reposts = 0;
      let userHasLiked = false;
      let userHasReposted = false;
      const likers: string[] = [];
      const currentUserPubkey = this.userManager.publicKey;
      
      // Create filters for reactions and reposts
      const reactionFilter: Filter = {
        kinds: [EVENT_KINDS.REACTION],
        "#e": [eventId]
      };
      
      const repostFilter: Filter = {
        kinds: [EVENT_KINDS.REPOST],
        "#e": [eventId]
      };
      
      // Use subscribeMany for both subscriptions
      const reactSub = pool.subscribeMany(
        relayUrls,
        [reactionFilter], // Pass as an array to subscribeMany
        {
          onevent: (event: NostrEvent) => {
            if (event.content === "+" || event.content === "❤️" || event.content === "❤") {
              likes++;
              likers.push(event.pubkey);
              
              // Check if current user has liked
              if (event.pubkey === currentUserPubkey) {
                userHasLiked = true;
              }
            }
          }
        }
      );
      
      // Subscribe to reposts (kind 6)
      const repostSub = pool.subscribeMany(
        relayUrls,
        [repostFilter], // Pass as an array to subscribeMany
        {
          onevent: (event: NostrEvent) => {
            reposts++;
            
            // Check if current user has reposted
            if (event.pubkey === currentUserPubkey) {
              userHasReposted = true;
            }
          }
        }
      );
      
      // Set timeout to resolve with counts after a short delay
      setTimeout(() => {
        reactSub.close();
        repostSub.close();
        
        resolve({
          likes,
          reposts,
          userHasLiked,
          userHasReposted,
          likers
        });
      }, 2000);
    });
  }
}
