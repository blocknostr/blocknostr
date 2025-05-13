
import { NostrEvent, nostrService } from '@/lib/nostr';
import { MutableRefObject } from 'react';
import { toast } from 'sonner';

/**
 * Clean up an existing subscription
 */
export function cleanupSubscription(
  subscriptionRef: MutableRefObject<string | null>,
  timeoutRef: MutableRefObject<number | null>
): void {
  if (subscriptionRef.current) {
    nostrService.unsubscribe(subscriptionRef.current);
    subscriptionRef.current = null;
  }
  
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
}

/**
 * Create a subscription to fetch profile posts
 */
export function createPostsSubscription(
  hexPubkey: string,
  limit: number,
  isMounted: MutableRefObject<boolean>,
  eventCountRef: MutableRefObject<number>,
  updateEvents: (event: NostrEvent) => void,
  updateMedia: (event: NostrEvent) => void,
  updateHasEvents: () => void
): string {
  // Subscribe to user's notes (kind 1)
  const notesSubId = nostrService.subscribe(
    [
      {
        kinds: [1],
        authors: [hexPubkey],
        limit: limit
      }
    ],
    (event) => {
      if (!isMounted.current) return;
      
      try {
        console.log("Received post event:", event.id.substring(0, 8), "from", event.pubkey.substring(0, 8));
        eventCountRef.current += 1;
        
        // Add event to events list
        updateEvents(event);
        
        // Check if note contains media and update media list if needed
        updateMedia(event);
        
        updateHasEvents();
      } catch (err) {
        console.error("Error processing event in useProfilePosts:", err);
      }
    }
  );
  
  console.log("Created subscription:", notesSubId, "for posts");
  return notesSubId;
}

/**
 * Set up loading timeouts to ensure UI is responsive
 */
export function setupLoadingTimeouts(
  isMounted: MutableRefObject<boolean>,
  eventCountRef: MutableRefObject<number>,
  hasEvents: boolean,
  eventsLength: number,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
): number {
  // Set a timeout to check if we got any events and mark loading as complete
  // Reduced from 15s to 5s for better user experience
  const timeoutId = window.setTimeout(() => {
    if (!isMounted.current) return;
    
    console.log("Posts loading timeout - events found:", eventCountRef.current);
    setLoading(false);
    
    if (eventCountRef.current === 0 && !hasEvents) {
      console.log("No posts found for user");
      // Only show error if we didn't get any events and there are none in the cache
      if (eventsLength === 0) {
        setError("No posts found");
      }
    }
  }, 5000); // Reduced timeout for better UX
  
  // Add a quick-feedback timeout to show initial results faster
  setTimeout(() => {
    if (isMounted.current && eventCountRef.current > 0) {
      setLoading(false);
    }
  }, 2000); // Even quicker feedback if we have events
  
  return timeoutId;
}

/**
 * Setup relays and make sure we're connected
 */
export async function setupRelaysConnection(): Promise<void> {
  try {
    // First make sure we're connected to relays
    await nostrService.connectToUserRelays();
    
    // Add default relays to increase chances of success
    const defaultRelays = ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.nostr.band"];
    await nostrService.addMultipleRelays(defaultRelays);
    
    console.log("Connected to relays, ready to subscribe");
  } catch (err) {
    console.error("Error connecting to relays:", err);
    toast.error("Failed to connect to relays");
    throw err;
  }
}
