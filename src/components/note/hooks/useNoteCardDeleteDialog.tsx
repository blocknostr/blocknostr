
import { useState } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';
import { toast } from "sonner";

interface UseNoteCardDeleteDialogProps {
  event: NostrEvent;
  onDelete?: () => void;
}

export function useNoteCardDeleteDialog({ event, onDelete }: UseNoteCardDeleteDialogProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); 
    setIsDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      
      // First check if the event has already been deleted
      const eventExists = await checkIfEventExists(event.id || '');
      
      if (!eventExists) {
        setIsDeleteDialogOpen(false);
        setIsDeleting(false);
        toast.info("This post was already deleted. Refreshing data...");
        
        // Call parent's onDelete if provided to refresh the UI
        if (onDelete) {
          onDelete();
        }
        return;
      }
      
      // In Nostr, we don't actually delete posts but we can mark them as deleted
      await nostrService.publishEvent({
        kind: 5, // Deletion event
        content: "Post deleted by author",
        tags: [
          ['e', event.id || ''] // Reference to deleted event
        ]
      });
      
      setIsDeleteDialogOpen(false);
      setIsDeleting(false);
      toast.success("Post deleted successfully");
      
      // Call parent's onDelete if provided
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Helper function to check if an event exists (hasn't been deleted)
  const checkIfEventExists = async (eventId: string): Promise<boolean> => {
    try {
      // Try to retrieve the event from the Nostr network
      const retrievedEvent = await nostrService.getEventById(eventId);
      
      // If the event is null or we received a deletion event, it's already deleted
      if (!retrievedEvent) {
        return false;
      }
      
      // Check for deletion events referencing this event
      const deletionEvents = await nostrService.getEvents({
        kinds: [5], // Deletion events
        "#e": [eventId]
      });
      
      // If there are deletion events for this event ID, it's already deleted
      return deletionEvents.length === 0;
    } catch (error) {
      console.error("Error checking event status:", error);
      // Assume it exists if we can't verify
      return true;
    }
  };

  return {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeleting,
    handleDeleteClick,
    handleConfirmDelete
  };
}
