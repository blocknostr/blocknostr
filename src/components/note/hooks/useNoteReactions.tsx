
import { useState, useEffect, useCallback } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { EVENT_KINDS } from "@/lib/nostr/constants";
import { toast } from "sonner";

export function useNoteReactions(eventId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [reactions, setReactions] = useState<NostrEvent[]>([]);
  const [isLiking, setIsLiking] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  
  const fetchReactions = useCallback(async () => {
    if (!eventId) return;
    
    setIsLoading(true);
    
    try {
      // Create filters for reactions and reposts
      const filters = [
        { kinds: [EVENT_KINDS.REACTION], "#e": [eventId], limit: 100 },
        { kinds: [EVENT_KINDS.REPOST], "#e": [eventId], limit: 100 }
      ];
      
      // Subscribe to reactions
      const subId = nostrService.subscribe(
        filters,
        (event) => {
          if (event) {
            setReactions(prev => {
              // Avoid duplicates
              if (prev.some(e => e.id === event.id)) {
                return prev;
              }
              
              return [...prev, event];
            });
          }
        }
      );
      
      if (subId) {
        setSubscriptionId(subId);
      }
    } catch (error) {
      console.error("Error fetching note reactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // Handle like action
  const handleLike = async () => {
    if (!nostrService.publicKey) {
      toast.error("Please login to like posts");
      return;
    }
    
    setIsLiking(true);
    try {
      const success = await nostrService.reactToPost(eventId, "+");
      if (success) {
        toast.success("Post liked!");
      }
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to like post");
    } finally {
      setIsLiking(false);
    }
  };

  // Handle repost action
  const handleRepost = async () => {
    if (!nostrService.publicKey) {
      toast.error("Please login to repost");
      return;
    }
    
    setIsReposting(true);
    try {
      const success = await nostrService.repostNote(eventId);
      if (success) {
        toast.success("Post reposted!");
      }
    } catch (error) {
      console.error("Error reposting:", error);
      toast.error("Failed to repost");
    } finally {
      setIsReposting(false);
    }
  };
  
  // Process reactions data
  const [likesCount, setLikesCount] = useState(0);
  const [repostsCount, setRepostsCount] = useState(0);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [userHasReposted, setUserHasReposted] = useState(false);
  
  useEffect(() => {
    const likes = reactions.filter(event => event.kind === EVENT_KINDS.REACTION);
    const reposts = reactions.filter(event => event.kind === EVENT_KINDS.REPOST);
    
    setLikesCount(likes.length);
    setRepostsCount(reposts.length);
    
    // Check if current user has liked or reposted
    const currentPubkey = nostrService.publicKey;
    if (currentPubkey) {
      setUserHasLiked(likes.some(event => event.pubkey === currentPubkey));
      setUserHasReposted(reposts.some(event => event.pubkey === currentPubkey));
    }
  }, [reactions]);
  
  // Clean up subscription
  useEffect(() => {
    return () => {
      if (subscriptionId) {
        nostrService.unsubscribe(subscriptionId);
      }
    };
  }, [subscriptionId]);
  
  // Initial fetch
  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);
  
  return {
    reactions,
    likesCount,
    repostsCount,
    userHasLiked,
    userHasReposted,
    isLoading,
    fetchReactions,
    handleLike,
    handleRepost,
    isLiking,
    isReposting,
    // For compatibility with existing code
    likeCount: likesCount,
    repostCount: repostsCount
  };
}
