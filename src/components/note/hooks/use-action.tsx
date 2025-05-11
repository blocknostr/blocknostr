
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { nostrService } from '@/lib/nostr';
import { Note } from '@/components/notebin/hooks/types';

export function useAction(note: Note, setIsActionLoading: (action: "reply" | "like" | "repost" | "bookmark" | null) => void) {
  const isLoggedIn = !!nostrService.publicKey;
  
  // Handle like action
  const handleLike = useCallback(async () => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to like posts");
      return;
    }
    
    setIsActionLoading("like");
    
    try {
      // Connect to relays
      await nostrService.connectToUserRelays();
      
      // Send like event
      const success = await nostrService.socialManager.likeEvent(note.event);
      
      if (success) {
        toast.success("Post liked");
      } else {
        toast.error("Failed to like post");
      }
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to like post");
    } finally {
      setIsActionLoading(null);
    }
  }, [note, isLoggedIn, setIsActionLoading]);
  
  // Handle repost action
  const handleRepost = useCallback(async () => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to repost");
      return;
    }
    
    setIsActionLoading("repost");
    
    try {
      // Connect to relays
      await nostrService.connectToUserRelays();
      
      // Send repost event
      const success = await nostrService.socialManager.repostEvent(note.event);
      
      if (success) {
        toast.success("Post reposted");
      } else {
        toast.error("Failed to repost");
      }
    } catch (error) {
      console.error("Error reposting:", error);
      toast.error("Failed to repost");
    } finally {
      setIsActionLoading(null);
    }
  }, [note, isLoggedIn, setIsActionLoading]);

  return {
    handleLike,
    handleRepost
  };
}
