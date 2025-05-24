
import { contentCache } from '@/lib/nostr';
import { getMediaUrlsFromEvent, isValidMediaUrl } from '@/lib/nostr/utils/media-extraction';
import { useCallback } from 'react';

export function useCacheCheck() {
  const checkCache = useCallback((pubkey: string) => {
    // Check cache for events
    const cachedEvents = contentCache.getEventsByAuthors([pubkey]) || [];
    
    // Sort events by creation time (newest first)
    const sortedEvents = cachedEvents.sort((a, b) => b.created_at - a.created_at);
    
    // Filter posts (kind 1)
    const postsEvents = sortedEvents.filter(e => e.kind === 1);
    
    // Filter media posts
    const mediaEvents = postsEvents.filter(event => {
      const mediaUrls = getMediaUrlsFromEvent(event);
      const validMediaUrls = mediaUrls.filter(url => isValidMediaUrl(url));
      return validMediaUrls.length > 0;
    });
    
    // Sort media by creation time (newest first)
    const sortedMedia = mediaEvents.sort((a, b) => b.created_at - a.created_at);
    
    return {
      postsEvents,
      mediaEvents: sortedMedia,
      foundInCache: postsEvents.length > 0
    };
  }, []);
  
  return { checkCache };
}
