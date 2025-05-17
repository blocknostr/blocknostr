
import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';
import { toast } from 'sonner';
import { getReactionCounts } from '@/lib/nostr/social/interactions';

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
        await nostrService.connectToUserRelays?.();

        // Default relays if user relays not available
        const defaultRelays = ["wss://relay.damus.io", "wss://nos.lol"];
        
        // Use the direct subscription method for consistency
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
      // Create a NIP-25 compliant reaction event (kind 7)
      const event = {
        kind: 7, // Reaction event type
        content: '+', // Standard NIP-25 positive reaction
        tags: [
          ['e', eventId], // Reference to the original event
          ['p', pubkey]  // Reference to the author's pubkey
        ]
      };

      // Publish the event using the low-level API
      const success = await nostrService.publishEvent(event);
      
      if (success) {
        setUserHasLiked(true);
        setLikeCount(prev => prev + 1);
        toast.success('Post liked!');
      } else {
        throw new Error('Failed to publish like event');
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
      // Create a NIP-18 compliant repost event (kind 6)
      const event = {
        kind: 6, // Repost event type
        content: JSON.stringify({
          event_id: eventId,
          relay: "wss://relay.damus.io", // Fallback relay hint
          pubkey: pubkey
        }),
        tags: [
          ['e', eventId], // Reference to the original event
          ['p', pubkey]  // Reference to the author's pubkey
        ]
      };

      // Publish the event using the low-level API
      const success = await nostrService.publishEvent(event);
      
      if (success) {
        setUserHasReposted(true);
        setRepostCount(prev => prev + 1);
        toast.success('Post reposted!');
      } else {
        throw new Error('Failed to publish repost event');
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
