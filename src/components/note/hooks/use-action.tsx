
import React from "react";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { Note } from '@/components/notebin/hooks/types';

export interface UseActionProps {
  eventId: string;
  authorPubkey: string;
  event: any; // Full event object
}

export function useAction(note: Note | UseActionProps) {
  const [isLiking, setIsLiking] = React.useState(false);
  const [isReposting, setIsReposting] = React.useState(false);

  // Extract properties based on the input type
  const eventId = 'eventId' in note ? note.eventId : note.id;
  const authorPubkey = 'authorPubkey' in note ? note.authorPubkey : note.pubkey;
  const event = 'event' in note ? note.event : note;

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
