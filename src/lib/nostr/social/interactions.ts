
import { SimplePool, type Filter } from 'nostr-tools';
import { EventManager } from '../event';
import { UserManager } from '../user';
import { EVENT_KINDS } from '../constants';
import { ReactionCounts, ZapInfo } from './types';

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
  async reactToEvent(
    pool: SimplePool,
    eventId: string,
    emoji: string,
    publicKey: string | null,
    privateKey: string | null,
    relayUrls: string[],
    eventPubkey?: string
  ): Promise<string | null> {
    if (!publicKey) return null;
    
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
    if (!publicKey) return null;
    
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
    const currentPubkey = this.userManager.publicKey;
    
    return new Promise((resolve) => {
      let likes = 0;
      let reposts = 0;
      let zaps = 0;
      let zapAmount = 0;
      let replies = 0;
      let userHasLiked = false;
      let userHasReposted = false;
      let userHasZapped = false;
      const likers: string[] = [];
      const reposters: string[] = [];
      const zappers: string[] = [];
      
      // Create a filter for reactions (kind 7)
      const reactionsFilter: Filter = {
        kinds: [EVENT_KINDS.REACTION],
        "#e": [eventId],
        limit: 100
      };
      
      // Use single filter subscription
      const reactionsSub = pool.subscribe(relayUrls, reactionsFilter, {
        onevent: (event) => {
          // Count likes (positive reactions)
          const content = event.content.trim();
          if (["+", "👍", "❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "♥️"].includes(content)) {
            likes++;
            likers.push(event.pubkey);
            
            // Check if current user has liked
            if (currentPubkey && event.pubkey === currentPubkey) {
              userHasLiked = true;
            }
          }
        }
      });
      
      // Create a filter for reposts (kind 6)
      const repostsFilter: Filter = {
        kinds: [EVENT_KINDS.REPOST],
        "#e": [eventId],
        limit: 50
      };
      
      // Use single filter subscription
      const repostsSub = pool.subscribe(relayUrls, repostsFilter, {
        onevent: (event) => {
          reposts++;
          reposters.push(event.pubkey);
          
          // Check if current user has reposted
          if (currentPubkey && event.pubkey === currentPubkey) {
            userHasReposted = true;
          }
        }
      });
      
      // Set a timeout to resolve with found counts
      setTimeout(() => {
        reactionsSub.close();
        repostsSub.close();
        
        resolve({
          likes,
          reposts,
          zaps,
          zapAmount,
          replies,
          userHasLiked,
          userHasReposted,
          userHasZapped,
          likers,
          reposters,
          zappers
        });
      }, 2000);
    });
  }
}

// Add Zap functionality (NIP-57)
export async function sendZap(
  pool: SimplePool,
  recipientPubkey: string,
  amount: number, // in sats
  content: string = "",
  relayUrls: string[],
  lnurl?: string,
  eventId?: string
): Promise<string | null> {
  try {
    // First, get recipient's Lightning payment information
    const lnurlOrAddress = lnurl || await getLightningAddress(pool, recipientPubkey, relayUrls);
    
    if (!lnurlOrAddress) {
      console.error("No Lightning address found for recipient");
      return null;
    }
    
    // Create zap request and get invoice
    const invoice = await createZapRequest(lnurlOrAddress, amount, content, recipientPubkey, eventId);
    
    if (!invoice) {
      console.error("Failed to create Lightning invoice");
      return null;
    }
    
    // In a real implementation, we would open the invoice in a Lightning wallet
    // For now, we'll just return the invoice for demonstration
    return invoice;
  } catch (error) {
    console.error("Error sending zap:", error);
    return null;
  }
}

// Get Lightning address from user metadata (NIP-57)
export async function getLightningAddress(
  pool: SimplePool,
  pubkey: string,
  relayUrls: string[]
): Promise<string | null> {
  try {
    return new Promise((resolve) => {
      let lnurl: string | null = null;
      
      // Subscribe to profile metadata to get lightning info
      const sub = pool.subscribe(relayUrls, {
        kinds: [0],
        authors: [pubkey],
        limit: 1
      }, {
        onevent: (event) => {
          try {
            const metadata = JSON.parse(event.content);
            
            // Try to get lud16 (Lightning Address) or lud06 (LNURL)
            if (metadata.lud16) {
              lnurl = metadata.lud16;
            } else if (metadata.lud06) {
              lnurl = metadata.lud06;
            }
          } catch (error) {
            console.error("Error parsing metadata:", error);
          }
        }
      });
      
      // Wait for a short time then resolve with the result
      setTimeout(() => {
        sub.close();
        resolve(lnurl);
      }, 3000);
    });
  } catch (error) {
    console.error("Error getting Lightning address:", error);
    return null;
  }
}

// Create a Zap request using LNURL (NIP-57)
export async function createZapRequest(
  lnurlOrAddress: string,
  amount: number,
  content: string,
  recipientPubkey: string,
  eventId?: string
): Promise<string | null> {
  try {
    // Handle Lightning addresses (user@domain.com)
    let lnurl = lnurlOrAddress;
    if (lnurlOrAddress.includes('@')) {
      lnurl = `https://${lnurlOrAddress.split('@')[1]}/.well-known/lnurlp/${lnurlOrAddress.split('@')[0]}`;
    }
    
    // In a real implementation, you would:
    // 1. Fetch the LNURL endpoint
    // 2. Create a zap request event
    // 3. Get the invoice from the LNURL service
    // 4. Return the invoice to be paid
    
    // For demonstration purposes, return a mock invoice
    return `lnbc${amount}n1...mock_invoice_for_${recipientPubkey.substring(0, 8)}`;
  } catch (error) {
    console.error("Error creating zap request:", error);
    return null;
  }
}
