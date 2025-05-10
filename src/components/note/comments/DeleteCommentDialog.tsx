
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
import { useState } from "react";
import { toast } from "sonner";
import { nostrService } from '@/lib/nostr';

interface DeleteCommentDialogProps {
  commentId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteSuccess: (commentId: string) => void;
}

const DeleteCommentDialog = ({ 
  commentId, 
  isOpen, 
  onOpenChange,
  onDeleteSuccess
}: DeleteCommentDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleConfirmDelete = async () => {
    if (!commentId) return;
    
    try {
      setIsDeleting(true);
      
      // In Nostr, we don't actually delete comments but we can mark them as deleted
      await nostrService.publishEvent({
        kind: 5, // Deletion event
        content: "Reply deleted by author",
        tags: [
          ['e', commentId] // Reference to deleted event
        ]
      });
      
      onDeleteSuccess(commentId);
      setIsDeleting(false);
      onOpenChange(false);
      toast.success("Reply deleted successfully");
    } catch (error) {
      console.error("Error deleting reply:", error);
      toast.error("Failed to delete reply");
      setIsDeleting(false);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete reply</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your reply from the network.
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

export default DeleteCommentDialog;
