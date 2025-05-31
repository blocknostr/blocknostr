import { useState, useEffect, useRef } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { EVENT_KINDS } from "@/lib/nostr/constants";
import { toast } from "@/lib/toast";

export function useNoteReactions(eventId: string) {
  const [reactions, setReactions] = useState<NostrEvent[]>([]);
  const [isLiking, setIsLiking] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const subscriptionRef = useRef<string | null>(null);
  
  // Handle like action
  const toggleLike = async () => {
    if (!nostrService.publicKey) {
      toast.error("Please login to like posts");
      return;
    }
    
    setIsLiking(true);
    try {
      const success = await nostrService.reactToPost(eventId, "+");
      if (success) toast.success("Post liked!");
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to like post");
    } finally {
      setIsLiking(false);
    }
  };

  // Handle repost action
  const toggleRepost = async () => {
    if (!nostrService.publicKey) {
      toast.error("Please login to repost");
      return;
    }
    
    setIsReposting(true);
    try {
      const success = await nostrService.repostNote(eventId);
      if (success) toast.success("Post reposted!");
    } catch (error) {
      console.error("Error reposting:", error);
      toast.error("Failed to repost");
    } finally {
      setIsReposting(false);
    }
  };
  
  // Process reactions data
  const likes = reactions.filter(event => event.kind === EVENT_KINDS.REACTION);
  const reposts = reactions.filter(event => event.kind === EVENT_KINDS.REPOST);
  const currentPubkey = nostrService.publicKey;
  
  const likeCount = likes.length;
  const repostCount = reposts.length;
  const userHasLiked = currentPubkey ? likes.some(event => event.pubkey === currentPubkey) : false;
  const userHasReposted = currentPubkey ? reposts.some(event => event.pubkey === currentPubkey) : false;
  
  useEffect(() => {
    if (!eventId) return;

    const fetchReactions = async () => {
      try {
        const filters = [
          { kinds: [EVENT_KINDS.REACTION], "#e": [eventId], limit: 100 },
          { kinds: [EVENT_KINDS.REPOST], "#e": [eventId], limit: 100 }
        ];
        
        const subId = nostrService.subscribe(filters, (event) => {
          if (event) {
            setReactions(prev => {
              // Avoid duplicates
              if (prev.some(e => e.id === event.id)) return prev;
              return [...prev, event];
            });
          }
        });
        
        subscriptionRef.current = subId;
      } catch (error) {
        console.error("Error fetching note reactions:", error);
      }
    };

    fetchReactions();

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        nostrService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [eventId]);
  
  return {
    likeCount,
    repostCount,
    userHasLiked,
    userHasReposted,
    isLiking,
    isReposting,
    toggleLike,
    toggleRepost,
    // Legacy compatibility
    handleLike: toggleLike,
    handleRepost: toggleRepost
  };
}

