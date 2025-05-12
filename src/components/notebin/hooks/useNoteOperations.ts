
import { useState } from "react";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { Note } from "./types";

export function useNoteOperations() {
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper function to check if a note exists (hasn't been deleted)
  const checkIfNoteExists = async (noteId: string): Promise<boolean> => {
    try {
      // Try to retrieve the event from the Nostr network
      const retrievedEvent = await nostrService.getEventById(noteId);
      
      // If the event is null, it's already deleted
      if (!retrievedEvent) {
        return false;
      }
      
      // Check for deletion events referencing this note
      const deletionEvents = await nostrService.getEvents({
        kinds: [5], // Deletion events
        "#e": [noteId]
      });
      
      // If there are deletion events for this note ID, it's already deleted
      return deletionEvents.length === 0;
    } catch (error) {
      console.error("Error checking note status:", error);
      // Assume it exists if we can't verify
      return true;
    }
  };

  // Delete note functionality
  const handleDelete = async () => {
    if (!noteToDelete) return;

    if (!nostrService.publicKey) {
      toast.error("You must be logged in to delete notes");
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // First check if the note has already been deleted
      const noteExists = await checkIfNoteExists(noteToDelete);
      
      if (!noteExists) {
        setIsDeleting(false);
        setNoteToDelete(null);
        toast.info("This note was already deleted. Refreshing data...");
        // Return true so the UI can be refreshed
        return true;
      }
      
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
