import { useState, useEffect } from "react";
import { NostrEvent, nostrService, contentCache } from "@/lib/nostr";
import { EventDeduplication } from "@/lib/nostr/utils/event-deduplication";

interface UseEventSubscriptionProps {
  following?: string[];
  activeHashtag?: string;
  since?: number;
  until?: number;
  limit: number;
  setEvents: React.Dispatch<React.SetStateAction<NostrEvent[]>> | ((event: NostrEvent) => void);
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
          // Use our wrapper function that handles both single events and state updates
          setEvents(event);
          
          // Add event to collection for caching
          collectedEvents.push(event);
          
          // Cache the event individually
          contentCache.cacheEvent(event);
        }
        else if (event.kind === 6) {
          // Repost - extract the referenced event
          handleRepost(event, setEvents as React.Dispatch<React.SetStateAction<NostrEvent[]>>);
        }
        
        // Fetch profile data for this pubkey if we don't have it yet
        if (event.pubkey) {
          // Check cache first
          const cachedProfile = contentCache.getProfile(event.pubkey);
          if (!cachedProfile) {
            // Fetch from relays if not in cache
            fetchProfileData(event.pubkey);
          }
        }
      }
    );
    
    // Set up a scheduled task to periodically cache all collected events
    if (newSubId) {
      const cacheIntervalId = setInterval(() => {
        if (collectedEvents.length > 0) {
          // Get current events from state to ensure we have everything
          setEvents((currentEvents: NostrEvent[] | ((prevState: NostrEvent[]) => NostrEvent[])) => {
            // We need to handle the case where setEvents might receive a function
            let events: NostrEvent[] = [];
            if (typeof currentEvents === 'function') {
              // This is a complex case and might not be needed
              console.warn("Received function in setEvents during caching");
              return currentEvents;
            } else {
              events = currentEvents;
            }
            
            // Cache all events we have
            contentCache.cacheFeed(
              feedType,
              events,
              {
                authorPubkeys: following,
                hashtag: activeHashtag,
                since: sinceFetch,
                until: untilFetch,
                mediaOnly
              },
              true // Mark as important for offline use
            );
            
            // Update the last updated timestamp in localStorage 
            localStorage.setItem(`${feedType}_last_updated`, Date.now().toString());
            
            return events;
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
