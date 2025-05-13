
import { NostrEvent, nostrService } from '@/lib/nostr';
import { contentCache } from '@/lib/nostr';
import { extractMediaUrls, isValidMediaUrl } from '@/lib/nostr/utils';

export interface PostSubscriptionOptions {
  hexPubkey: string;
  limit?: number;
  onEvent?: (event: NostrEvent) => void;
  onMediaEvent?: (event: NostrEvent) => void;
  onHasEvents?: () => void;
}

/**
 * Creates a subscription for a user's posts
 */
export function createPostSubscription({
  hexPubkey,
  limit = 50,
  onEvent,
  onMediaEvent,
  onHasEvents
}: PostSubscriptionOptions): {
  subscriptionId: string;
  cleanup: () => void;
} {
  // Connect to relays first
  nostrService.connectToUserRelays();
  
  // Add default relays to increase chances of success
  const defaultRelays = ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.nostr.band"];
  nostrService.addMultipleRelays(defaultRelays);
  
  console.log("Connected to relays, subscribing to posts");
  
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
      try {
        console.log("Received post event:", event.id.substring(0, 8), "from", event.pubkey.substring(0, 8));
        
        // Cache the event
        try {
          contentCache.cacheEvent(event);
        } catch (cacheError) {
          console.warn("Failed to cache event:", cacheError);
        }
        
        // Call the onEvent callback if provided
        if (onEvent) {
          onEvent(event);
        }

        // Check if note contains media using our enhanced detection
        const mediaUrls = extractMediaUrls(event.content, event.tags);
        
        // Validate the URLs to ensure they're proper media links
        const validMediaUrls = mediaUrls.filter(url => isValidMediaUrl(url));
        
        if (validMediaUrls.length > 0 && onMediaEvent) {
          onMediaEvent(event);
        }
        
        // Signal that we have events
        if (onHasEvents) {
          onHasEvents();
        }
      } catch (err) {
        console.error("Error processing event in post subscription:", err);
      }
    }
  );
  
  return {
    subscriptionId: notesSubId,
    cleanup: () => {
      if (notesSubId) {
        nostrService.unsubscribe(notesSubId);
      }
    }
  };
}
