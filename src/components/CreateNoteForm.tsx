
import { useState } from 'react';
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import EnhancedPostEditor from './post/EnhancedPostEditor';

const CreateNoteForm = () => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pubkey = nostrService.publicKey;
  
  // Max note length (for UI only, actual limit depends on relays)
  const MAX_NOTE_LENGTH = 280;
  
  const handleSubmit = async () => {
    if (!content.trim()) {
      return;
    }
    
    if (!pubkey) {
      toast.error("Please sign in to post");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const eventId = await nostrService.publishEvent({
        kind: 1, // text_note
        content: content,
        tags: []
      });
      
      if (eventId) {
        toast.success("Note published!");
        setContent("");
      }
    } catch (error) {
      console.error("Failed to publish note:", error);
      toast.error("Failed to publish note");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!pubkey) {
    return null;
  }
  
  // Get first character of pubkey for avatar fallback
  const avatarFallback = pubkey ? pubkey.substring(0, 2).toUpperCase() : 'N';
  
  return (
    <div className="border-b pb-4 mb-4">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <EnhancedPostEditor
            content={content}
            setContent={setContent}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            maxCharLength={MAX_NOTE_LENGTH}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateNoteForm;
