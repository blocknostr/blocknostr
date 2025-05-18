import { useRef, useCallback } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';
import { getMediaUrlsFromEvent, isValidMediaUrl } from '@/lib/nostr/utils/media-extraction';
import { contentCache } from '@/lib/nostr';

interface UsePostsSubscriptionProps {
  onEvent: (event: NostrEvent, isMediaEvent: boolean) => void;
  onComplete: () => void;
  onError?: (error: Error) => void;
  limit: number;
}

export function usePostsSubscription() {
  const subscriptionRef = useRef<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const eventCountRef = useRef<number>(0);
  const processedEventIds = useRef<Set<string>>(new Set());
  
  const cleanup = useCallback(() => {
    if (subscriptionRef.current) {
      try {
        nostrService.unsubscribe(subscriptionRef.current);
      } catch (error) {
        console.warn("Error unsubscribing:", error);
      }
      subscriptionRef.current = null;
    }
    
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  const subscribe = useCallback(async (
    hexPubkey: string | undefined, 
    { onEvent, onComplete, onError, limit }: UsePostsSubscriptionProps
  ) => {
    // Clean up any existing subscription
    cleanup();
    
    if (!hexPubkey) {
      onComplete();
      return () => {};
    }
    
    // Reset event tracking
    eventCountRef.current = 0;
    processedEventIds.current.clear();
    
    try {
      // First make sure we're connected to relays
      try {
        await nostrService.connectToUserRelays();
      } catch (connectError) {
        console.warn("Error connecting to relays, but continuing with available connections:", connectError);
      }
      
      // Check cache first for immediate rendering
      const cachedEvents = contentCache.getEventsByAuthors([hexPubkey]) || [];
      if (cachedEvents.length > 0) {
        console.log(`[usePostsSubscription] Found ${cachedEvents.length} cached events`);
        
        // Process cached events
        const noteEvents = cachedEvents
          .filter(event => event.kind === 1)
          .sort((a, b) => b.created_at - a.created_at)
          .slice(0, limit);
          
        noteEvents.forEach(event => {
          // Skip if we've already processed this event
          if (processedEventIds.current.has(event.id)) return;
          
          try {
            const mediaUrls = getMediaUrlsFromEvent(event);
            const validMediaUrls = mediaUrls.filter(url => isValidMediaUrl(url));
            const isMediaEvent = validMediaUrls.length > 0;
            
            eventCountRef.current++;
            processedEventIds.current.add(event.id);
            onEvent(event, isMediaEvent);
          } catch (error) {
            console.warn("Error processing cached event:", error);
          }
        });
        
        // If we have enough cached events, complete early
        if (noteEvents.length >= limit) {
          console.log(`[usePostsSubscription] Found ${noteEvents.length} cached events, completing early`);
          // Complete immediately without timeout
          onComplete();
          // Still subscribe to get newer posts
        } else if (noteEvents.length > 0) {
          // We have some cached events but not enough, so mark as partially complete
          // This helps the UI show something immediately
          onComplete();
        }
      }
      
      console.log("[usePostsSubscription] Subscribing to posts");
      
      // Subscribe to user's notes (kind 1)
      let notesSubId: string;
      
      try {
        notesSubId = nostrService.subscribe(
          [
            {
              kinds: [1],
              authors: [hexPubkey],
              limit: Math.min(limit * 2, 100) // Double the limit for more aggressive loading, but cap at 100
            }
          ],
          (event) => {
            try {
              // Skip if we already have this event
              if (processedEventIds.current.has(event.id)) {
                return;
              }
              
              console.log("[usePostsSubscription] Received new post:", event.id.substring(0, 8));
              
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
              
              eventCountRef.current++;
              processedEventIds.current.add(event.id);
              onEvent(event, isMediaEvent);
            } catch (err) {
              console.error("Error processing event:", err);
            }
          }
        );
      } catch (subscribeError) {
        console.error("Error creating subscription:", subscribeError);
        if (onError) {
          onError(subscribeError instanceof Error ? subscribeError : new Error('Subscription failed'));
        }
        onComplete();
        return () => {};
      }
      
      // Store the subscription ID for cleanup
      subscriptionRef.current = notesSubId;
      
      // Set a timeout to check if we got any events and mark loading as complete
      // Reduced to 3 second to remove preload delay but still give enough time
      timeoutRef.current = window.setTimeout(() => {
        console.log(`[usePostsSubscription] Timeout reached, processed ${eventCountRef.current} events total`);
        onComplete();
        // Don't unsubscribe here - keep listening for events
      }, 3000);
      
      // Return a cleanup function
      return () => {
        cleanup();
      };
    } catch (err) {
      console.error("Error in usePostsSubscription:", err);
      if (onError) {
        onError(err instanceof Error ? err : new Error('Unknown subscription error'));
      }
      onComplete();
      return () => {};
    }
  }, [cleanup]);
  
  return { subscribe, cleanup, subscriptionRef };
}
