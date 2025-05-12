
import { useState, useEffect, useRef, useCallback } from "react";
import { nostrService, EVENT_KINDS, NostrEvent } from "@/lib/nostr";
import { useRetry } from "@/lib/retry";
import { toast } from "sonner";

/**
 * Enhanced profile loading hook that uses a multi-phase approach:
 * 1. Initial fast load from cache or recent events
 * 2. Background load for complete profile data
 * 3. Parallel requests to different relay groups
 */
export function useEnhancedProfileLoading({
  npub,
  currentUserPubkey
}: {
  npub: string | undefined;
  currentUserPubkey: string | null;
}) {
  const [profileData, setProfileData] = useState<any>(null);
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [relationsLoading, setRelationsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [hexPubkey, setHexPubkey] = useState<string | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  
  // Track subscriptions to clean up
  const subscriptionIds = useRef<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  
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
  
  // Convert npub to hex pubkey
  useEffect(() => {
    if (!npub) {
      setHexPubkey(null);
      return;
    }
    
    try {
      const hex = nostrService.getHexFromNpub(npub);
      setHexPubkey(hex);
      
      // Check if this is the current user
      if (currentUserPubkey && hex === currentUserPubkey) {
        setIsCurrentUser(true);
      } else {
        setIsCurrentUser(false);
      }
    } catch (e) {
      console.error("Error converting npub to hex:", e);
      setError("Invalid profile identifier");
    }
  }, [npub, currentUserPubkey]);
  
  // Function to load profile data
  const loadProfile = useCallback(async () => {
    if (!hexPubkey) {
      setLoading(false);
      return false;
    }
    
    setLoading(true);
    setError(null);
    setMetadataError(null);
    setMetadataLoading(true);
    
    try {
      // Phase 1: Fast initial load - check cache first
      let cachedProfile = null;
      try {
        cachedProfile = await nostrService.getUserProfile(hexPubkey);
      } catch (e) {
        console.error("Error loading cached profile:", e);
      }

      if (cachedProfile) {
        setProfileData(cachedProfile);
      }

      // Connect to relays
      await nostrService.connectToUserRelays();
      
      // Set up abort controller for fetch operations
      abortControllerRef.current = new AbortController();
      
      // Phase 2: Load profile metadata from relays
      const metadataFetchers = nostrService.createBatchedFetchers(hexPubkey, {
        kinds: [EVENT_KINDS.META],
        limit: 5
      });
      
      // Execute all fetchers in parallel
      const metadataPromises = metadataFetchers.map(fetchFn => fetchFn());
      const metadataResults = await Promise.allSettled(metadataPromises);
      
      // Combine successful results
      const metadataEvents: NostrEvent[] = [];
      metadataResults.forEach(result => {
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
          setProfileData(parsedContent);
          setMetadataError(null);
        } catch (e) {
          console.error("Error parsing profile metadata:", e);
          setMetadataError("Failed to parse profile data");
        }
      } else if (!cachedProfile) {
        setMetadataError("No profile data found");
      }
      
      setMetadataLoading(false);
      
      // Phase 3: Load user posts
      setPostsLoading(true);
      
      // Subscribe to events from this author
      const postFilters = {
        kinds: [EVENT_KINDS.TEXT_NOTE],
        authors: [hexPubkey],
        limit: 30
      };
      
      const postsSubId = nostrService.subscribe(
        [postFilters],
        (event: NostrEvent) => {
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
      
      // Set up a timeout to mark posts as loaded after a reasonable delay
      setTimeout(() => {
        setPostsLoading(false);
      }, 3000);
      
      // Phase 4: Load followers and following
      setRelationsLoading(true);
      
      // Load followers (who lists this user in their contacts)
      try {
        const followerLists = await nostrService.getEvents([{
          kinds: [EVENT_KINDS.CONTACTS],
          "#p": [hexPubkey],
          limit: 50
        }]);
        
        const followerPubkeys = followerLists
          .map(event => event.pubkey)
          .filter(Boolean);
        
        setFollowers(followerPubkeys);
      } catch (e) {
        console.error("Error loading followers:", e);
      }
      
      // Load following (who this user lists in their contacts)
      try {
        const followingLists = await nostrService.getEvents([{
          kinds: [EVENT_KINDS.CONTACTS],
          authors: [hexPubkey],
          limit: 1
        }]);
        
        if (followingLists.length > 0) {
          const followingEvent = followingLists[0];
          const followingPubkeys = followingEvent.tags
            .filter(tag => tag[0] === 'p')
            .map(tag => tag[1]);
          
          setFollowing(followingPubkeys);
        }
      } catch (e) {
        console.error("Error loading following:", e);
      }
      
      setRelationsLoading(false);
      setLoading(false);
      return true;
      
    } catch (error) {
      console.error("Error loading profile:", error);
      setError("Failed to load profile data");
      setMetadataLoading(false);
      setPostsLoading(false);
      setRelationsLoading(false);
      setLoading(false);
      return false;
    }
  }, [hexPubkey]);

  // Reload profile data
  const reload = useCallback(async () => {
    cleanupSubscriptions();
    setEvents([]);
    return loadProfile();
  }, [cleanupSubscriptions, loadProfile]);

  // Initial load
  useEffect(() => {
    if (hexPubkey) {
      loadProfile();
    }
    
    return () => {
      cleanupSubscriptions();
    };
  }, [hexPubkey, loadProfile, cleanupSubscriptions]);

  return {
    profileData,
    events,
    followers,
    following,
    metadataLoading,
    postsLoading,
    relationsLoading,
    loading: loading || isRetrying,
    error,
    reload,
    hexPubkey,
    isCurrentUser,
    metadataError
  };
}
