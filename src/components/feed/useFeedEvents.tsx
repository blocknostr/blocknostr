
import { useState, useEffect } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";

interface UseFeedEventsProps {
  following: string[];
  since?: number;
  until?: number;
  activeHashtag?: string;
  limit?: number;
}

export function useFeedEvents({
  following,
  since,
  until,
  activeHashtag,
  limit = 50
}: UseFeedEventsProps) {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [repostData, setRepostData] = useState<Record<string, { pubkey: string, original: NostrEvent }>>({}); 
  const [subId, setSubId] = useState<string | null>(null);
  
  // Fetch the original post when a repost is encountered
  const fetchOriginalPost = (eventId: string) => {
    // Subscribe to a specific event by ID
    const eventSubId = nostrService.subscribe(
      [
        {
          ids: [eventId],
          kinds: [1]
        }
      ],
      (event) => {
        setEvents(prev => {
          // Check if we already have this event
          if (prev.some(e => e.id === event.id)) {
            return prev;
          }
          
          // Add new event and sort by creation time (newest first)
          return [...prev, event].sort((a, b) => b.created_at - a.created_at);
        });
        
        // Fetch profile data for this pubkey if we don't have it yet
        if (event.pubkey && !profiles[event.pubkey]) {
          fetchProfileData(event.pubkey);
        }
      }
    );
    
    // Cleanup subscription after a short time
    setTimeout(() => {
      nostrService.unsubscribe(eventSubId);
    }, 5000);
  };
  
  const fetchProfileData = (pubkey: string) => {
    const metadataSubId = nostrService.subscribe(
      [
        {
          kinds: [0],
          authors: [pubkey],
          limit: 1
        }
      ],
      (event) => {
        try {
          const metadata = JSON.parse(event.content);
          setProfiles(prev => ({
            ...prev,
            [pubkey]: metadata
          }));
        } catch (e) {
          console.error('Failed to parse profile metadata:', e);
        }
      }
    );
    
    // Cleanup subscription after a short time
    setTimeout(() => {
      nostrService.unsubscribe(metadataSubId);
    }, 5000);
  };

  const setupSubscription = (sinceFetch: number, untilFetch?: number) => {
    if (following.length === 0) {
      return null;
    }
    
    // Create filters for followed users
    let filters: any[] = [
      {
        kinds: [1], // Regular notes
        authors: following,
        limit: limit,
        since: sinceFetch,
        until: untilFetch
      },
      {
        kinds: [6], // Reposts
        authors: following,
        limit: Math.floor(limit * 0.4), // Fewer reposts than original posts
        since: sinceFetch,
        until: untilFetch
      }
    ];
    
    // If we have an active hashtag, filter by it
    if (activeHashtag) {
      filters = [
        {
          ...filters[0],
          "#t": [activeHashtag.toLowerCase()]
        },
        {
          ...filters[1] // Keep the reposts filter
        }
      ];
    }
    
    // Subscribe to events
    const newSubId = nostrService.subscribe(
      filters,
      (event) => {
        if (event.kind === 1) {
          // Regular note
          setEvents(prev => {
            // Check if we already have this event
            if (prev.some(e => e.id === event.id)) {
              return prev;
            }
            
            const newEvents = [...prev, event];
            
            // Sort by creation time (newest first)
            newEvents.sort((a, b) => b.created_at - a.created_at);
            
            return newEvents;
          });
        }
        else if (event.kind === 6) {
          // Repost - extract the referenced event
          try {
            // Some clients store the original event in content as JSON
            const content = JSON.parse(event.content);
            
            if (content.event && content.event.id) {
              const originalEventId = content.event.id;
              const originalEventPubkey = content.event.pubkey;
              
              // Track repost data for later display
              setRepostData(prev => ({
                ...prev,
                [originalEventId]: { 
                  pubkey: event.pubkey,  // The reposter
                  original: { id: originalEventId, pubkey: originalEventPubkey } as NostrEvent
                }
              }));
              
              // Fetch the original post
              fetchOriginalPost(originalEventId);
            }
          } catch (e) {
            // If parsing fails, try to get event reference from tags
            const eventReference = event.tags.find(tag => tag[0] === 'e');
            if (eventReference && eventReference[1]) {
              const originalEventId = eventReference[1];
              
              // Find pubkey reference
              const pubkeyReference = event.tags.find(tag => tag[0] === 'p');
              const originalEventPubkey = pubkeyReference ? pubkeyReference[1] : null;
              
              // Track repost data
              setRepostData(prev => ({
                ...prev,
                [originalEventId]: { 
                  pubkey: event.pubkey,  // The reposter
                  original: { id: originalEventId, pubkey: originalEventPubkey } as NostrEvent
                }
              }));
              
              // Fetch the original post
              fetchOriginalPost(originalEventId);
            }
          }
        }
        
        // Fetch profile data for this pubkey if we don't have it yet
        if (event.pubkey && !profiles[event.pubkey]) {
          fetchProfileData(event.pubkey);
        }
      }
    );
    
    return newSubId;
  };
  
  useEffect(() => {
    // Cleanup function to handle subscription cleanup
    return () => {
      if (subId) {
        nostrService.unsubscribe(subId);
      }
    };
  }, [subId]);

  return {
    events,
    profiles,
    repostData,
    subId,
    setSubId,
    setupSubscription,
    setEvents
  };
}
