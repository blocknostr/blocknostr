
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { nostrService } from '@/lib/nostr';

// A simplified hook for note card interactions (like, repost, etc)
interface UseInteractionParams {
  eventId: string;
  authorPubkey: string;
}

interface UseInteractionReturn {
  handleLike: () => Promise<boolean>;
  handleRepost: () => Promise<boolean>;
  handleShare: (content: string) => Promise<boolean>;
  handleReply: (content: string) => Promise<boolean>;
  isProcessing: boolean;
}

export function useInteraction({ eventId, authorPubkey }: UseInteractionParams): UseInteractionReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Simplified like function
  const handleLike = useCallback(async () => {
    if (!nostrService.publicKey) {
      toast.error("You need to be logged in to like posts");
      return false;
    }
    
    setIsProcessing(true);
    try {
      const reactionEvent = {
        kind: 7,
        content: "+",
        tags: [
          ["e", eventId],
          ["p", authorPubkey]
        ]
      };
      
      const result = await nostrService.publishEvent(reactionEvent);
      if (result) {
        toast.success("Post liked!");
        return true;
      } 
      return false;
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to like post");
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [eventId, authorPubkey]);
  
  // Simplified repost function
  const handleRepost = useCallback(async () => {
    if (!nostrService.publicKey) {
      toast.error("You need to be logged in to repost");
      return false;
    }
    
    setIsProcessing(true);
    try {
      const repostEvent = {
        kind: 6,
        content: "",
        tags: [
          ["e", eventId, "", "root"],
          ["p", authorPubkey]
        ]
      };
      
      const result = await nostrService.publishEvent(repostEvent);
      if (result) {
        toast.success("Post reposted!");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error reposting:", error);
      toast.error("Failed to repost");
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [eventId, authorPubkey]);
  
  // Simplified share function
  const handleShare = useCallback(async (content: string) => {
    const shareUrl = `${window.location.origin}/post/${eventId}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Shared post',
          text: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          url: shareUrl
        });
        return true;
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
        return true;
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share post");
      return false;
    }
  }, [eventId]);
  
  // Simplified reply function
  const handleReply = useCallback(async (content: string) => {
    if (!nostrService.publicKey || !content.trim()) {
      toast.error("You need to be logged in and write a reply");
      return false;
    }
    
    setIsProcessing(true);
    try {
      const replyEvent = {
        kind: 1,
        content: content,
        tags: [
          ["e", eventId, "", "reply"],
          ["p", authorPubkey]
        ]
      };
      
      const result = await nostrService.publishEvent(replyEvent);
      if (result) {
        toast.success("Reply posted!");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error posting reply:", error);
      toast.error("Failed to post reply");
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [eventId, authorPubkey]);
  
  return {
    handleLike,
    handleRepost,
    handleShare,
    handleReply,
    isProcessing
  };
}
