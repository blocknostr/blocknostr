
import { useState, useRef } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';

interface UseProfileRepostsProps {
  originalPostProfiles: Record<string, any>;
  setOriginalPostProfiles: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export function useProfileReposts({ 
  originalPostProfiles, 
  setOriginalPostProfiles 
}: UseProfileRepostsProps) {
  const [reposts, setReposts] = useState<{ 
    originalEvent: NostrEvent; 
    repostEvent: NostrEvent;
  }[]>([]);
  
  const [replies, setReplies] = useState<NostrEvent[]>([]);
  const subscriptionsRef = useRef<Set<string>>(new Set());
  const timeoutsRef = useRef<Set<number>>(new Set());
  const isMounted = useRef(true);
  
  // Set up the mounted ref for cleanup
  useState(() => {
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
  });

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

  return { reposts, replies, fetchOriginalPost };
}
