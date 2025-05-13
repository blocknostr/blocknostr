
import { useState, useEffect, useRef } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';

interface UseProfileRepostsProps {
  hexPubkey: string | undefined;
  enabled?: boolean;
  originalPostProfiles?: Record<string, any>;
  onProfileFetched?: (pubkey: string, data: any) => void;
}

export function useProfileReposts({ 
  hexPubkey, 
  enabled = true,
  originalPostProfiles = {},
  onProfileFetched
}: UseProfileRepostsProps) {
  const [reposts, setReposts] = useState<{ 
    originalEvent: NostrEvent; 
    repostEvent: NostrEvent;
  }[]>([]);
  
  const [loading, setLoading] = useState(false);
  const subscriptionsRef = useRef<Set<string>>(new Set());
  const timeoutsRef = useRef<Set<number>>(new Set());
  const profilesRef = useRef<Record<string, any>>(originalPostProfiles);
  const isMounted = useRef(true);
  
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

  // Function to fetch original post by event ID
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
        
        // Fetch profile data for the original author if needed
        if (originalEvent.pubkey && 
            !profilesRef.current[originalEvent.pubkey] && 
            onProfileFetched) {
          
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
                profilesRef.current[originalEvent.pubkey] = metadata;
                
                // Notify parent component about new profile data
                if (onProfileFetched) {
                  onProfileFetched(originalEvent.pubkey, metadata);
                }
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

  // Effect to fetch reposts
  useEffect(() => {
    // Only fetch data if enabled and we have a pubkey
    if (!enabled || !hexPubkey) return;
    
    setLoading(true);
    console.log("Fetching reposts for profile:", hexPubkey);
    
    try {
      // Subscribe to user's reposts (kind 6)
      const subId = nostrService.subscribe(
        [
          {
            kinds: [6], // Reposts
            authors: [hexPubkey],
            limit: 30
          }
        ],
        (repostEvent) => {
          if (!isMounted.current) return;
          
          // Get the original event ID
          const eTag = repostEvent.tags?.find(tag => 
            Array.isArray(tag) && tag.length >= 2 && tag[0] === 'e'
          );
          
          if (eTag && eTag[1]) {
            fetchOriginalPost(eTag[1], repostEvent.pubkey, repostEvent);
          }
        }
      );
      
      subscriptionsRef.current.add(subId);
      
      // Stop loading after some time
      const timeoutId = window.setTimeout(() => {
        if (isMounted.current) {
          setLoading(false);
        }
      }, 5000);
      
      timeoutsRef.current.add(timeoutId);
    } catch (error) {
      console.error("Error fetching reposts:", error);
      setLoading(false);
    }
    
    return () => {
      // Clean up subscriptions on unmount
      subscriptionsRef.current.forEach(subId => {
        nostrService.unsubscribe(subId);
      });
    };
  }, [hexPubkey, enabled]);

  return { reposts, loading, fetchOriginalPost };
}
