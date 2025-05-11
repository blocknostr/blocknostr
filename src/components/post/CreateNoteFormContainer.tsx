
import { useState, useRef } from 'react';
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
import SmartComposeToolbar from './post/SmartComposeToolbar';
import { useHashtagDetector } from '@/hooks/useHashtagDetector';
import { cn } from "@/lib/utils";
import { useNoteFormState } from '@/hooks/useNoteFormState';
import NoteFormHeader from './post/NoteFormHeader';
import NoteFormFooter from './post/NoteFormFooter';

const CreateNoteFormContainer = () => {
  const {
    content,
    setContent,
    isSubmitting,
    setIsSubmitting,
    mediaUrls,
    setMediaUrls,
    scheduledDate,
    setScheduledDate,
    activeTab,
    setActiveTab,
    MAX_NOTE_LENGTH,
    charsLeft,
    isNearLimit,
    isOverLimit,
    textareaRef,
    pubkey,
    detectedHashtags
  } = useNoteFormState();
  
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
      
      // Add all detected hashtags (now using our detector)
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
  
  const handleMediaAdded = (url: string) => {
    setMediaUrls(prev => [...prev, url]);
  };
  
  const removeMedia = (urlToRemove: string) => {
    setMediaUrls(prev => prev.filter(url => url !== urlToRemove));
  };
  
  const handleQuickReply = (text: string) => {
    setContent(prev => prev + (prev ? ' ' : '') + text);
  };
  
  const handleHashtagClick = (tag: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    
    setContent(
      content.substring(0, start) + 
      ` #${tag} ` + 
      content.substring(start)
    );
    
    // Set cursor position after the added tag
    const newPosition = start + tag.length + 3; // +3 for space, # and trailing space
    
    // Need to wait for React to update the textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
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
          <NoteFormHeader 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="compose" className="mt-3">
              <NoteComposer 
                content={content}
                setContent={setContent}
                maxLength={MAX_NOTE_LENGTH}
                textareaRef={textareaRef}
              />
              
              <SmartComposeToolbar 
                onHashtagClick={handleHashtagClick}
                onQuickReplyClick={handleQuickReply}
              />
              
              {detectedHashtags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {detectedHashtags.map(tag => (
                    <span key={tag} className="text-xs text-primary px-1.5 py-0.5 rounded-full bg-primary/10">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="templates" className="mt-3">
              <QuickReplies onReplySelected={handleQuickReply} />
            </TabsContent>
          </Tabs>
          
          <MediaPreviewList mediaUrls={mediaUrls} removeMedia={removeMedia} />
          
          <NoteFormFooter
            textareaRef={textareaRef}
            content={content}
            setContent={setContent}
            onMediaAdded={handleMediaAdded}
            scheduledDate={scheduledDate}
            setScheduledDate={setScheduledDate}
            charsLeft={charsLeft}
            isNearLimit={isNearLimit}
            isOverLimit={isOverLimit}
            isSubmitting={isSubmitting}
          />
          
          <ScheduledIndicator scheduledDate={scheduledDate} />
        </div>
      </div>
    </form>
  );
};

export default CreateNoteFormContainer;
