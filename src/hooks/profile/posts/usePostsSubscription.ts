
import { useRef, useCallback } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';
import { getMediaUrlsFromEvent, isValidMediaUrl } from '@/lib/nostr/utils';
import { contentCache } from '@/lib/nostr';

interface UsePostsSubscriptionProps {
  onEvent: (event: NostrEvent, isMediaEvent: boolean) => void;
  onComplete: () => void;
  limit: number;
}

export function usePostsSubscription() {
  const subscriptionRef = useRef<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  
  const subscribe = useCallback(async (
    hexPubkey: string | undefined, 
    { onEvent, onComplete, limit }: UsePostsSubscriptionProps
  ) => {
    if (!hexPubkey) {
      onComplete();
      return () => {};
    }
    
    // Cleanup previous subscription and timeout
    if (subscriptionRef.current) {
      nostrService.unsubscribe(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    try {
      // First make sure we're connected to relays
      await nostrService.connectToUserRelays();
      
      // Add default relays to increase chances of success
      const defaultRelays = ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.nostr.band"];
      await nostrService.addMultipleRelays(defaultRelays);
      
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

            // Check if note contains media
            const mediaUrls = getMediaUrlsFromEvent(event);
            const validMediaUrls = mediaUrls.filter(url => isValidMediaUrl(url));
            const isMediaEvent = validMediaUrls.length > 0;
            
            onEvent(event, isMediaEvent);
          } catch (err) {
            console.error("Error processing event in usePostsSubscription:", err);
          }
        }
      );
      
      // Store the subscription ID for cleanup
      subscriptionRef.current = notesSubId;
      console.log("Created subscription:", notesSubId, "for posts");
      
      // Set a timeout to check if we got any events and mark loading as complete
      timeoutRef.current = window.setTimeout(() => {
        onComplete();
      }, 5000);
      
      // Add a quick-feedback timeout to show initial results faster
      setTimeout(() => {
        // This will be called if we have events but haven't completed yet
        // The subscription continues running
      }, 2000);
      
      // Return a cleanup function
      return () => {
        if (subscriptionRef.current) {
          nostrService.unsubscribe(subscriptionRef.current);
          subscriptionRef.current = null;
        }
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    } catch (err) {
      console.error("Error in usePostsSubscription:", err);
      onComplete();
      return () => {};
    }
  }, []);
  
  const cleanup = useCallback(() => {
    if (subscriptionRef.current) {
      nostrService.unsubscribe(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { subscribe, cleanup, subscriptionRef };
}
