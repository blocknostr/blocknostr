import { useState, useRef, useEffect } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';

interface UseProfileRepostsProps {
  hexPubkey?: string;
  originalPostProfiles: Record<string, any>;
  setOriginalPostProfiles: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  enabled?: boolean;
  initialLimit?: number;
}

export function useProfileReposts({ 
  hexPubkey,
  originalPostProfiles, 
  setOriginalPostProfiles,
  enabled = true,
  initialLimit = 10
}: UseProfileRepostsProps) {
  const [reposts, setReposts] = useState<{ 
    originalEvent: NostrEvent; 
    repostEvent: NostrEvent;
  }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const [repostEvents, setRepostEvents] = useState<NostrEvent[]>([]);
  const subscriptionsRef = useRef<Set<string>>(new Set());
  const timeoutsRef = useRef<Set<number>>(new Set());
  const isMounted = useRef(true);
  const lastTimestamp = useRef<number | null>(null);
  
  // Set up the mounted ref for cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
      
      // Clean up all subscriptions
      subscriptionsRef.current.forEach(subId => {
        nostrService.unsubscribe(subId);
      });
      
      // Clear all timeouts
      timeoutsRef.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
    };
  }, []);

  const fetchOriginalPost = (eventId: string, pubkey: string | null, repostEvent: NostrEvent) => {
    // Subscribe to the original event by ID
    const eventSubId = nostrService.subscribe(
      [
        {
          ids: [eventId],
          kinds: [1]
        }
      ],
      (originalEvent) => {
        if (!isMounted.current) return;
        
        setReposts(prev => {
          if (prev.some(r => r.originalEvent.id === originalEvent.id)) {
            return prev;
          }
          
          const newRepost = {
            originalEvent,
            repostEvent
          };
          
          return [...prev, newRepost].sort(
            (a, b) => b.repostEvent.created_at - a.repostEvent.created_at
          );
        });
        
        // Fetch profile data for the original author if we don't have it yet
        if (originalEvent.pubkey && !originalPostProfiles[originalEvent.pubkey]) {
          const metadataSubId = nostrService.subscribe(
            [
              {
                kinds: [0],
                authors: [originalEvent.pubkey],
                limit: 1
              }
            ],
            (event) => {
              if (!isMounted.current) return;
              
              try {
                const metadata = JSON.parse(event.content);
                setOriginalPostProfiles(prev => ({
                  ...prev,
                  [originalEvent.pubkey]: metadata
                }));
              } catch (e) {
                console.error('Failed to parse profile metadata for repost:', e);
              }
            }
          );
          
          // Track subscription
          subscriptionsRef.current.add(metadataSubId);
          
          // Cleanup subscription after a short time
          const timeoutId = window.setTimeout(() => {
            if (subscriptionsRef.current.has(metadataSubId)) {
              nostrService.unsubscribe(metadataSubId);
              subscriptionsRef.current.delete(metadataSubId);
            }
          }, 5000);
          
          // Track timeout
          timeoutsRef.current.add(timeoutId);
        }
      }
    );
    
    // Track subscription
    subscriptionsRef.current.add(eventSubId);
    
    // Cleanup subscription after a short time
    const timeoutId = window.setTimeout(() => {
      if (subscriptionsRef.current.has(eventSubId)) {
        nostrService.unsubscribe(eventSubId);
        subscriptionsRef.current.delete(eventSubId);
      }
    }, 5000);
    
    // Track timeout
    timeoutsRef.current.add(timeoutId);
  };

  // Function to load more reposts
  const loadMore = () => {
    if (!hexPubkey || loading || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    setPage(prev => prev + 1);
    
    // If we have reposts, use the oldest one's timestamp as 'until'
    const until = lastTimestamp.current 
      ? lastTimestamp.current - 1 // Subtract 1 to avoid duplication
      : undefined;
    
    console.log(`Loading more reposts for profile: ${hexPubkey}, page: ${page + 1}, until: ${until}`);
    
    // Subscribe to next batch of user's reposts
    const subId = nostrService.subscribe(
      [
        {
          kinds: [6], // Reposts
          authors: [hexPubkey],
          until: until,
          limit: initialLimit
        }
      ],
      (repostEvent) => {
        if (!isMounted.current) return;
        
        // Track the oldest timestamp for pagination
        if (!lastTimestamp.current || repostEvent.created_at < lastTimestamp.current) {
          lastTimestamp.current = repostEvent.created_at;
        }
        
        // Save repost event to our local array
        setRepostEvents(prev => {
          if (prev.some(e => e.id === repostEvent.id)) {
            return prev;
          }
          return [...prev, repostEvent];
        });
        
        // Get the original event ID
        const eTag = repostEvent.tags?.find(tag => 
          Array.isArray(tag) && tag.length >= 2 && tag[0] === 'e'
        );
        
        if (eTag && eTag[1]) {
          fetchOriginalPost(eTag[1], repostEvent.pubkey, repostEvent);
        }
      }
    );
    
    // Add subscription to our tracking set
    subscriptionsRef.current.add(subId);
    
    // Set loading to false after some time
    const timeoutId = window.setTimeout(() => {
      if (isMounted.current) {
        setLoadingMore(false);
        
        // If we received fewer than the limit, assume there are no more
        if (repostEvents.length < initialLimit * page) {
          setHasMore(false);
        }
      }
      
      if (subscriptionsRef.current.has(subId)) {
        nostrService.unsubscribe(subId);
        subscriptionsRef.current.delete(subId);
      }
    }, 5000);
    
    // Track timeout
    timeoutsRef.current.add(timeoutId);
  };

  // Add new fetchReposts function to be called when hexPubkey or enabled changes
  useEffect(() => {
    if (!hexPubkey || !enabled) return;
    
    const fetchReposts = async () => {
      console.log("Fetching initial reposts for profile:", hexPubkey);
      setLoading(true);
      setPage(1);
      setReposts([]);
      setRepostEvents([]);
      lastTimestamp.current = null;
      setHasMore(true);
      
      try {
        // Clean up existing subscriptions
        subscriptionsRef.current.forEach(subId => {
          nostrService.unsubscribe(subId);
        });
        subscriptionsRef.current.clear();
        
        // Subscribe to user's reposts (kind 6)
        const subId = nostrService.subscribe(
          [
            {
              kinds: [6], // Reposts
              authors: [hexPubkey],
              limit: initialLimit
            }
          ],
          (repostEvent) => {
            if (!isMounted.current) return;
            
            // Track the oldest timestamp for pagination
            if (!lastTimestamp.current || repostEvent.created_at < lastTimestamp.current) {
              lastTimestamp.current = repostEvent.created_at;
            }
            
            // Save repost event to our local array
            setRepostEvents(prev => {
              if (prev.some(e => e.id === repostEvent.id)) {
                return prev;
              }
              return [...prev, repostEvent];
            });
            
            // Get the original event ID
            const eTag = repostEvent.tags?.find(tag => 
              Array.isArray(tag) && tag.length >= 2 && tag[0] === 'e'
            );
            
            if (eTag && eTag[1]) {
              fetchOriginalPost(eTag[1], repostEvent.pubkey, repostEvent);
            }
          }
        );
        
        // Add subscription to our tracking set
        subscriptionsRef.current.add(subId);
        
        // Set loading to false after some time
        const timeoutId = window.setTimeout(() => {
          if (isMounted.current) {
            setLoading(false);
          }
          
          // Don't auto-unsubscribe on initial load to keep receiving events
        }, 5000);
        
        // Track timeout
        timeoutsRef.current.add(timeoutId);
      } catch (error) {
        console.error("Error fetching reposts:", error);
        setLoading(false);
      }
    };
    
    fetchReposts();
    
    return () => {
      // Clean up all subscriptions when effect re-runs or unmounts
      subscriptionsRef.current.forEach(subId => {
        nostrService.unsubscribe(subId);
      });
      subscriptionsRef.current.clear();
      
      // Clear all timeouts
      timeoutsRef.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeoutsRef.current.clear();
    };
  }, [hexPubkey, enabled, initialLimit]);

  return { 
    reposts, 
    loading, 
    loadingMore,
    hasMore,
    loadMore
  };
}
