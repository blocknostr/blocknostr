
import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';
import { toast } from 'sonner';

interface UseNoteReactionsProps {
  eventId: string;
  pubkey: string;
}

export function useNoteReactions({ eventId, pubkey }: UseNoteReactionsProps) {
  const [likeCount, setLikeCount] = useState(0);
  const [repostCount, setRepostCount] = useState(0);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [userHasReposted, setUserHasReposted] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isReposting, setIsReposting] = useState(false);

  // Fetch reaction counts when component mounts
  useEffect(() => {
    if (!eventId) return;

    const fetchReactionCounts = async () => {
      try {
        // Connect to relays if necessary
        await nostrService.connectToUserRelays();

        // Default relays if user relays not available
        const defaultRelays = ["wss://relay.damus.io", "wss://nos.lol"];
        
        // Get the SimplePool instance from the nostrService
        const pool = nostrService.pool;
        const relays = nostrService.getRelayUrls?.() || defaultRelays;

        if (pool && nostrService.socialManager) {
          try {
            // Use the getReactionCounts method if available from socialManager
            const reactions = await nostrService.socialManager.getReactionCounts(
              pool,
              eventId,
              relays
            );
            
            setLikeCount(reactions.likes);
            setRepostCount(reactions.reposts);
            setUserHasLiked(reactions.userHasLiked);
            setUserHasReposted(reactions.userHasReposted);
          } catch (error) {
            console.error('Error fetching reaction counts from socialManager:', error);
          }
        } else {
          console.log('Using fallback for reaction counts');
          // Fallback to direct subscription if socialManager unavailable
          let likes = 0;
          let reposts = 0;
          let userLiked = false;
          let userReposted = false;

          const currentPubkey = nostrService.publicKey;
          
          // Fetch like reactions (kind 7)
          if (nostrService.subscribe) {
            const likesSub = nostrService.subscribe(
              [{ kinds: [7], "#e": [eventId] }],
              (event) => {
                if (event && event.content === '+') {
                  likes++;
                  if (currentPubkey && event.pubkey === currentPubkey) {
                    userLiked = true;
                  }
                }
              },
              defaultRelays
            );

            // Fetch reposts (kind 6)
            const repostsSub = nostrService.subscribe(
              [{ kinds: [6], "#e": [eventId] }],
              (event) => {
                if (event) {
                  reposts++;
                  if (currentPubkey && event.pubkey === currentPubkey) {
                    userReposted = true;
                  }
                }
              },
              defaultRelays
            );

            // Set timeout to finalize counts after 2s
            setTimeout(() => {
              setLikeCount(likes);
              setRepostCount(reposts);
              setUserHasLiked(userLiked);
              setUserHasReposted(userReposted);
              
              if (nostrService.unsubscribe) {
                nostrService.unsubscribe(likesSub);
                nostrService.unsubscribe(repostsSub);
              }
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Error fetching reaction counts:', error);
      }
    };

    fetchReactionCounts();
  }, [eventId]);

  // Handle like action - NIP-25 compliant
  const handleLike = async () => {
    if (!nostrService.publicKey) {
      toast.error('Please sign in to like posts');
      return;
    }

    if (userHasLiked) {
      toast.info('You already liked this post');
      return;
    }
    
    setIsLiking(true);
    
    try {
      let success = false;
      
      // Try using socialManager first
      if (nostrService.socialAdapter?.socialManager) {
        const emoji = '+'; // Standard NIP-25 positive reaction
        const pubkey = nostrService.publicKey;
        const privateKey = nostrService.privateKey;
        const relayUrls = nostrService.getRelayUrls?.() || ["wss://relay.damus.io", "wss://nos.lol"];
        
        // Use the socialAdapter to react to the event
        const result = await nostrService.socialAdapter.socialManager.reactToEvent(
          nostrService.pool,
          eventId,
          emoji,
          pubkey,
          privateKey,
          relayUrls
        );
        
        success = !!result;
      } 
      // Fallback to legacy method
      else if (nostrService.reactToPost) {
        await nostrService.reactToPost(eventId, '+');
        success = true;
      } 
      else {
        throw new Error('No method available to react to posts');
      }
      
      if (success) {
        setUserHasLiked(true);
        setLikeCount(prev => prev + 1);
        toast.success('Post liked!');
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };

  // Handle repost action - NIP-18 compliant
  const handleRepost = async () => {
    if (!nostrService.publicKey) {
      toast.error('Please sign in to repost');
      return;
    }

    if (userHasReposted) {
      toast.info('You already reposted this note');
      return;
    }
    
    setIsReposting(true);
    
    try {
      let success = false;
      
      // Try using socialManager first
      if (nostrService.socialAdapter?.socialManager) {
        const currentPubkey = nostrService.publicKey;
        const privateKey = nostrService.privateKey;
        const relayUrls = nostrService.getRelayUrls?.() || ["wss://relay.damus.io", "wss://nos.lol"];
        
        // Use the socialAdapter to repost the event
        const result = await nostrService.socialAdapter.socialManager.repostEvent(
          nostrService.pool,
          eventId,
          pubkey,
          null, // relay hint
          currentPubkey,
          privateKey,
          relayUrls
        );
        
        success = !!result;
      } 
      // Fallback to legacy method
      else if (nostrService.repostNote) {
        await nostrService.repostNote(eventId, pubkey);
        success = true;
      } 
      else {
        throw new Error('No method available to repost notes');
      }
      
      if (success) {
        setUserHasReposted(true);
        setRepostCount(prev => prev + 1);
        toast.success('Post reposted!');
      }
    } catch (error) {
      console.error('Error reposting:', error);
      toast.error('Failed to repost');
    } finally {
      setIsReposting(false);
    }
  };

  return {
    likeCount,
    repostCount,
    userHasLiked,
    userHasReposted,
    handleLike,
    handleRepost,
    isLiking,
    isReposting
  };
}
