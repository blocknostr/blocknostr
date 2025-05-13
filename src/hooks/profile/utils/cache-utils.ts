
import { NostrEvent, contentCache } from '@/lib/nostr';

/**
 * Load events from cache for a specific pubkey
 */
export function loadCachedEvents(hexPubkey: string): {
  cachedPosts: NostrEvent[],
  cachedMedia: NostrEvent[],
  hasEvents: boolean
} {
  try {
    const cachedEvents = contentCache.getEventsByAuthors([hexPubkey]);
    
    if (!cachedEvents || cachedEvents.length === 0) {
      return { cachedPosts: [], cachedMedia: [], hasEvents: false };
    }
    
    console.log("Found cached posts:", cachedEvents.length);
    
    // Process cached events
    const postsEvents = cachedEvents
      .filter(e => e.kind === 1)
      .sort((a, b) => b.created_at - a.created_at);
    
    // Extract media posts
    const mediaEvents = postsEvents.filter(event => {
      const mediaUrls = extractMediaUrls(event.content, event.tags);
      const validMediaUrls = mediaUrls.filter(url => isValidMediaUrl(url));
      return validMediaUrls.length > 0;
    });
    
    return {
      cachedPosts: postsEvents,
      cachedMedia: mediaEvents,
      hasEvents: postsEvents.length > 0
    };
  } catch (err) {
    console.warn("Error processing cached events:", err);
    return { cachedPosts: [], cachedMedia: [], hasEvents: false };
  }
}

// Re-export these functions that we need
import { extractMediaUrls, isValidMediaUrl } from '@/lib/nostr/utils';
export { extractMediaUrls, isValidMediaUrl };
