
import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';

interface UseProfileRelationsProps {
  hexPubkey: string | undefined;
  isCurrentUser: boolean;
}

export function useProfileRelations({ hexPubkey, isCurrentUser }: UseProfileRelationsProps) {
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  
  useEffect(() => {
    if (!hexPubkey) return;
    
    const cleanupFunctions: (() => void)[] = [];
    
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
          // Extract pubkeys from p tags properly according to NIP-02
          const followingList = event.tags
            .filter(tag => tag.length >= 2 && tag[0] === 'p')
            .map(tag => tag[1]);
          
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
    
    cleanupFunctions.push(() => nostrService.unsubscribe(contactsSubId));

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
        setFollowers(prev => {
          if (prev.includes(followerPubkey)) return prev;
          return [...prev, followerPubkey];
        });
      }
    );
    
    cleanupFunctions.push(() => nostrService.unsubscribe(followersSubId));
    
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [hexPubkey, isCurrentUser]);

  return { followers, following };
}
