
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { nostrService } from '@/lib/nostr';
import { adaptedNostrService } from '@/lib/nostr/nostr-adapter';
import { profileRelaySelector } from '@/lib/nostr/relay/selection/profile-relay-selector';
import { retry, parallelRetry } from '@/lib/utils/retry';

interface UseEnhancedProfileLoadingProps {
  pubkey?: string;
  npub?: string;
  currentUserPubkey: string | null;
}

export function useEnhancedProfileLoading({ 
  pubkey,
  npub, 
  currentUserPubkey 
}: UseEnhancedProfileLoadingProps) {
  // Core state
  const [profileData, setProfileData] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  
  // Loading states for progressive UI
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [relationsLoading, setRelationsLoading] = useState(true);
  
  // Error states
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [relationsError, setRelationsError] = useState<string | null>(null);

  // Refs
  const mountedRef = useRef(true);
  const abortControllersRef = useRef<AbortController[]>([]);
  const hexPubkeyRef = useRef<string | null>(null);
  
  // Convert npub to hex if needed
  useEffect(() => {
    if (!npub && !pubkey) return;
    
    try {
      if (pubkey && pubkey.length === 64) {
        hexPubkeyRef.current = pubkey;
      } else if (npub) {
        if (npub.startsWith('npub1')) {
          hexPubkeyRef.current = nostrService.getHexFromNpub(npub);
        } else {
          hexPubkeyRef.current = npub;
        }
      } else if (currentUserPubkey) {
        hexPubkeyRef.current = currentUserPubkey;
      }
      
      console.log('Resolved pubkey:', hexPubkeyRef.current);
    } catch (error) {
      console.error('Error converting pubkey:', error);
      setMetadataError('Invalid profile identifier');
    }
  }, [npub, pubkey, currentUserPubkey]);
  
  // Combined fetch function with intelligent relay selection
  const fetchProfileData = useCallback(async () => {
    if (!hexPubkeyRef.current) return;
    const hexPubkey = hexPubkeyRef.current;
    
    // First try to parse as nprofile to extract relay hints
    let relayHints: string[] = [];
    if (npub && npub.startsWith('nprofile1')) {
      const parsed = profileRelaySelector.parseNprofileUri(npub);
      if (parsed?.relays) {
        relayHints = parsed.relays;
        console.log('Found relay hints in nprofile:', relayHints);
      }
    }
    
    // Start with cached data if available for immediate UI
    const cachedProfile = nostrService.getCachedProfile?.(hexPubkey);
    if (cachedProfile) {
      console.log('Using cached profile data:', cachedProfile.name || cachedProfile.display_name);
      setProfileData(cachedProfile);
    }
    
    // Set up abort controller for this operation
    const controller = new AbortController();
    abortControllersRef.current.push(controller);
    
    try {
      setMetadataLoading(true);
      setMetadataError(null);
      
      // 1. Connect to optimal relays
      await connectToOptimalRelays(hexPubkey, relayHints);
      
      // 2. Fetch profile metadata with retry
      const profileMetadata = await retry(
        async () => {
          const profile = await nostrService.getUserProfile(hexPubkey);
          if (!profile) throw new Error('Profile not found');
          return profile;
        },
        {
          maxAttempts: 3,
          baseDelay: 1000,
          backoffFactor: 1.5,
          onRetry: (attempt) => {
            console.log(`Retrying profile fetch (${attempt})...`);
            // Try different relays on retries
            connectToOptimalRelays(hexPubkey, relayHints, true);
          }
        }
      ).catch(error => {
        console.error('Failed to fetch profile after retries:', error);
        // If we have cached data, we'll use that
        return cachedProfile || null;
      });
      
      if (profileMetadata) {
        if (mountedRef.current) {
          setProfileData(profileMetadata);
          setMetadataLoading(false);
          
          // Record successful relays
          const connectedRelays = adaptedNostrService.getRelayStatus()
            .filter(r => r.status === 'connected')
            .map(r => r.url);
          
          connectedRelays.forEach(url => {
            profileRelaySelector.recordProfileRelayResult(hexPubkey, url, true);
          });
        }
      } else if (mountedRef.current && !profileData) {
        // Create minimal profile data when nothing is found
        setProfileData({
          pubkey: hexPubkey,
          created_at: Math.floor(Date.now() / 1000)
        });
        setMetadataLoading(false);
      }
      
      // Fetch posts and relations in parallel after metadata is loaded
      if (!controller.signal.aborted) {
        fetchPostsAndMedia(hexPubkey);
        fetchFollowersAndFollowing(hexPubkey);
      }
    } catch (error) {
      console.error('Error in profile data loading:', error);
      if (mountedRef.current) {
        setMetadataError(error instanceof Error ? error.message : 'Failed to load profile');
        setMetadataLoading(false);
      }
    }
  }, [npub, profileData]);

  // Connect to the optimal relays for this profile
  const connectToOptimalRelays = async (
    hexPubkey: string, 
    relayHints: string[] = [],
    forceRefresh: boolean = false
  ) => {
    try {
      // First make sure we're connected to some relays
      await nostrService.connectToUserRelays();
      
      const connectedRelays = adaptedNostrService.getRelayStatus()
        .filter(r => r.status === 'connected')
        .map(r => r.url);
      
      // If we already have enough connected relays, don't connect more unless forced
      if (connectedRelays.length >= 3 && !forceRefresh) {
        return;
      }
      
      // Build a list of candidate relays: hints + discovered + popular
      const candidates = [
        ...relayHints,
        ...adaptedNostrService.getRelayUrls(),
        "wss://relay.damus.io",
        "wss://nos.lol",
        "wss://relay.nostr.band",
        "wss://relay.primal.net",
        "wss://relay.snort.social"
      ];
      
      // Get best relays for this profile
      const bestRelays = profileRelaySelector.getBestRelaysForProfile(
        hexPubkey,
        candidates,
        5
      );
      
      console.log('Best relays for profile:', bestRelays);
      
      // Connect to these relays
      await nostrService.addMultipleRelays(bestRelays);
    } catch (error) {
      console.warn('Error connecting to optimal relays:', error);
      // Fall back to default relays
      await nostrService.connectToDefaultRelays().catch(console.error);
    }
  };
  
  // Fetch posts and media with parallel retry
  const fetchPostsAndMedia = async (hexPubkey: string) => {
    setPostsLoading(true);
    setPostsError(null);
    
    try {
      // Get best relays for read operations
      const readRelays = adaptedNostrService.getRelayStatus()
        .filter(r => r.status === 'connected' && r.read)
        .map(r => r.url);
      
      if (readRelays.length === 0) {
        await connectToOptimalRelays(hexPubkey, [], true);
      }
      
      // Create parallel fetch functions
      const fetchFunctions = adaptedNostrService.createBatchedFetchers(
        hexPubkey,
        { limit: 50, kinds: [1] }
      );
      
      // Use parallelRetry for resilience
      const results = await retry(
        async () => {
          return parallelRetry(fetchFunctions, {
            maxAttempts: 2,
            baseDelay: 1000,
            onRetry: (attempt) => console.log(`Retrying posts fetch batch (${attempt})...`)
          }, 1);
        },
        {
          maxAttempts: 2,
          baseDelay: 2000,
          onRetry: () => {
            console.log('Retrying entire posts fetch operation...');
            // Refresh relays on retry
            connectToOptimalRelays(hexPubkey, [], true);
          }
        }
      );
      
      // Process events
      const flattenedEvents = results.flat();
      console.log(`Fetched ${flattenedEvents.length} posts`);
      
      if (mountedRef.current) {
        setEvents(flattenedEvents);
        setPostsLoading(false);
        
        // Record successful relays
        const connectedRelays = adaptedNostrService.getRelayStatus()
          .filter(r => r.status === 'connected')
          .map(r => r.url);
        
        connectedRelays.forEach(url => {
          profileRelaySelector.recordProfileRelayResult(hexPubkey, url, true);
        });
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      if (mountedRef.current) {
        setPostsError('Failed to load posts');
        setPostsLoading(false);
      }
    }
  };
  
  // Fetch followers and following
  const fetchFollowersAndFollowing = async (hexPubkey: string) => {
    setRelationsLoading(true);
    setRelationsError(null);
    
    try {
      // Since we don't have direct access to getFollowing/getFollowers,
      // we'll implement simplified versions here
      const fetchFollowing = async () => {
        try {
          const followingEvents = await nostrService.getEvents([{
            kinds: [3], // contact list events
            authors: [hexPubkey],
            limit: 1
          }]);
          
          if (followingEvents.length > 0) {
            // Extract pubkeys from the 'p' tags in the most recent contact list event
            const contactEvent = followingEvents[0];
            return contactEvent.tags
              .filter(tag => tag[0] === 'p' && tag[1])
              .map(tag => tag[1]);
          }
          return [];
        } catch (error) {
          console.error('Error fetching following:', error);
          return [];
        }
      };
      
      const fetchFollowers = async () => {
        try {
          // This is more complex as we need to find all contact lists containing this pubkey
          // Simplified implementation for now
          const followerEvents = await nostrService.getEvents([{
            kinds: [3], // contact list events
            '#p': [hexPubkey], // events with tags containing this pubkey
            limit: 50
          }]);
          
          // Extract the authors of these events as they are followers
          return [...new Set(followerEvents.map(event => event.pubkey))];
        } catch (error) {
          console.error('Error fetching followers:', error);
          return [];
        }
      };
      
      const [fetchedFollowing, fetchedFollowers] = await Promise.allSettled([
        retry(
          fetchFollowing,
          { 
            maxAttempts: 2, 
            baseDelay: 1000,
            onRetry: () => console.log('Retrying following fetch...')
          }
        ),
        retry(
          fetchFollowers,
          { 
            maxAttempts: 2, 
            baseDelay: 1000,
            onRetry: () => console.log('Retrying followers fetch...')
          }
        )
      ]);
      
      if (mountedRef.current) {
        if (fetchedFollowing.status === 'fulfilled') {
          setFollowing(fetchedFollowing.value);
        }
        
        if (fetchedFollowers.status === 'fulfilled') {
          setFollowers(fetchedFollowers.value);
        }
        
        setRelationsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching relations:', error);
      if (mountedRef.current) {
        setRelationsError('Failed to load connections');
        setRelationsLoading(false);
      }
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    if (hexPubkeyRef.current) {
      fetchProfileData();
    }
    
    return () => {
      // Clean up all abort controllers
      abortControllersRef.current.forEach(controller => {
        controller.abort();
      });
      mountedRef.current = false;
    };
  }, [fetchProfileData]);
  
  // Reload function
  const reload = useCallback(async () => {
    try {
      // Abort any ongoing operations
      abortControllersRef.current.forEach(controller => {
        controller.abort();
      });
      abortControllersRef.current = [];
      
      // Clear errors
      setMetadataError(null);
      setPostsError(null);
      setRelationsError(null);
      
      // Start loading
      setMetadataLoading(true);
      setPostsLoading(true);
      setRelationsLoading(true);
      
      // Refresh relay connections first
      if (hexPubkeyRef.current) {
        await connectToOptimalRelays(hexPubkeyRef.current, [], true);
      }
      
      // Then fetch data
      await fetchProfileData();
      
      return true;
    } catch (error) {
      console.error('Error during reload:', error);
      toast.error('Failed to refresh profile');
      return false;
    }
  }, [fetchProfileData]);
  
  return {
    // Data
    profileData,
    events,
    followers,
    following,
    
    // Loading states for progressive UI
    metadataLoading,
    postsLoading,
    relationsLoading,
    loading: metadataLoading || postsLoading,
    
    // Error states
    metadataError,
    postsError,
    relationsError,
    error: metadataError || postsError || relationsError,
    
    // Actions
    reload,
    
    // Helpers
    hexPubkey: hexPubkeyRef.current,
    isCurrentUser: currentUserPubkey && hexPubkeyRef.current === currentUserPubkey
  };
}
