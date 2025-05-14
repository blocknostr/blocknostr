
import { useState } from 'react';
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";

interface NoteContent {
  content: string;
  tags: string[][];
}

export const useNoteSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const submitNote = async (note: NoteContent, scheduledDate: Date | null): Promise<boolean> => {
    setIsSubmitting(true);
    
    try {
      // If scheduled, add a scheduledAt tag
      if (scheduledDate && scheduledDate > new Date()) {
        note.tags.push(['scheduledAt', Math.floor(scheduledDate.getTime() / 1000).toString()]);
      }
      
      const eventId = await nostrService.publishEvent({
        kind: 1, // text_note
        content: note.content,
        tags: note.tags,
        // If scheduled, use the future timestamp
        created_at: scheduledDate && scheduledDate > new Date() 
          ? Math.floor(scheduledDate.getTime() / 1000)
          : undefined
      });
      
      if (eventId) {
        return true;
      } else {
        throw new Error("Failed to get event ID");
      }
    } catch (error) {
      console.error("Failed to publish note:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
    
    return false;
  };
  
  return {
    isSubmitting,
    submitNote
  };
};
