
import { useState } from 'react';
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";

export const useNoteSubmission = (
  content: string,
  setContent: (content: string) => void,
  mediaUrls: string[],
  setMediaUrls: (urls: string[]) => void,
  scheduledDate: Date | null,
  setScheduledDate: (date: Date | null) => void,
  detectedHashtags: string[],
  pubkey: string | null,
  MAX_NOTE_LENGTH: number
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const charsLeft = MAX_NOTE_LENGTH - content.length;
  const isNearLimit = charsLeft < 50;
  const isOverLimit = charsLeft < 0;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && mediaUrls.length === 0) {
      toast.error("Please add some content or media to your post");
      return;
    }
    
    if (!pubkey) {
      toast.error("Please sign in to post");
      return;
    }
    
    if (isOverLimit) {
      toast.error(`Your post is too long by ${Math.abs(charsLeft)} characters`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare tags for the post
      const tags: string[][] = [];
      
      // Add media tags if there are any
      mediaUrls.forEach(url => {
        tags.push(['r', url]);
      });
      
      // Add all detected hashtags
      detectedHashtags.forEach(hashtag => {
        tags.push(['t', hashtag]);
      });
      
      // If scheduled, add a p tag with the timestamp
      if (scheduledDate && scheduledDate > new Date()) {
        // NIP-16 Scheduled Events
        // Clients should not display the event until the timestamp
        tags.push(['scheduledAt', Math.floor(scheduledDate.getTime() / 1000).toString()]);
      }
      
      const eventId = await nostrService.publishEvent({
        kind: 1, // text_note
        content: content,
        tags: tags,
        // If scheduled, use the future timestamp
        created_at: scheduledDate && scheduledDate > new Date() 
          ? Math.floor(scheduledDate.getTime() / 1000)
          : undefined
      });
      
      if (eventId) {
        if (scheduledDate && scheduledDate > new Date()) {
          toast.success("Note scheduled for publication");
        } else {
          toast.success("Note published");
        }
        setContent("");
        setMediaUrls([]);
        setScheduledDate(null);
      }
    } catch (error) {
      console.error("Failed to publish note:", error);
      toast.error("Failed to publish note");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return {
    isSubmitting,
    setIsSubmitting,
    charsLeft,
    isNearLimit,
    isOverLimit,
    handleSubmit
  };
};
