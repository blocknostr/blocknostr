
import { useRef, useCallback } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';
import { getMediaUrlsFromEvent, isValidMediaUrl } from '@/lib/nostr/utils/media-extraction';
import { contentCache } from '@/lib/nostr';
import { UsePostsSubscriptionProps } from './types';

export function usePostsSubscription() {
  const subscriptionRef = useRef<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const eventCountRef = useRef<number>(0);
  
  const subscribe = useCallback(async (
    hexPubkey: string | undefined, 
    options: UsePostsSubscriptionProps
  ) => {
    if (!hexPubkey) {
      options.onComplete();
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
      
      // Check cache first for immediate rendering
      const cachedEvents = contentCache.getEventsByAuthors([hexPubkey]) || [];
      if (cachedEvents.length > 0) {
        console.log(`[usePostsSubscription] Found ${cachedEvents.length} cached events`);
        
        // Process cached events
        const noteEvents = cachedEvents
          .filter(event => event.kind === 1)
          .sort((a, b) => b.created_at - a.created_at)
          .slice(0, options.limit);
          
        noteEvents.forEach(event => {
          const mediaUrls = getMediaUrlsFromEvent(event);
          const validMediaUrls = mediaUrls.filter(url => isValidMediaUrl(url));
          const isMediaEvent = validMediaUrls.length > 0;
          
          eventCountRef.current++;
          options.onEvent(event, isMediaEvent);
        });
        
        // If we have enough cached events, complete early
        if (noteEvents.length >= options.limit) {
          console.log(`[usePostsSubscription] Found ${noteEvents.length} cached events, completing early`);
          setTimeout(() => options.onComplete(), 0);
          // Still subscribe to get newer posts but with shorter timeout
        } else if (noteEvents.length > 0) {
          // We have some cached events but not enough, so mark as partially complete
          // This helps the UI show something immediately
          setTimeout(() => {
            console.log(`[usePostsSubscription] Partial data available, triggering UI update`);
            options.onComplete();
          }, 0);
        }
      }
      
      console.log("[usePostsSubscription] Subscribing to posts");
      
      // Subscribe to user's notes (kind 1)
      const notesSubId = nostrService.subscribe(
        [
          {
            kinds: [1],
            authors: [hexPubkey],
            limit: options.limit
          }
        ],
        (event) => {
          try {
            // Skip if we already have this event from cache
            if (cachedEvents.some(e => e.id === event.id)) {
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
            options.onEvent(event, isMediaEvent);
          } catch (err) {
            console.error("Error processing event:", err);
          }
        },
        undefined,
        {
          componentId: options.componentId // Pass component ID for tracking
        }
      );
      
      // Store the subscription ID for cleanup
      subscriptionRef.current = notesSubId;
      
      // Set a timeout to check if we got any events and mark loading as complete
      // Reduced from 5s to 3s
      timeoutRef.current = window.setTimeout(() => {
        console.log(`[usePostsSubscription] Timeout reached, processed ${eventCountRef.current} events total`);
        options.onComplete();
      }, 3000);
      
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
      options.onComplete();
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
