
import { SimplePool, type Filter } from 'nostr-tools';
import { EVENT_KINDS } from '../../constants';
import { ReactionCounts } from '../types';

/**
 * Get reaction counts for an event
 * Supports NIP-25: https://github.com/nostr-protocol/nips/blob/master/25.md
 */
export async function getReactionCounts(
  pool: SimplePool,
  eventId: string,
  relayUrls: string[],
  currentPubkey: string | null
): Promise<ReactionCounts> {
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
