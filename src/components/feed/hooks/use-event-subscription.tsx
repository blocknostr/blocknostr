
import { useState, useEffect, useCallback, useRef } from "react";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";

interface EventWithProfile {
  content: string;
  created_at: number;
  id: string;
  kind: number;
  pubkey: string;
  sig: string;
  tags: string[][];
  // Add profile data
  profile?: {
    name?: string;
    displayName?: string;
    picture?: string;
    nip05?: string;
    about?: string;
    banner?: string;
    website?: string;
    lud16?: string;
  };
}

interface UseEventSubscriptionProps {
  filters: any[];
  options?: {
    enabled?: boolean;
    fetchUserProfiles?: boolean;
    limit?: number;
  };
}

interface UseEventSubscriptionReturn {
  events: EventWithProfile[];
  fetchedProfiles: Set<string>;
  isLoading: boolean;
  error: Error | null;
  fetchMore: () => void;
  hasMore: boolean;
}

export function useEventSubscription({
  filters,
  options = {},
}: UseEventSubscriptionProps): UseEventSubscriptionReturn {
  const {
    enabled = true,
    fetchUserProfiles = true,
    limit = 20,
  } = options;

  const [events, setEvents] = useState<EventWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const fetchedProfiles = useRef<Set<string>>(new Set());
  const subscriptionId = useRef<string | null>(null);
  const relayConnectionAttempted = useRef<boolean>(false);

  // Function to fetch user profiles for events
  const fetchProfiles = useCallback(async (pubkeys: string[]) => {
    try {
      const uniquePubkeys = pubkeys.filter(
        (pubkey) => !fetchedProfiles.current.has(pubkey)
      );

      if (uniquePubkeys.length === 0) return;

      console.log(`Fetching profiles for ${uniquePubkeys.length} users`);
      
      // Mark these pubkeys as fetched to avoid duplicate requests
      uniquePubkeys.forEach((pubkey) => fetchedProfiles.current.add(pubkey));

      const profiles = await nostrService.getProfilesByPubkeys(uniquePubkeys);

      // Update events with profile data
      setEvents((currentEvents) => {
        return currentEvents.map((event) => {
          const profile = profiles.find(
            (profile) => profile.pubkey === event.pubkey
          );
          if (profile) {
            return {
              ...event,
              profile: {
                name: profile.name,
                displayName: profile.displayName,
                picture: profile.picture,
                nip05: profile.nip05,
                about: profile.about,
                banner: profile.banner,
                website: profile.website,
                lud16: profile.lud16,
              },
            };
          }
          return event;
        });
      });
    } catch (err) {
      console.error("Error fetching profiles:", err);
    }
  }, []);

  // Connect to relays and subscribe to events
  useEffect(() => {
    let isMounted = true;
    
    const connectAndSubscribe = async () => {
      if (!enabled || !isMounted) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Connect to relays if not already connected
        if (!relayConnectionAttempted.current) {
          try {
            await nostrService.connectToUserRelays();
            relayConnectionAttempted.current = true;
          } catch (connectError) {
            console.error("Failed to connect to relays:", connectError);
            if (isMounted) {
              toast.error("Failed to connect to relays. Trying to continue...");
            }
          }
        }
        
        // Calculate limit based on page
        const currentLimit = page * limit;
        
        // Create subscription filters with pagination
        const paginatedFilters = filters.map(filter => ({
          ...filter,
          limit: currentLimit
        }));
        
        // Subscribe to events
        const subId = nostrService.subscribe(
          paginatedFilters,
          (event) => {
            if (!isMounted) return;
            
            // Add event to state if it doesn't already exist
            setEvents((prevEvents) => {
              // Check if event already exists in our list
              const exists = prevEvents.some((e) => e.id === event.id);
              if (exists) return prevEvents;
              
              // Add the new event
              const newEvent = { ...event, profile: undefined };
              return [newEvent, ...prevEvents].sort((a, b) => b.created_at - a.created_at);
            });
            
            // Fetch profile for this event if needed
            if (fetchUserProfiles && event.pubkey) {
              fetchProfiles([event.pubkey]);
            }
          },
          // EOSE callback - End of Stored Events
          () => {
            if (!isMounted) return;
            setIsLoading(false);
          },
          // Error handler as a function
          (err) => {
            if (!isMounted) return;
            console.error("Subscription error:", err);
            setError(new Error("Failed to fetch events"));
            setIsLoading(false);
          }
        );
        
        // Save subscription ID for cleanup
        subscriptionId.current = subId;
        
      } catch (err) {
        if (!isMounted) return;
        console.error("Error setting up event subscription:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setIsLoading(false);
      }
    };
    
    connectAndSubscribe();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (subscriptionId.current) {
        nostrService.unsubscribe(subscriptionId.current);
        subscriptionId.current = null;
      }
    };
  }, [enabled, filters, fetchUserProfiles, fetchProfiles, page, limit]);
  
  // Function to fetch more events
  const fetchMore = useCallback(() => {
    setPage((prevPage) => prevPage + 1);
  }, []);
  
  return {
    events,
    fetchedProfiles: fetchedProfiles.current,
    isLoading,
    error,
    fetchMore,
    hasMore
  };
}
