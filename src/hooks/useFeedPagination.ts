
import { useState, useCallback } from "react";
import { NostrEvent } from "@/lib/nostr";

interface UseFeedPaginationProps {
  events: NostrEvent[];
  setEvents: React.Dispatch<React.SetStateAction<NostrEvent[]>>;
  onLoadMore: (since: number, until: number) => void;
}

export const useFeedPagination = ({ 
  events, 
  onLoadMore 
}: UseFeedPaginationProps) => {
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const loadMoreEvents = useCallback(() => {
    if (isLoadingMore) return;
    
    // Set loading more state to prevent multiple simultaneous loads
    setIsLoadingMore(true);
    
    // Create new subscription with older timestamp range
    if (!since) {
      // If no since value yet, get the oldest post timestamp
      const oldestEvent = events.length > 0 ? 
        events.reduce((oldest, current) => oldest.created_at < current.created_at ? oldest : current) : 
        null;
      
      const newUntil = oldestEvent ? oldestEvent.created_at - 1 : until - 24 * 60 * 60;
      const newSince = newUntil - 24 * 60 * 60 * 14; // 14 days before until for more content
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      onLoadMore(newSince, newUntil);
    } else {
      // We already have a since value, so use it to get older posts
      const newUntil = since;
      const newSince = newUntil - 24 * 60 * 60 * 14; // 14 days before until for more content
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      onLoadMore(newSince, newUntil);
    }
    
    // Reset loading more state after a short delay
    setTimeout(() => {
      setIsLoadingMore(false);
    }, 2000);
  }, [since, until, events, isLoadingMore, onLoadMore]);
  
  const resetPagination = useCallback(() => {
    const currentTime = Math.floor(Date.now() / 1000);
    setSince(undefined);
    setUntil(currentTime);
    setHasMore(true);
    return currentTime;
  }, []);
  
  return {
    since,
    until,
    hasMore,
    setHasMore,
    isLoadingMore,
    setIsLoadingMore,
    loadMoreEvents,
    resetPagination
  };
};
