
import { toast } from "sonner";

interface UseNoteSharingProps {
  noteId: string | null;
  isEncrypted: boolean;
}

export function useNoteSharing({ noteId, isEncrypted }: UseNoteSharingProps) {
  const shareNote = () => {
    if (!noteId) {
      toast.error("You need to save the note first before sharing");
      return;
    }
    
    if (isEncrypted) {
      toast.warning("Warning: Sharing an encrypted note link. Only you can decrypt and view this note.");
    }
    
    const shareUrl = `${window.location.origin}/notebin?note=${noteId}`;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast.success("Share link copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy share link");
      });
  };
  
  return {
    shareNote
  };
}
