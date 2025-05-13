
import { NostrEvent, nostrService, contentCache } from "@/lib/nostr";
import { EventDeduplication } from "@/lib/nostr/utils";

interface CreateSubscriptionOptions {
  following?: string[];
  activeHashtag?: string;
  since: number;
  until?: number;
  limit: number;
  setEvents: React.Dispatch<React.SetStateAction<NostrEvent[]>>;
  handleRepost: (event: NostrEvent, setEvents: React.Dispatch<React.SetStateAction<NostrEvent[]>>) => void;
  fetchProfileData: (pubkey: string) => void;
  feedType: string;
  mediaOnly: boolean;
}

/**
 * Creates a Nostr subscription with the given parameters
 */
export function createSubscription({
  following,
  activeHashtag,
  since,
  until,
  limit,
  setEvents,
  handleRepost,
  fetchProfileData,
  feedType,
  mediaOnly
}: CreateSubscriptionOptions): string | null {
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
  let filters: any[] = createFilters(following, limit, since, until);
  
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
      handleEvent(event, setEvents, handleRepost, collectedEvents, feedType, following, activeHashtag, since, until, mediaOnly, fetchProfileData);
    }
  );
  
  // Set up a scheduled task to periodically cache all collected events
  setupCacheInterval(newSubId, collectedEvents, setEvents, feedType, following, activeHashtag, since, until, mediaOnly);
  
  return newSubId;
}

/**
 * Creates the appropriate filters for subscription
 */
function createFilters(following?: string[], limit?: number, since?: number, until?: number): any[] {
  if (following && following.length > 0) {
    // Following feed - filter by authors
    return [
      {
        kinds: [1], // Regular notes
        authors: following,
        limit: limit,
        since: since,
        until: until
      },
      {
        kinds: [6], // Reposts
        authors: following,
        limit: Math.floor((limit || 100) * 0.4), // Fewer reposts than original posts
        since: since,
        until: until
      }
    ];
  } else {
    // Global feed - no author filter
    return [
      {
        kinds: [1], // Regular notes
        limit: limit,
        since: since,
        until: until
      },
      {
        kinds: [6], // Reposts
        limit: Math.floor((limit || 100) * 0.4), // Fewer reposts than original posts
        since: since,
        until: until
      }
    ];
  }
}

/**
 * Handles incoming events from subscriptions
 */
function handleEvent(
  event: NostrEvent,
  setEvents: React.Dispatch<React.SetStateAction<NostrEvent[]>>,
  handleRepost: (event: NostrEvent, setEvents: React.Dispatch<React.SetStateAction<NostrEvent[]>>) => void,
  collectedEvents: NostrEvent[],
  feedType: string,
  following?: string[],
  activeHashtag?: string,
  since?: number,
  until?: number,
  mediaOnly: boolean = false,
  fetchProfileData?: (pubkey: string) => void
) {
  if (event.kind === 1) {
    // Process regular note
    processRegularNote(event, setEvents, collectedEvents, feedType, following, activeHashtag, since, until, mediaOnly);
  }
  else if (event.kind === 6) {
    // Process repost
    handleRepost(event, setEvents);
  }
  
  // Fetch profile data for this pubkey if we don't have it yet
  if (event.pubkey && fetchProfileData) {
    // Check cache first
    const cachedProfile = contentCache.getProfile(event.pubkey);
    if (!cachedProfile) {
      // Fetch from relays if not in cache
      fetchProfileData(event.pubkey);
    }
  }
}

/**
 * Processes a regular note event
 */
function processRegularNote(
  event: NostrEvent,
  setEvents: React.Dispatch<React.SetStateAction<NostrEvent[]>>,
  collectedEvents: NostrEvent[],
  feedType: string,
  following?: string[],
  activeHashtag?: string,
  since?: number,
  until?: number,
  mediaOnly: boolean = false
) {
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
      // Use current state to ensure we have the latest events
      contentCache.cacheFeed(
        feedType,
        uniqueEvents,
        {
          authorPubkeys: following,
          hashtag: activeHashtag,
          since: since,
          until: until,
          mediaOnly
        },
        true // Mark as important for offline use
      );
    }
    
    return uniqueEvents;
  });
}

/**
 * Sets up periodic caching for collected events
 */
function setupCacheInterval(
  subId: string | null,
  collectedEvents: NostrEvent[],
  setEvents: React.Dispatch<React.SetStateAction<NostrEvent[]>>,
  feedType: string,
  following?: string[],
  activeHashtag?: string,
  since?: number,
  until?: number,
  mediaOnly: boolean = false
) {
  if (!subId) return;
  
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
            since: since,
            until: until,
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
    if (id === subId) {
      clearInterval(cacheIntervalId);
      nostrService.unsubscribe = originalUnsubscribe;
    }
    return originalUnsubscribe.call(nostrService, id);
  };
}
