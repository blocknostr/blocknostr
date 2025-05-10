
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, Smile, Calendar, MapPin } from "lucide-react";

const CreateNoteForm = () => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pubkey = nostrService.publicKey;
  
  // Max note length (for UI only, actual limit depends on relays)
  const MAX_NOTE_LENGTH = 280;
  const charsLeft = MAX_NOTE_LENGTH - content.length;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        toast.success("Post published!");
        setContent("");
      }
    } catch (error) {
      console.error("Failed to publish note:", error);
      toast.error("Failed to publish post");
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
    <div className="border-b px-4 py-3">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            className="resize-none border-none h-24 focus-visible:ring-0 text-xl p-0"
            maxLength={MAX_NOTE_LENGTH}
          />
          <div className="flex justify-between items-center mt-2 pt-2 border-t">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-primary rounded-full h-8 w-8">
                <Image className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-primary rounded-full h-8 w-8">
                <Smile className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-primary rounded-full h-8 w-8">
                <Calendar className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-primary rounded-full h-8 w-8">
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-3">
              {charsLeft <= 20 && (
                <div className={`text-sm ${charsLeft < 20 ? 'text-amber-500' : charsLeft < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {charsLeft}
                </div>
              )}
              <Button 
                type="submit" 
                onClick={handleSubmit}
                disabled={isSubmitting || content.length === 0 || content.length > MAX_NOTE_LENGTH}
                className="rounded-full bg-primary hover:bg-primary/90"
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNoteForm;
