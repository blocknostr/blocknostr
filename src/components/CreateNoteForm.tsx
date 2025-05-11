
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bold, Italic, Smile, Calendar, Image, Loader2, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker from './post/EmojiPicker';
import EnhancedMediaUpload from './post/EnhancedMediaUpload';
import { formatDistanceToNow } from 'date-fns';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuickReplies from './post/QuickReplies';
import { cn } from "@/lib/utils";

const CreateNoteForm = () => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [showFormatting, setShowFormatting] = useState(false);
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
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening?"
                className="resize-none border-none h-24 focus-visible:ring-0 text-lg p-0 bg-transparent"
                maxLength={MAX_NOTE_LENGTH * 2} // Allow typing past limit but show warning
                aria-label="Post content"
              />
            </TabsContent>
            
            <TabsContent value="templates" className="mt-3">
              <QuickReplies onReplySelected={handleQuickReply} />
            </TabsContent>
          </Tabs>
          
          {/* Media preview with improved layout */}
          {mediaUrls.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {mediaUrls.map((url, index) => (
                <div key={`${url}-${index}`} className="relative group rounded-md overflow-hidden">
                  <img 
                    src={url} 
                    alt="Media preview" 
                    className="h-20 w-20 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeMedia(url)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    aria-label="Remove media"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-between items-center mt-4 border-t pt-3">
            <div className="flex gap-1">
              {/* Formatting options in a popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" type="button" className="rounded-full h-8 w-8" aria-label="Formatting options">
                    <Bold className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => insertFormatting('bold')}
                      className="text-xs"
                    >
                      <Bold className="h-3.5 w-3.5 mr-1" /> Bold
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => insertFormatting('italic')}
                      className="text-xs"
                    >
                      <Italic className="h-3.5 w-3.5 mr-1" /> Italic
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Enhanced Media upload button */}
              <EnhancedMediaUpload onMediaAdded={handleMediaAdded} />
              
              {/* Emoji picker button */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" type="button" className="rounded-full h-8 w-8">
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <EmojiPicker onEmojiSelect={insertEmoji} />
                </PopoverContent>
              </Popover>
              
              {/* Schedule post button */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    type="button" 
                    className={cn(
                      "rounded-full h-8 w-8", 
                      scheduledDate ? "text-primary bg-primary/10" : ""
                    )}
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3">
                    <p className="text-sm font-medium mb-2">Schedule post</p>
                    <CalendarComponent
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      initialFocus
                      disabled={{ before: new Date() }}
                    />
                    
                    {scheduledDate && (
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
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={cn(
                "text-xs transition-colors",
                isNearLimit ? "text-amber-500" : isOverLimit ? "text-red-500" : "text-muted-foreground opacity-70",
                !isNearLimit && "hidden sm:block" // Hide on mobile unless near limit
              )}>
                {charsLeft} left
              </div>
              
              <Button 
                type="submit" 
                disabled={isSubmitting || content.length === 0 || isOverLimit}
                size="sm"
                className={cn(
                  "rounded-full transition-all",
                  isSubmitting ? "w-24" : "w-20"
                )}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Posting</span>
                  </div>
                ) : scheduledDate && scheduledDate > new Date() ? 'Schedule' : 'Post'}
              </Button>
            </div>
          </div>
          
          {/* Scheduled post indicator */}
          {scheduledDate && scheduledDate > new Date() && (
            <div className="mt-2 py-1.5 px-2.5 bg-primary/5 rounded-md text-xs flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Scheduled for {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default CreateNoteForm;
