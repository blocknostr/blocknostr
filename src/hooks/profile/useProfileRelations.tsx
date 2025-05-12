
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
  const subscriptionsRef = useRef<string[]>([]);
  
  // Effect to clean up subscriptions when component unmounts
  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach(subId => {
        if (subId) nostrService.unsubscribe(subId);
      });
    };
  }, []);
  
  useEffect(() => {
    if (!hexPubkey) return;
    
    // Clear existing subscriptions when pubkey changes
    subscriptionsRef.current.forEach(subId => {
      if (subId) nostrService.unsubscribe(subId);
    });
    subscriptionsRef.current = [];
    
    setIsLoading(true);
    
    try {
      // First make sure we're connected to relays
      nostrService.connectToUserRelays().then(() => {
        console.log("Fetching contacts for pubkey:", hexPubkey);
        
        // Fetch contact list according to NIP-02
        const contactsSubId = nostrService.subscribe(
          [
            {
              kinds: [3], // Contact Lists (NIP-02)
              authors: [hexPubkey],
              limit: 1
            }
          ],
          (event) => {
            try {
              console.log("Received contacts event:", event);
              // Extract pubkeys from p tags properly according to NIP-02
              const followingList = event.tags
                .filter(tag => tag.length >= 2 && tag[0] === 'p')
                .map(tag => tag[1]);
              
              console.log("Following list:", followingList.length, "contacts");
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
            const followerPubkey = event.pubkey;
            console.log("Found follower:", followerPubkey);
            setFollowers(prev => {
              if (prev.includes(followerPubkey)) return prev;
              return [...prev, followerPubkey];
            });
          }
        );
        
        subscriptionsRef.current.push(followersSubId);
        
        // Set a timeout to mark loading as complete even if we get no events
        setTimeout(() => setIsLoading(false), 5000);
      });
    } catch (error) {
      console.error("Error setting up profile relations subscriptions:", error);
      toast.error("Failed to load profile relations");
      setIsLoading(false);
    }
    
    return () => {
      subscriptionsRef.current.forEach(subId => {
        if (subId) nostrService.unsubscribe(subId);
      });
    };
  }, [hexPubkey, isCurrentUser]);

  return { followers, following, isLoading };
}
