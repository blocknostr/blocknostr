
import { useRef } from 'react';
import { nostrService } from '@/lib/nostr';
import { PostsSubscriptionOptions } from './types';
import { SubscriptionTracker } from '@/lib/nostr/subscription-tracker';

export function usePostsSubscription() {
  const subscriptionRef = useRef<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  
  const subscribe = (pubkey: string, options: PostsSubscriptionOptions) => {
    // Clean up any existing subscription first
    cleanup();
    
    // Get the subscription tracker
    const tracker = SubscriptionTracker.getInstance();
    
    // Define filters for posts and media
    const filters = [
      {
        kinds: [1], // Regular notes
        authors: [pubkey],
        limit: options.limit || 50
      }
    ];
    
    // Subscribe to events
    try {
      // First connect to relays
      nostrService.connectToUserRelays().then(() => {
        // Set timeout for loading status
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
        }
        
        // Create a reasonably short timeout for a better UX
        timeoutRef.current = window.setTimeout(() => {
          options.onComplete();
          timeoutRef.current = null;
        }, 10000); // 10 second timeout (was 30s)
        
        // Subscribe to events - Make sure we have the right parameter order
        const subId = nostrService.subscribe(
          filters,
          (event) => {
            // Detect if this is a media event
            const isMediaEvent = event.tags.some(tag => 
              tag.length >= 2 && tag[0] === 'r' && 
              /\.(jpg|jpeg|png|gif|webp)$/i.test(tag[1])
            );
            
            // Call the onEvent callback
            options.onEvent(event, isMediaEvent);
          },
          // Pass options as the fourth parameter after an array of relay URLs
          undefined, // Using default relays
          {
            ttl: 20000, // 20-second subscription
            isRenewable: false,
            componentId: options.componentId // Pass component ID for tracking
          }
        );
        
        subscriptionRef.current = subId;
        
        // Register with the tracker manually as well (belt and suspenders)
        if (options.componentId) {
          tracker.register(subId, () => {
            if (subscriptionRef.current) {
              nostrService.unsubscribe(subscriptionRef.current);
              subscriptionRef.current = null;
            }
          }, options.componentId);
        }
      });
    } catch (error) {
      console.error("Error subscribing to posts:", error);
      options.onComplete(); // Ensure loading state is ended
    }
    
    // Return cleanup function
    return () => {
      cleanup();
    };
  };
  
  const cleanup = () => {
    if (subscriptionRef.current) {
      nostrService.unsubscribe(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  
  return {
    subscribe,
    cleanup,
    subscriptionRef
  };
}
