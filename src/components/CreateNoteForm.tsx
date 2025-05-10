
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bold, Italic, Smile, Calendar, Image } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker from './post/EmojiPicker';
import MediaUpload from './post/MediaUpload';
import { formatDistanceToNow } from 'date-fns';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

const CreateNoteForm = () => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const pubkey = nostrService.publicKey;
  
  // Max note length (for UI only, actual limit depends on relays)
  const MAX_NOTE_LENGTH = 280;
  const charsLeft = MAX_NOTE_LENGTH - content.length;
  
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
    
    setIsSubmitting(true);
    
    try {
      // Prepare tags for the post
      const tags: string[][] = [];
      
      // Add media tags if there are any
      mediaUrls.forEach(url => {
        tags.push(['r', url]);
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
          toast.success("Note scheduled for publication!");
        } else {
          toast.success("Note published!");
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
  
  const insertFormatting = (format: 'bold' | 'italic') => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let newContent = content;
    let newCursorPos = end;
    
    if (selectedText) {
      // Format the selected text
      const formatMarker = format === 'bold' ? '**' : '_';
      const formattedText = `${formatMarker}${selectedText}${formatMarker}`;
      
      newContent = 
        content.substring(0, start) + 
        formattedText + 
        content.substring(end);
        
      newCursorPos = start + formattedText.length;
    } else {
      // Insert empty formatting tags and position cursor between them
      const formatMarker = format === 'bold' ? '**' : '_';
      newContent = 
        content.substring(0, start) + 
        `${formatMarker}${formatMarker}` + 
        content.substring(end);
        
      newCursorPos = start + formatMarker.length;
    }
    
    setContent(newContent);
    
    // Need to wait for React to update the textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };
  
  const insertEmoji = (emoji: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    
    setContent(
      content.substring(0, start) + 
      emoji + 
      content.substring(start)
    );
    
    const newCursorPos = start + emoji.length;
    
    // Need to wait for React to update the textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };
  
  const handleMediaAdded = (url: string) => {
    setMediaUrls(prev => [...prev, url]);
  };
  
  const removeMedia = (urlToRemove: string) => {
    setMediaUrls(prev => prev.filter(url => url !== urlToRemove));
  };
  
  if (!pubkey) {
    return null;
  }
  
  // Get first character of pubkey for avatar fallback
  const avatarFallback = pubkey ? pubkey.substring(0, 2).toUpperCase() : 'N';
  
  return (
    <form onSubmit={handleSubmit} className="border-b pb-4 mb-4">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            className="resize-none border-none h-24 focus-visible:ring-0 text-lg p-0"
            maxLength={MAX_NOTE_LENGTH}
          />
          
          {mediaUrls.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {mediaUrls.map((url, index) => (
                <div key={`${url}-${index}`} className="relative group">
                  <img 
                    src={url} 
                    alt="Media preview" 
                    className="h-20 w-20 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeMedia(url)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove media"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-2">
              {/* Media upload button */}
              <MediaUpload onMediaAdded={handleMediaAdded} />
              
              {/* Emoji picker button */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" type="button" className="rounded-full">
                    <Smile className="h-5 w-5" />
                    <span className="sr-only">Add emoji</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <EmojiPicker onEmojiSelect={insertEmoji} />
                </PopoverContent>
              </Popover>
              
              {/* Bold text button */}
              <Button 
                variant="ghost" 
                size="icon" 
                type="button" 
                className="rounded-full"
                onClick={() => insertFormatting('bold')}
              >
                <Bold className="h-5 w-5" />
                <span className="sr-only">Bold text</span>
              </Button>
              
              {/* Italic text button */}
              <Button 
                variant="ghost" 
                size="icon" 
                type="button" 
                className="rounded-full"
                onClick={() => insertFormatting('italic')}
              >
                <Italic className="h-5 w-5" />
                <span className="sr-only">Italic text</span>
              </Button>
              
              {/* Schedule post button */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    type="button" 
                    className={`rounded-full ${scheduledDate ? 'text-primary bg-primary/10' : ''}`}
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="sr-only">Schedule post</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-4">
                    <h4 className="text-sm font-medium mb-2">Schedule post</h4>
                    <CalendarComponent
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      initialFocus
                      disabled={{ before: new Date() }}
                    />
                    
                    {scheduledDate && (
                      <>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs">
                            {formatDistanceToNow(scheduledDate, { addSuffix: true })}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setScheduledDate(null)}
                          >
                            Clear
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`text-sm ${charsLeft < 20 ? 'text-amber-500' : charsLeft < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {charsLeft} characters left
              </div>
              
              <Button 
                type="submit" 
                disabled={isSubmitting || content.length === 0 || content.length > MAX_NOTE_LENGTH}
                className="rounded-full"
              >
                {scheduledDate && scheduledDate > new Date() ? 'Schedule' : 'Post'}
              </Button>
            </div>
          </div>
          
          {scheduledDate && scheduledDate > new Date() && (
            <div className="mt-2 p-2 bg-primary/10 rounded-md text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Scheduled for {scheduledDate.toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default CreateNoteForm;
