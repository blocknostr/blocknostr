
import { useState } from "react";
import { toast } from "sonner";
import { adaptedNostrService as nostrService } from "@/lib/nostr/nostr-adapter";
import { NostrEvent } from "@/lib/nostr/types";

export interface UseActionProps {
  eventId: string;
  authorPubkey: string;
  event: NostrEvent;
}

export function useAction({ eventId, authorPubkey, event }: UseActionProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  
  // Handle liking a post
  const handleLike = async () => {
    if (!nostrService.publicKey) {
      toast.error("You need to login to like posts");
      return;
    }
    
    try {
      setIsLiking(true);
      
      // Using reactToPost instead of socialManager directly
      const result = await nostrService.reactToPost(eventId, "+");
      
      if (result) {
        toast.success("Post liked successfully");
      } else {
        toast.error("Failed to like post");
      }
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Error liking post");
    } finally {
      setIsLiking(false);
    }
  };
  
  // Handle reposting
  const handleRepost = async () => {
    if (!nostrService.publicKey) {
      toast.error("You need to login to repost");
      return;
    }
    
    try {
      setIsReposting(true);
      
      // Using repostNote instead of socialManager directly
      const result = await nostrService.repostNote(eventId, authorPubkey);
      
      if (result) {
        toast.success("Post reposted successfully");
      } else {
        toast.error("Failed to repost");
      }
    } catch (error) {
      console.error("Error reposting:", error);
      toast.error("Error reposting");
    } finally {
      setIsReposting(false);
    }
  };
  
  // Handle bookmarking
  const handleBookmark = async () => {
    // Check if user is logged in
    if (!nostrService.publicKey) {
      toast.error("You need to login to bookmark posts");
      return;
    }
    
    try {
      // Check if already bookmarked
      const isBookmarked = await nostrService.isBookmarked?.(eventId);
      
      if (isBookmarked) {
        // Remove bookmark if already bookmarked
        const removed = await nostrService.removeBookmark?.(eventId);
        if (removed) {
          toast.success("Bookmark removed");
        } else {
          toast.error("Failed to remove bookmark");
        }
      } else {
        // Add bookmark
        const added = await nostrService.addBookmark?.(eventId);
        if (added) {
          toast.success("Post bookmarked");
        } else {
          toast.error("Failed to bookmark post");
        }
      }
    } catch (error) {
      console.error("Error handling bookmark:", error);
      toast.error("Error handling bookmark");
    }
  };
  
  return {
    handleLike,
    isLiking,
    handleRepost,
    isReposting,
    handleBookmark
  };
}

export default useAction;
