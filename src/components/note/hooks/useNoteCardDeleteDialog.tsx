
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

  return {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeleting,
    handleDeleteClick,
    handleConfirmDelete
  };
}
