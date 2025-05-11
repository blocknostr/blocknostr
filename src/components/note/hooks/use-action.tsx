
import React from "react";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";

export interface UseActionProps {
  eventId: string;
  authorPubkey: string;
  event: any; // Full event object
}

export function useAction({ eventId, authorPubkey, event }: UseActionProps) {
  const [isLiking, setIsLiking] = React.useState(false);
  const [isReposting, setIsReposting] = React.useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      await nostrService.socialManager.likeEvent(event);
      toast.success("Post liked");
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to like post");
    } finally {
      setIsLiking(false);
    }
  };

  const handleRepost = async () => {
    if (isReposting) return;
    
    setIsReposting(true);
    try {
      await nostrService.socialManager.repostEvent(event);
      toast.success("Post reposted");
    } catch (error) {
      console.error("Error reposting:", error);
      toast.error("Failed to repost");
    } finally {
      setIsReposting(false);
    }
  };

  return {
    handleLike,
    handleRepost,
    isLiking,
    isReposting
  };
}
