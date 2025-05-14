
import { useCallback } from 'react';
import { NostrEvent } from '@/lib/nostr';
import { contentCache } from '@/lib/nostr';
import { getMediaUrlsFromEvent, isValidMediaUrl } from '@/lib/nostr/utils';
import { CacheCheckResult } from './types';

/**
 * Hook to check cache for profile posts
 */
export function useCacheCheck() {
  const checkCache = useCallback((hexPubkey: string): CacheCheckResult => {
    const result: CacheCheckResult = {
      postsEvents: [],
      mediaEvents: [],
      foundInCache: false
    };

    try {
      const cachedEvents = contentCache.getEventsByAuthors([hexPubkey]);
      
      if (cachedEvents && cachedEvents.length > 0) {
        console.log("Found cached posts:", cachedEvents.length);
        
        // Process cached events
        const postsEvents = cachedEvents.filter(e => e.kind === 1);
        result.postsEvents = postsEvents.sort((a, b) => b.created_at - a.created_at);
        
        // Extract media posts
        const mediaEvents = postsEvents.filter(event => {
          const mediaUrls = getMediaUrlsFromEvent(event);
          const validMediaUrls = mediaUrls.filter(url => isValidMediaUrl(url));
          return validMediaUrls.length > 0;
        });
        
        result.mediaEvents = mediaEvents.sort((a, b) => b.created_at - a.created_at);
        result.foundInCache = postsEvents.length > 0;
      }
    } catch (err) {
      console.warn("Error processing cached events:", err);
    }
    
    return result;
  }, []);

  return { checkCache };
}
