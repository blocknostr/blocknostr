
import { useState, useEffect, useRef, useCallback } from "react";
import { nostrService, EVENT_KINDS, NostrEvent } from "@/lib/nostr";
import { ProfileRelaySelector } from "./profile-relay-selector";
import { useRetry } from "@/lib/retry";
import { toast } from "sonner";

/**
 * Enhanced profile loading hook that uses a multi-phase approach:
 * 1. Initial fast load from cache or recent events
 * 2. Background load for complete profile data
 * 3. Parallel requests to different relay groups
 */
export function useEnhancedProfileLoading(pubkey: string | undefined) {
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [phase, setPhase] = useState<'initial' | 'background' | 'complete'>('initial');
  const [relaysStatus, setRelaysStatus] = useState<{connected: number, total: number}>({connected: 0, total: 0});
  
  // Track subscriptions to clean up
  const subscriptionIds = useRef<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const relaySelector = useRef(new ProfileRelaySelector());
  
  // Cleanup function for subscriptions
  const cleanupSubscriptions = useCallback(() => {
    subscriptionIds.current.forEach(subId => {
      try {
        nostrService.unsubscribe(subId);
      } catch (e) {
        console.error("Error unsubscribing:", e);
      }
    });
    subscriptionIds.current = [];
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Retry helper for failed operations
  const { retry, isRetrying } = useRetry({
    maxRetries: 3,
    baseDelay: 1000,
  });
  
  // Function to load profile data
  const loadProfile = useCallback(async () => {
    if (!pubkey) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setIsError(false);
    
    try {
      // Phase 1: Fast initial load - check cache first
      let cachedProfile = null;
      try {
        cachedProfile = await nostrService.getUserProfile(pubkey);
      } catch (e) {
        console.error("Error loading cached profile:", e);
      }

      if (cachedProfile) {
        setProfile(cachedProfile);
      }

      // Connect to relays
      await nostrService.connectToUserRelays();
      
      // Get relay status
      const relays = nostrService.getRelayStatus();
      const connectedRelays = relays.filter(r => r.status === 'connected');
      setRelaysStatus({
        connected: connectedRelays.length,
        total: relays.length
      });
      
      if (connectedRelays.length === 0) {
        console.warn("No connected relays available");
        // Try to connect to default relays
        await nostrService.connectToDefaultRelays();
      }
      
      // Set up abort controller for fetch operations
      abortControllerRef.current = new AbortController();
      
      // Phase 2: Load profile metadata from multiple relay groups in parallel
      setPhase('background');
      
      // Create batched fetchers for profile metadata
      const fetchers = nostrService.createBatchedFetchers(pubkey, {
        kinds: [EVENT_KINDS.META],
        limit: 5
      });
      
      // Execute all fetchers in parallel
      const fetchPromises = fetchers.map(fetchFn => fetchFn());
      
      const fetchResults = await Promise.allSettled(fetchPromises);
      
      // Combine successful results
      const metadataEvents: NostrEvent[] = [];
      fetchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          metadataEvents.push(...result.value);
        }
      });
      
      // If we have metadata events, find the latest one
      if (metadataEvents.length > 0) {
        const latestEvent = metadataEvents.sort((a, b) => b.created_at - a.created_at)[0];
        
        try {
          const parsedContent = JSON.parse(latestEvent.content);
          // Update profile with latest metadata
          setProfile(parsedContent);
        } catch (e) {
          console.error("Error parsing profile metadata:", e);
        }
      }
      
      // Phase 3: Load user posts and other events in parallel
      setPhase('complete');
      
      // Set up filters for user posts
      const postFilters = {
        kinds: [EVENT_KINDS.TEXT_NOTE],
        authors: [pubkey],
        limit: 30
      };
      
      // Subscribe to events from this author
      const postsSubId = nostrService.subscribe(
        [postFilters],
        (event) => {
          setEvents(prev => {
            // Check if we already have this event
            if (prev.some(e => e.id === event.id)) {
              return prev;
            }
            // Add new event and sort by timestamp
            return [...prev, event].sort((a, b) => b.created_at - a.created_at);
          });
        }
      );
      
      subscriptionIds.current.push(postsSubId);
      
      // Also check for mentions of this user
      const mentionFilters = {
        kinds: [EVENT_KINDS.TEXT_NOTE],
        '#p': [pubkey],
        limit: 20
      };
      
      const mentionsSubId = nostrService.subscribe(
        [mentionFilters],
        (event) => {
          setEvents(prev => {
            // Check if we already have this event
            if (prev.some(e => e.id === event.id)) {
              return prev;
            }
            // Add new event and sort by timestamp
            return [...prev, event].sort((a, b) => b.created_at - a.created_at);
          });
        }
      );
      
      subscriptionIds.current.push(mentionsSubId);
      
      // Check if we got any data
      setTimeout(() => {
        if (events.length === 0) {
          setIsEmpty(true);
        }
        setIsLoading(false);
      }, 3000);
      
    } catch (error) {
      console.error("Error loading profile:", error);
      setIsError(true);
      setIsLoading(false);
      
      // Retry on error
      retry(() => loadProfile());
    }
  }, [pubkey, retry]);

  // Reload profile data
  const refreshProfile = useCallback(() => {
    cleanupSubscriptions();
    setEvents([]);
    setIsLoading(true);
    setIsError(false);
    setIsEmpty(false);
    setPhase('initial');
    
    loadProfile();
  }, [cleanupSubscriptions, loadProfile]);

  // Initial load
  useEffect(() => {
    loadProfile();
    
    return () => {
      cleanupSubscriptions();
    };
  }, [pubkey, loadProfile, cleanupSubscriptions]);

  return {
    profile,
    events,
    isLoading: isLoading || isRetrying,
    isError,
    isEmpty,
    refreshProfile,
    phase,
    relaysStatus
  };
}
