
import { useState, useEffect, useRef } from 'react';
import { nostrService } from '@/lib/nostr';
import { toast } from 'sonner';

interface UseProfileRelationsProps {
  hexPubkey: string | undefined;
  isCurrentUser: boolean;
  componentId?: string; // Add component ID for subscription tracking
}

export function useProfileRelations({ 
  hexPubkey, 
  isCurrentUser,
  componentId 
}: UseProfileRelationsProps) {
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const subscriptionsRef = useRef<string[]>([]);
  const timeoutsRef = useRef<number[]>([]);
  const mountedRef = useRef(true);
  const initialLoadDoneRef = useRef(false);
  
  // Track if component is still mounted
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Effect to clean up subscriptions and timeouts when component unmounts
  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach(subId => {
        if (subId) nostrService.unsubscribe(subId);
      });
      
      timeoutsRef.current.forEach(id => {
        window.clearTimeout(id);
      });
    };
  }, []);
  
  useEffect(() => {
    if (!hexPubkey) {
      setIsLoading(false);
      return;
    }
    
    // Reset state when pubkey changes
    setFollowers([]);
    setFollowing([]);
    setHasError(false);
    setErrorMessage(null);
    
    // We're now loading new data
    setIsLoading(true);
    
    // Clear existing subscriptions when pubkey changes
    subscriptionsRef.current.forEach(subId => {
      if (subId) nostrService.unsubscribe(subId);
    });
    subscriptionsRef.current = [];
    
    // Clear existing timeouts
    timeoutsRef.current.forEach(id => {
      window.clearTimeout(id);
    });
    timeoutsRef.current = [];
    
    // Track when data has been found
    let followersFound = false;
    let followingFound = false;
    
    const fetchRelations = async () => {
      try {
        console.log("Fetching relations for pubkey:", hexPubkey);
        
        // First make sure we're connected to relays
        await nostrService.connectToUserRelays();
        
        // Add default relays to increase chances of success
        const defaultRelays = ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.nostr.band"];
        await nostrService.addMultipleRelays(defaultRelays);
        
        console.log("Fetching contacts for pubkey:", hexPubkey);
        
        // Fetch contact list according to NIP-02
        const contactsSubId = nostrService.subscribe(
          [
            {
              kinds: [3], // Contact Lists (NIP-02)
              authors: [hexPubkey],
              limit: 5
            }
          ],
          (event) => {
            if (!mountedRef.current) return;
            
            try {
              console.log("Received contacts event:", event);
              // Extract pubkeys from p tags properly according to NIP-02
              const followingList = event.tags
                .filter(tag => tag.length >= 2 && tag[0] === 'p')
                .map(tag => tag[1]);
              
              followingFound = true;
              console.log("Following list:", followingList.length, "contacts");
              
              if (mountedRef.current) {
                setFollowing(followingList);
                
                if (followersFound) {
                  // Both followers and following lists received, we can stop loading
                  setIsLoading(false);
                  initialLoadDoneRef.current = true;
                }
                
                // If this is the current user, we access the following list using public methods
                if (isCurrentUser) {
                  // No need to directly access userManager anymore
                  followingList.forEach(pubkey => {
                    if (!nostrService.isFollowing(pubkey)) {
                      // This is in the relay data but not in our local following
                      // We'll rely on the user explicitly following/unfollowing to sync
                    }
                  });
                }
              }
            } catch (e) {
              console.error('Failed to parse contacts:', e);
            }
          }
        );
        
        subscriptionsRef.current.push(contactsSubId);

        // Fetch followers (other users who have this user in their contacts)
        const followersSubId = nostrService.subscribe(
          [
            {
              kinds: [3], // Contact Lists (NIP-02)
              "#p": [hexPubkey], // Filter for contact lists that contain this pubkey
              limit: 50
            }
          ],
          (event) => {
            if (!mountedRef.current) return;
            
            const followerPubkey = event.pubkey;
            console.log("Found follower:", followerPubkey);
            followersFound = true;
            
            if (mountedRef.current) {
              setFollowers(prev => {
                if (prev.includes(followerPubkey)) return prev;
                return [...prev, followerPubkey];
              });
              
              if (followingFound) {
                // Both followers and following lists received, we can stop loading
                setIsLoading(false);
                initialLoadDoneRef.current = true;
              }
            }
          }
        );
        
        subscriptionsRef.current.push(followersSubId);
        
        // Set a timeout to mark loading as complete much quicker (was 15000)
        // This will show the UI faster with whatever data we have
        const timeoutId = window.setTimeout(() => {
          if (!mountedRef.current) return;
          
          console.log("Relations loading timeout - Following found:", followingFound, "Followers found:", followersFound);
          
          // Consider the initial load done at this point
          initialLoadDoneRef.current = true;
          setIsLoading(false);
          setIsRefetching(false);
          
          if (!followingFound && !followersFound) {
            console.warn("No relations found for profile");
            // Just mark as not loading rather than showing error, since this is now background loading
            // setHasError(true);
            // setErrorMessage("No relations data found. Try refreshing.");
          }
          
        }, 0); // Reduced from 15000 to 0 for immediate UI update
        
        // Set a shorter timeout to check progress and try retry if needed
        const checkProgressId = window.setTimeout(() => {
          if (!mountedRef.current) return;
          
          if (!followingFound || !followersFound) {
            console.log("Relations partial data - attempting retry with more relays");
            
            // Try connecting to more relays if we're missing data
            nostrService.addMultipleRelays([
              "wss://relays.nostr.band",
              "wss://nostr.mutinywallet.com", 
              "wss://relay.snort.social"
            ]).catch(err => console.error("Failed to connect to additional relays:", err));
          }
        }, 2000); // Reduced from 5000 to 2000ms
        
        timeoutsRef.current.push(timeoutId);
        timeoutsRef.current.push(checkProgressId);
        
      } catch (error) {
        console.error("Error setting up profile relations subscriptions:", error);
        if (mountedRef.current) {
          setIsLoading(false);
          setIsRefetching(false);
          setHasError(true);
          setErrorMessage("Failed to load profile relations");
          toast.error("Failed to load profile connections");
        }
      }
    };
    
    fetchRelations();
    
    return () => {
      subscriptionsRef.current.forEach(subId => {
        if (subId) nostrService.unsubscribe(subId);
      });
      
      timeoutsRef.current.forEach(id => {
        window.clearTimeout(id);
      });
    };
  }, [hexPubkey, isCurrentUser]);

  const refetch = async () => {
    if (hexPubkey) {
      // If we're already refetching, don't start again
      if (isRefetching) return;
      
      // Clear state and retry
      setIsRefetching(true);
      
      // Don't set isLoading to true if we already have data
      // to avoid flickering the UI, but use isRefetching state
      // for background updates
      if (!initialLoadDoneRef.current) {
        setIsLoading(true);
      }
      
      setHasError(false);
      setErrorMessage(null);
      
      // Unsubscribe from all current subscriptions
      subscriptionsRef.current.forEach(subId => {
        if (subId) nostrService.unsubscribe(subId);
      });
      subscriptionsRef.current = [];
      
      // Force reconnect to relays and retry
      try {
        await nostrService.connectToUserRelays();
        
        // This will trigger the effect again with the same pubkey
        // which will refresh the data
        const event = new CustomEvent('refetchRelations', { detail: { pubkey: hexPubkey } });
        window.dispatchEvent(event);
      } catch (err) {
        console.error("Failed to reconnect to relays:", err);
        setIsLoading(false);
        setIsRefetching(false);
        setHasError(true);
        setErrorMessage("Failed to reconnect to relays");
        toast.error("Failed to connect to relays");
      }
    }
  };

  return { 
    followers, 
    following, 
    isLoading,
    isRefetching,
    hasError,
    errorMessage,
    refetch
  };
}
