import { useState } from "react";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { Note } from "./types";

export function useNoteOperations() {
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete note functionality
  const handleDelete = async () => {
    if (!noteToDelete) return;

    if (!nostrService.publicKey) {
      toast.error("You must be logged in to delete notes");
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Create a deletion event (NIP-09)
      const deletionEvent = {
        kind: 5, // Event deletion
        content: "Deleted notebin",
        tags: [
          ["e", noteToDelete] // Reference to the event being deleted
        ]
      };
      
      const deletionEventId = await nostrService.publishEvent(deletionEvent);
      
      if (deletionEventId) {
        toast.success("Note deleted successfully!");
        return true;
      } else {
        throw new Error("Failed to delete note");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note. Please try again.");
      return false;
    } finally {
      setIsDeleting(false);
      setNoteToDelete(null);
    }
  };

  // Helper to check if user is allowed to delete a note
  const canDeleteNote = (note: Note): boolean => {
    if (!nostrService.publicKey) return false;
    return note.author === nostrService.publicKey;
  };

  return {
    noteToDelete,
    setNoteToDelete,
    isDeleting,
    handleDelete,
    canDeleteNote,
    isLoggedIn: !!nostrService.publicKey
  };
}
