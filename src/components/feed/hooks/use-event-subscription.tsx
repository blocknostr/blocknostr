
import { useState, useEffect, useCallback } from "react";
import { NostrEvent, nostrService, contentCache } from "@/lib/nostr";
import { EventDeduplication } from "@/lib/nostr/utils/event-deduplication";
import { toast } from "sonner";
import { circuitBreaker, CircuitState } from "@/lib/nostr/relay/circuit/circuit-breaker";
import { retry } from "@/lib/utils/retry";

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
  const [isRetrying, setIsRetrying] = useState(false);
  
  const setupSubscription = useCallback((sinceFetch: number, untilFetch?: number) => {
    // Check if we're online before setting up subscription
    if (!navigator.onLine) {
      console.log("Browser is offline, skipping subscription setup");
      return null;
    }
    
    // Check if we have connected relays
    const relayStatus = nostrService.getRelayStatus();
    const connectedRelays = relayStatus.filter(r => r.status === 'connected');
    
    if (connectedRelays.length === 0) {
      console.log("No connected relays, attempting to connect to defaults");
      // Try to connect to some default relays
      setTimeout(() => {
        nostrService.connectToDefaultRelays();
      }, 100);
      return null;
    }

    // Create filters based on whether this is a following feed or global feed
    // NIP-1 compliant filter structure
    let filters: any[] = [];
    
    if (following && following.length > 0) {
      // Following feed - filter by authors with NIP-1 compliant structure
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
    let lastFetchTime = Date.now();
    
    // Try to select relays that aren't in OPEN circuit state
    const availableRelays = nostrService.getRelayUrls().filter(url => {
      return circuitBreaker.getState(url) !== CircuitState.OPEN;
    });
    
    if (availableRelays.length === 0) {
      console.warn("All relays are in circuit breaker OPEN state, resetting some to try again");
      // Reset circuit breakers for a few popular relays to try again
      const popularRelays = [
        'wss://relay.damus.io',
        'wss://nos.lol',
        'wss://relay.nostr.band'
      ];
      
      popularRelays.forEach(url => circuitBreaker.reset(url));
    }
    
    // Subscribe to events
    const newSubId = nostrService.subscribe(
      filters,
      (event) => {
        // Record successful relay responses
        const relayUrl = (event as any)._relay_url;
        if (relayUrl) {
          circuitBreaker.recordSuccess(relayUrl);
          lastFetchTime = Date.now();
        }
        
        if (event.kind === 1) {
          // Regular note
          setEvents(prev => {
            // Check if we already have this event using deduplication
            if (EventDeduplication.hasEventId(prev, event.id)) {
              return prev;
            }
            
            // Add the new event
            const newEvents = [...prev, event];
            
            // Deduplicate the events
            const uniqueEvents = EventDeduplication.deduplicateById(newEvents);
            
            // Sort by creation time (newest first)
            uniqueEvents.sort((a, b) => b.created_at - a.created_at);
            
            // Add event to collection for caching
            collectedEvents.push(event);
            
            // Cache the event individually
            contentCache.cacheEvent(event);
            
            // Every 5 events, update the feed cache for better performance
            if (collectedEvents.length % 5 === 0) {
              contentCache.cacheFeed(
                feedType,
                uniqueEvents,
                {
                  authorPubkeys: following,
                  hashtag: activeHashtag,
                  since: sinceFetch,
                  until: untilFetch,
                  mediaOnly
                },
                true // Mark as important for offline use
              );
            }
            
            return uniqueEvents;
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
          if (!cachedProfile) {
            // Fetch from relays if not in cache
            fetchProfileData(event.pubkey);
          }
        }
      },
      // Fix: This is now correctly passed as an error handler callback function
      (error) => {
        // Error handler for subscription errors
        console.error("Subscription error:", error);
        
        // If we have a relay URL, mark it as failed in circuit breaker
        if (error && error.relayUrl) {
          circuitBreaker.recordFailure(error.relayUrl);
        }
        
        // If we haven't received events in a while, try to reconnect
        const timeSinceLastEvent = Date.now() - lastFetchTime;
        if (timeSinceLastEvent > 10000) { // 10 seconds
          console.warn("No events received for 10 seconds, retrying subscription");
          
          // Only retry if we're not already retrying
          if (!isRetrying) {
            setIsRetrying(true);
            
            // Cancel existing subscription
            if (newSubId) {
              nostrService.unsubscribe(newSubId);
            }
            
            // Try to reconnect to relays
            retry(
              async () => await nostrService.connectToUserRelays(),
              {
                maxAttempts: 3,
                baseDelay: 500,
                backoffFactor: 1.5,
                onRetry: (attempt) => {
                  console.log(`Retrying relay connection, attempt ${attempt}`);
                }
              }
            )
              .then(() => {
                // Setup a new subscription with the same parameters
                const retriedSubId = setupSubscription(sinceFetch, untilFetch);
                setSubId(retriedSubId);
              })
              .catch(err => {
                console.error("Failed to reconnect to relays:", err);
                toast.error("Having trouble connecting to relays. Please try again later.");
              })
              .finally(() => {
                setIsRetrying(false);
              });
          }
        }
      }
    );
    
    // Set up a scheduled task to periodically cache all collected events
    if (newSubId) {
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
            
            // Update the last updated timestamp in localStorage 
            localStorage.setItem(`${feedType}_last_updated`, Date.now().toString());
            
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
  }, [following, activeHashtag, limit, setEvents, handleRepost, fetchProfileData, feedType, mediaOnly, isRetrying]);
  
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
    setupSubscription,
    isRetrying
  };
}
