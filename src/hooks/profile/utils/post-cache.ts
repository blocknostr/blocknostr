
import { NostrEvent } from '@/lib/nostr';
import { contentCache } from '@/lib/nostr';
import { processCachedEvents } from './post-utils';

/**
 * Retrieves cached posts for a user
 */
export function retrieveCachedPosts(hexPubkey: string): {
  posts: NostrEvent[];
  media: NostrEvent[];
  hasEvents: boolean;
} {
  try {
    const cachedEvents = contentCache.getEventsByAuthors([hexPubkey]);
    if (cachedEvents && cachedEvents.length > 0) {
      console.log("Found cached posts:", cachedEvents.length);
      return processCachedEvents(cachedEvents);
    }
  } catch (err) {
    console.warn("Error processing cached events:", err);
  }
  
  return {
    posts: [],
    media: [],
    hasEvents: false
  };
}
