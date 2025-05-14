
import { useCallback, useState } from 'react';
import { getMediaUrlsFromEvent } from '@/lib/nostr/utils/media-extraction';
import { NostrEvent } from '@/lib/nostr';

/**
 * Hook for navigating through media items in a list of events
 */
export function useMediaNavigation(events: NostrEvent[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Get all media URLs from all events
  const mediaUrls = events.flatMap(event => getMediaUrlsFromEvent(event));
  
  // Navigate to next media item
  const next = useCallback(() => {
    if (mediaUrls.length > 0) {
      setCurrentIndex(prev => (prev + 1) % mediaUrls.length);
    }
  }, [mediaUrls.length]);
  
  // Navigate to previous media item
  const prev = useCallback(() => {
    if (mediaUrls.length > 0) {
      setCurrentIndex(prev => (prev - 1 + mediaUrls.length) % mediaUrls.length);
    }
  }, [mediaUrls.length]);
  
  // Go to a specific index
  const goTo = useCallback((index: number) => {
    if (mediaUrls.length > 0 && index >= 0 && index < mediaUrls.length) {
      setCurrentIndex(index);
    }
  }, [mediaUrls.length]);
  
  return {
    currentMedia: mediaUrls[currentIndex] || null,
    currentIndex,
    totalCount: mediaUrls.length,
    next,
    prev,
    goTo
  };
}

export default useMediaNavigation;
