
import { useState, useEffect, useRef } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';

interface UseProfileRepliesProps {
  hexPubkey: string | undefined;
  enabled?: boolean;
  initialLimit?: number;
}

export function useProfileReplies({ 
  hexPubkey, 
  enabled = true, 
  initialLimit = 10 
}: UseProfileRepliesProps) {
  const [replies, setReplies] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const subscriptionRef = useRef<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const isMounted = useRef(true);
  const lastTimestamp = useRef<number | null>(null);
  
  // Set up the mounted ref for cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Function to load more replies
  const loadMore = () => {
    if (!hexPubkey || loading || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    setPage(prev => prev + 1);
    
    // If we have replies, use the oldest one's timestamp as 'until'
    const until = lastTimestamp.current 
      ? lastTimestamp.current - 1 // Subtract 1 to avoid duplication
      : undefined;
    
    console.log(`Loading more replies for profile: ${hexPubkey}, page: ${page + 1}, until: ${until}`);
    
    // Clean up previous subscription if any
    if (subscriptionRef.current) {
      nostrService.unsubscribe(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    
    // Subscribe to next batch of user's notes that are replies
    const repliesSubId = nostrService.subscribe(
      [
        {
          kinds: [1],
          authors: [hexPubkey],
          until: until,
          limit: initialLimit
        }
      ],
      (event) => {
        if (!isMounted.current) return;
        
        // Check if this is a reply by looking for e tags (NIP-10)
        const hasETags = event.tags?.some(tag => 
          Array.isArray(tag) && tag.length >= 2 && tag[0] === 'e'
        );
        
        if (hasETags) {
          setReplies(prev => {
            // Check if we already have this event
            if (prev.some(e => e.id === event.id)) {
              return prev;
            }
            
            // Track the oldest timestamp for pagination
            if (!lastTimestamp.current || event.created_at < lastTimestamp.current) {
              lastTimestamp.current = event.created_at;
            }
            
            // Add new reply and sort by creation time (newest first)
            return [...prev, event].sort((a, b) => b.created_at - a.created_at);
          });
        }
      }
    );
    
    // Store subscription ID for cleanup
    subscriptionRef.current = repliesSubId;
    
    // Set loading to false after some time
    timeoutRef.current = window.setTimeout(() => {
      if (isMounted.current) {
        setLoadingMore(false);
        
        // If we received fewer than the limit, assume there are no more
        if (replies.length < initialLimit * page) {
          setHasMore(false);
        }
      }
    }, 5000);
  };
  
  useEffect(() => {
    // Only fetch data if enabled and we have a pubkey
    if (!enabled || !hexPubkey) return;
    
    console.log("Fetching initial replies for profile:", hexPubkey);
    setLoading(true);
    setPage(1);
    setReplies([]);
    lastTimestamp.current = null;
    setHasMore(true);
    
    // Clean up previous subscription if any
    if (subscriptionRef.current) {
      nostrService.unsubscribe(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    
    // Subscribe to user's notes that are replies (have e tags - NIP-10)
    const repliesSubId = nostrService.subscribe(
      [
        {
          kinds: [1],
          authors: [hexPubkey],
          limit: initialLimit
        }
      ],
      (event) => {
        if (!isMounted.current) return;
        
        // Check if this is a reply by looking for e tags (NIP-10)
        const hasETags = event.tags?.some(tag => 
          Array.isArray(tag) && tag.length >= 2 && tag[0] === 'e'
        );
        
        if (hasETags) {
          setReplies(prev => {
            // Check if we already have this event
            if (prev.some(e => e.id === event.id)) {
              return prev;
            }
            
            // Track the oldest timestamp for pagination
            if (!lastTimestamp.current || event.created_at < lastTimestamp.current) {
              lastTimestamp.current = event.created_at;
            }
            
            // Add new reply and sort by creation time (newest first)
            return [...prev, event].sort((a, b) => b.created_at - a.created_at);
          });
        }
      }
    );
    
    // Store subscription ID for cleanup
    subscriptionRef.current = repliesSubId;
    
    // Set loading to false after some time
    timeoutRef.current = window.setTimeout(() => {
      if (isMounted.current) {
        setLoading(false);
      }
    }, 3000);
    
    return () => {
      // Clean up subscription when component unmounts
      if (subscriptionRef.current) {
        nostrService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      
      // Clear timeout
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [hexPubkey, enabled, initialLimit]);

  return { 
    replies, 
    loading, 
    loadingMore, 
    hasMore, 
    loadMore 
  };
}
