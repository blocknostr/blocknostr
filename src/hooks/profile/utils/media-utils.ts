
import { NostrEvent } from '@/lib/nostr';
import { extractMediaUrls, isValidMediaUrl } from '@/lib/nostr/utils';

/**
 * Extract media posts from a list of events
 */
export function extractMediaPosts(posts: NostrEvent[]): NostrEvent[] {
  return posts
    .filter(event => {
      const mediaUrls = extractMediaUrls(event.content, event.tags);
      const validMediaUrls = mediaUrls.filter(url => isValidMediaUrl(url));
      return validMediaUrls.length > 0;
    })
    .sort((a, b) => b.created_at - a.created_at);
}

/**
 * Check if an event contains valid media
 */
export function hasValidMedia(event: NostrEvent): boolean {
  const mediaUrls = extractMediaUrls(event.content, event.tags);
  const validMediaUrls = mediaUrls.filter(url => isValidMediaUrl(url));
  return validMediaUrls.length > 0;
}
