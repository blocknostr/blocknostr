
import { useState, useEffect, useRef } from 'react';
import { nostrService } from '@/lib/nostr';
import { toast } from 'sonner';

interface UseProfileRelationsProps {
  hexPubkey: string | undefined;
  isCurrentUser: boolean;
}

export function useProfileRelations({ hexPubkey, isCurrentUser }: UseProfileRelationsProps) {
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const subscriptionsRef = useRef<string[]>([]);
  const timeoutsRef = useRef<number[]>([]);
  const mountedRef = useRef(true);
  
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
    if (!hexPubkey) return;
    
    // Reset state when pubkey changes
    setFollowers([]);
    setFollowing([]);
    setHasError(false);
    setErrorMessage(null);
    
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
    
    setIsLoading(true);
    
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
            }
          }
        );
        
        subscriptionsRef.current.push(followersSubId);
        
        // Set a timeout to mark loading as complete after 15 seconds max
        const timeoutId = window.setTimeout(() => {
          if (!mountedRef.current) return;
          
          console.log("Relations loading timeout - Following found:", followingFound, "Followers found:", followersFound);
          
          setIsLoading(false);
          
          if (!followingFound && !followersFound) {
            console.warn("No relations found for profile");
            setHasError(true);
            setErrorMessage("No relations data found. Try refreshing.");
          }
          
        }, 15000);
        
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
        }, 5000);
        
        timeoutsRef.current.push(timeoutId);
        timeoutsRef.current.push(checkProgressId);
        
      } catch (error) {
        console.error("Error setting up profile relations subscriptions:", error);
        if (mountedRef.current) {
          setIsLoading(false);
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

  return { 
    followers, 
    following, 
    isLoading,
    hasError,
    errorMessage,
    refetch: () => {
      if (hexPubkey) {
        // Clear state and retry
        setFollowers([]);
        setFollowing([]);
        setHasError(false);
        setErrorMessage(null);
        setIsLoading(true);
        
        // Unsubscribe from all current subscriptions
        subscriptionsRef.current.forEach(subId => {
          if (subId) nostrService.unsubscribe(subId);
        });
        subscriptionsRef.current = [];
        
        // Force reconnect to relays and retry
        nostrService.connectToUserRelays()
          .then(() => {
            // This will trigger the effect again
            // This is a simple way to force a refetch
            const temp = hexPubkey;
            setFollowing([]);
            setFollowers([]);
            
            // Will trigger useEffect above
            const event = new CustomEvent('refetchRelations', { detail: { pubkey: temp } });
            window.dispatchEvent(event);
          })
          .catch(err => {
            console.error("Failed to reconnect to relays:", err);
            setIsLoading(false);
            setHasError(true);
            setErrorMessage("Failed to reconnect to relays");
            toast.error("Failed to connect to relays");
          });
      }
    }
  };
}
