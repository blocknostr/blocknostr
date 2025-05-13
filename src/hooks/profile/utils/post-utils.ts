
import { NostrEvent } from '@/lib/nostr';
import { extractMediaUrls, isValidMediaUrl } from '@/lib/nostr/utils';

/**
 * Extracts media events from a list of posts
 */
export function extractMediaEvents(events: NostrEvent[]): NostrEvent[] {
  return events
    .filter(event => {
      const mediaUrls = extractMediaUrls(event.content, event.tags);
      const validMediaUrls = mediaUrls.filter(url => isValidMediaUrl(url));
      return validMediaUrls.length > 0;
    })
    .sort((a, b) => b.created_at - a.created_at);
}

/**
 * Processes cached events to extract posts and media
 */
export function processCachedEvents(events: NostrEvent[]): {
  posts: NostrEvent[];
  media: NostrEvent[];
  hasEvents: boolean;
} {
  const postsEvents = events
    .filter(e => e.kind === 1)
    .sort((a, b) => b.created_at - a.created_at);
  
  const mediaEvents = extractMediaEvents(postsEvents);
  
  return {
    posts: postsEvents,
    media: mediaEvents,
    hasEvents: postsEvents.length > 0
  };
}
