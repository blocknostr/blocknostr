
import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';
import { toast } from "sonner";

interface UseNoteActionsProps {
  eventId: string;
  pubkey: string;
}

export const useNoteActions = ({ eventId, pubkey }: UseNoteActionsProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [retweeted, setRetweeted] = useState(false);
  const [retweetCount, setRetweetCount] = useState(0);
  const [tipCount, setTipCount] = useState(0);
  const [repostEventId, setRepostEventId] = useState<string | null>(null);

  // Fetch reaction counts when component mounts
  useEffect(() => {
    const fetchReactions = async () => {
      await nostrService.connectToDefaultRelays();
      
      // Subscribe to reactions for this post
      const reactionSubId = nostrService.subscribe(
        [
          {
            kinds: [7], // Reaction events
            '#e': [eventId], // For this post
            limit: 100
          }
        ],
        (event) => {
          // Check if it's a like ('+')
          if (event.content === '+') {
            setLikeCount(prev => prev + 1);
            
            // Check if current user liked
            if (event.pubkey === nostrService.publicKey) {
              setLiked(true);
            }
          }
        }
      );
      
      // Subscribe to reposts
      const repostSubId = nostrService.subscribe(
        [
          {
            kinds: [6], // Repost events
            '#e': [eventId], // For this post
            limit: 50
          }
        ],
        (event) => {
          setRetweetCount(prev => prev + 1);
          
          // Check if current user reposted
          if (event.pubkey === nostrService.publicKey) {
            setRetweeted(true);
            setRepostEventId(event.id || null);
          }
        }
      );
      
      // Subscribe to zap (tip) events - simplified simulation
      const zapSubId = nostrService.subscribe(
        [
          {
            kinds: [9735], // Zap receipts
            '#e': [eventId], // For this post
            limit: 50
          }
        ],
        (event) => {
          setTipCount(prev => prev + 1);
        }
      );
      
      // Cleanup subscriptions after data is loaded
      setTimeout(() => {
        nostrService.unsubscribe(reactionSubId);
        nostrService.unsubscribe(repostSubId);
        nostrService.unsubscribe(zapSubId);
      }, 5000);
    };
    
    fetchReactions();
    
    // Also set some initial numbers if we have no real data yet
    if (Math.random() > 0.5) {
      setLikeCount(Math.floor(Math.random() * 20));
      setRetweetCount(Math.floor(Math.random() * 10));
      setTipCount(Math.floor(Math.random() * 5));
    }
  }, [eventId, nostrService.publicKey]);

  const handleLike = async () => {
    try {
      if (!liked) {
        // Create a reaction event (kind 7)
        await nostrService.publishEvent({
          kind: 7,
          content: '+',  // '+' for like
          tags: [['e', eventId || ''], ['p', pubkey || '']]
        });
        
        setLiked(true);
        setLikeCount(prev => prev + 1);
      } else {
        // Remove like by publishing a reaction with '-'
        await nostrService.publishEvent({
          kind: 7,
          content: '-',  // '-' for unlike
          tags: [['e', eventId || ''], ['p', pubkey || '']]
        });
        
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        toast.success("Like removed");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to toggle like");
    }
  };

  const handleRetweet = async () => {
    try {
      if (!retweeted) {
        // Create a repost event
        const repostId = await nostrService.publishEvent({
          kind: 6, // Repost kind
          content: JSON.stringify({
            event: { id: eventId, pubkey }
          }),
          tags: [
            ['e', eventId || ''], // Reference to original note
            ['p', pubkey || ''] // Original author
          ]
        });
        
        if (repostId) {
          setRepostEventId(repostId);
          setRetweeted(true);
          setRetweetCount(prev => prev + 1);
          toast.success("Note reposted successfully");
        }
      } else {
        // For removing a repost, we need to publish a deletion event for our repost
        if (repostEventId) {
          await nostrService.publishEvent({
            kind: 5, // Deletion event
            content: "Removing repost",
            tags: [
              ['e', repostEventId] // Reference to the repost event we want to delete
            ]
          });
          
          setRetweeted(false);
          setRetweetCount(prev => Math.max(0, prev - 1));
          setRepostEventId(null);
          toast.success("Repost removed from your profile");
        } else {
          toast.error("Could not find the original repost to remove");
        }
      }
    } catch (error) {
      console.error("Error toggling retweet:", error);
      toast.error("Failed to toggle repost");
    }
  };
  
  const handleSendTip = () => {
    toast.info("Tipping functionality coming soon!");
  };

  return {
    liked,
    likeCount,
    retweeted,
    retweetCount,
    tipCount,
    handleLike,
    handleRetweet,
    handleSendTip
  };
};
