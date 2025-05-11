
import { useState, useEffect } from "react";
import { NostrEvent, nostrService, contentCache } from "@/lib/nostr";

interface UseEventSubscriptionProps {
  following?: string[];
  activeHashtag?: string;
  since?: number;
  until?: number;
  limit: number;
  setEvents: React.Dispatch<React.SetStateAction<NostrEvent[]>>;
  handleRepost: (event: NostrEvent, setEvents: React.Dispatch<React.SetStateAction<NostrEvent[]>>) => void;
  fetchProfileData: (pubkey: string) => void;
  feedType?: string;
  mediaOnly?: boolean;
}

export function useEventSubscription({
  following,
  activeHashtag,
  since,
  until,
  limit,
  setEvents,
  handleRepost,
  fetchProfileData,
  feedType = 'generic',
  mediaOnly = false,
}: UseEventSubscriptionProps) {
  const [subId, setSubId] = useState<string | null>(null);
  
  const setupSubscription = (sinceFetch: number, untilFetch?: number) => {
    // Check if we're online before setting up subscription
    if (!navigator.onLine) {
      console.log("Browser is offline, skipping subscription setup");
      return null;
    }
    
    // Check if we have connected relays
    const relayStatus = nostrService.getRelayStatus();
    const connectedRelays = relayStatus.filter(r => r.status === 'connected');
    
    if (connectedRelays.length === 0) {
      console.log("No connected relays, skipping subscription setup");
      return null;
    }
    
    // Create filters based on whether this is a following feed or global feed
    let filters: any[] = [];
    
    if (following && following.length > 0) {
      // Following feed - filter by authors
      filters = [
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
    } else {
      // Global feed - no author filter
      filters = [
        {
          kinds: [1], // Regular notes
          limit: limit,
          since: sinceFetch,
          until: untilFetch
        },
        {
          kinds: [6], // Reposts
          limit: Math.floor(limit * 0.4), // Fewer reposts than original posts
          since: sinceFetch,
          until: untilFetch
        }
      ];
    }
    
    // If we have an active hashtag, filter by it
    if (activeHashtag) {
      filters = filters.map(filter => ({
        ...filter,
        "#t": [activeHashtag.toLowerCase()]
      }));
    }
    
    // Create accumulators for events to be cached
    let collectedEvents: NostrEvent[] = [];
    
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
            
            // Add event to collection for caching
            collectedEvents.push(event);
            
            // Cache the event individually
            contentCache.cacheEvent(event);
            
            // Every 10 events, update the feed cache
            if (collectedEvents.length % 10 === 0) {
              contentCache.cacheFeed(
                feedType,
                [...prev, ...collectedEvents].sort((a, b) => b.created_at - a.created_at),
                {
                  authorPubkeys: following,
                  hashtag: activeHashtag,
                  since: sinceFetch,
                  until: untilFetch,
                  mediaOnly
                },
                true
              );
            }
            
            return newEvents;
          });
        }
        else if (event.kind === 6) {
          // Repost - extract the referenced event
          handleRepost(event, setEvents);
        }
        
        // Fetch profile data for this pubkey if we don't have it yet
        if (event.pubkey) {
          // Check cache first
          const cachedProfile = contentCache.getProfile(event.pubkey);
          if (cachedProfile) {
            // Use cached profile
          } else {
            // Fetch from relays if not in cache
            fetchProfileData(event.pubkey);
          }
        }
      }
    );
    
    // Cache collected events when subscription ends
    if (newSubId) {
      // Set up a scheduled task to periodically cache all collected events
      const cacheIntervalId = setInterval(() => {
        if (collectedEvents.length > 0) {
          // Get current events from state to ensure we have everything
          setEvents(currentEvents => {
            // Cache all events we have
            contentCache.cacheFeed(
              feedType,
              currentEvents,
              {
                authorPubkeys: following,
                hashtag: activeHashtag,
                since: sinceFetch,
                until: untilFetch,
                mediaOnly
              },
              true // Mark as important for offline use
            );
            
            return currentEvents;
          });
        }
      }, 10000); // Every 10 seconds
      
      // Clean up the interval when unsubscribing
      const originalUnsubscribe = nostrService.unsubscribe;
      nostrService.unsubscribe = (id) => {
        if (id === newSubId) {
          clearInterval(cacheIntervalId);
          nostrService.unsubscribe = originalUnsubscribe;
        }
        return originalUnsubscribe.call(nostrService, id);
      };
    }
    
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
    subId,
    setSubId,
    setupSubscription
  };
}
