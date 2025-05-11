
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuickReplies from './post/QuickReplies';
import NoteComposer from './post/NoteComposer';
import FormattingToolbar from './post/FormattingToolbar';
import MediaPreviewList from './post/MediaPreviewList';
import CharacterCounter from './post/CharacterCounter';
import SubmitButton from './post/SubmitButton';
import ScheduledIndicator from './post/ScheduledIndicator';
import { cn } from "@/lib/utils";

const CreateNoteForm = () => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<string>("compose");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const pubkey = nostrService.publicKey;
  
  // Max note length (for UI only, actual limit depends on relays)
  const MAX_NOTE_LENGTH = 280;
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
      
      // Extract and add hashtags from content
      const hashtagRegex = /#(\w+)/g;
      let match;
      while ((match = hashtagRegex.exec(content)) !== null) {
        tags.push(['t', match[1]]);
      }
      
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
  
  const handleMediaAdded = (url: string) => {
    setMediaUrls(prev => [...prev, url]);
  };
  
  const removeMedia = (urlToRemove: string) => {
    setMediaUrls(prev => prev.filter(url => url !== urlToRemove));
  };
  
  const handleQuickReply = (text: string) => {
    setContent(prev => prev + (prev ? ' ' : '') + text);
  };
  
  if (!pubkey) {
    return null;
  }
  
  // Get first character of pubkey for avatar fallback
  const avatarFallback = pubkey ? pubkey.substring(0, 2).toUpperCase() : 'N';
  
  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex gap-3 px-2">
        <Avatar className="h-10 w-10 mt-1">
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          {/* Minimalist tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-2 w-full bg-transparent border-b p-0 h-auto">
              <TabsTrigger 
                value="compose" 
                className="flex-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-1 text-sm"
              >
                Compose
              </TabsTrigger>
              <TabsTrigger 
                value="templates" 
                className="flex-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-1 text-sm"
              >
                Quick Replies
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="compose" className="mt-3">
              <NoteComposer 
                content={content}
                setContent={setContent}
                maxLength={MAX_NOTE_LENGTH}
                textareaRef={textareaRef}
              />
            </TabsContent>
            
            <TabsContent value="templates" className="mt-3">
              <QuickReplies onReplySelected={handleQuickReply} />
            </TabsContent>
          </Tabs>
          
          {/* Media preview */}
          <MediaPreviewList mediaUrls={mediaUrls} removeMedia={removeMedia} />
          
          <div className="flex justify-between items-center mt-4 border-t pt-3">
            {/* Formatting toolbar */}
            <FormattingToolbar 
              textareaRef={textareaRef}
              content={content}
              setContent={setContent}
              onMediaAdded={handleMediaAdded}
              scheduledDate={scheduledDate}
              setScheduledDate={setScheduledDate}
            />
            
            <div className="flex items-center gap-2">
              {/* Character counter */}
              <CharacterCounter 
                charsLeft={charsLeft} 
                isNearLimit={isNearLimit} 
                isOverLimit={isOverLimit} 
              />
              
              {/* Submit button */}
              <SubmitButton 
                isSubmitting={isSubmitting}
                disabled={content.length === 0 || isOverLimit}
                scheduledDate={scheduledDate}
              />
            </div>
          </div>
          
          {/* Scheduled post indicator */}
          <ScheduledIndicator scheduledDate={scheduledDate} />
        </div>
      </div>
    </form>
  );
};

export default CreateNoteForm;
