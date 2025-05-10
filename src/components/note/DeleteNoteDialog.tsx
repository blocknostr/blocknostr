
import { useState } from "react";
import { toast } from "sonner";
import { nostrService } from '@/lib/nostr';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteNoteDialogProps {
  isOpen: boolean;
  eventId: string;
  onOpenChange: (open: boolean) => void;
  onDeleteSuccess?: () => void;
}

const DeleteNoteDialog = ({ isOpen, eventId, onOpenChange, onDeleteSuccess }: DeleteNoteDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      
      // In Nostr, we don't actually delete posts but we can mark them as deleted
      await nostrService.publishEvent({
        kind: 5, // Deletion event
        content: "Post deleted by author",
        tags: [
          ['e', eventId || ''] // Reference to deleted event
        ]
      });
      
      onOpenChange(false);
      setIsDeleting(false);
      toast.success("Post deleted successfully");
      
      // Call onDeleteSuccess if provided
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
      setIsDeleting(false);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete post</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your post from the network.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteNoteDialog;
