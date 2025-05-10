
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import FormatToolbar from './editor/FormatToolbar';
import MediaPreviewItem from './editor/MediaPreviewItem';
import { Calendar, Clock, Zap } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Media {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

const CreateNoteForm = () => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [visibility, setVisibility] = useState("public");
  const [zapAmount, setZapAmount] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const pubkey = nostrService.publicKey;
  
  // Max note length (for UI only, actual limit depends on relays)
  const MAX_NOTE_LENGTH = 280;
  const charsLeft = MAX_NOTE_LENGTH - content.length;
  
  // Cleanup media preview URLs on unmount
  useEffect(() => {
    return () => {
      mediaItems.forEach(media => URL.revokeObjectURL(media.preview));
    };
  }, [mediaItems]);

  const handleTextFormatting = (formatType: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = '';
    let newCursorPos = end;
    
    switch (formatType) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        newCursorPos = start + 2 + selectedText.length;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        newCursorPos = start + 1 + selectedText.length;
        break;
      case 'strikethrough':
        formattedText = `~~${selectedText}~~`;
        newCursorPos = start + 2 + selectedText.length;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        newCursorPos = start + selectedText.length + 3;
        break;
      case 'hashtag':
        formattedText = selectedText ? `#${selectedText}` : '#';
        newCursorPos = start + 1 + selectedText.length;
        break;
      case 'mention':
        formattedText = selectedText ? `@${selectedText}` : '@';
        newCursorPos = start + 1 + selectedText.length;
        break;
      default:
        return;
    }
    
    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    
    // Set cursor position after the format is applied
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
    const cursorPos = textarea.selectionStart;
    
    const newContent = content.substring(0, cursorPos) + emoji + content.substring(cursorPos);
    setContent(newContent);
    
    // Set cursor position after the emoji
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = cursorPos + emoji.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };
  
  const handleMediaUpload = (file: File) => {
    // Check if we already have 4 media items (common limit on social platforms)
    if (mediaItems.length >= 4) {
      toast.error("Maximum of 4 media items allowed");
      return;
    }
    
    // Create preview URL
    const preview = URL.createObjectURL(file);
    
    // Determine media type
    const isVideo = file.type.startsWith('video/');
    
    setMediaItems([
      ...mediaItems, 
      { 
        file,
        preview,
        type: isVideo ? 'video' : 'image'
      }
    ]);
    
    toast.success("Media added successfully");
  };
  
  const removeMedia = (index: number) => {
    setMediaItems(prev => {
      const newItems = [...prev];
      // Revoke the URL to free memory
      URL.revokeObjectURL(newItems[index].preview);
      newItems.splice(index, 1);
      return newItems;
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && mediaItems.length === 0) {
      toast.error("Please add some content or media to your post");
      return;
    }
    
    if (!pubkey) {
      toast.error("Please sign in to post");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare tags array
      const tags: string[][] = [];
      
      // Extract hashtags from content
      const hashtagRegex = /#(\w+)/g;
      let match;
      while ((match = hashtagRegex.exec(content)) !== null) {
        tags.push(["t", match[1]]);
      }
      
      // Extract mentions from content
      const mentionRegex = /@(\w+)/g;
      while ((match = mentionRegex.exec(content)) !== null) {
        tags.push(["p", match[1]]);
      }
      
      // Add visibility tag if not public
      if (visibility !== "public") {
        tags.push(["visibility", visibility]);
      }
      
      // Add scheduled date if set
      if (scheduledDate) {
        tags.push(["scheduled_at", Math.floor(scheduledDate.getTime() / 1000).toString()]);
      }
      
      // Add zap amount if set
      if (zapAmount) {
        tags.push(["zap", zapAmount]);
      }
      
      // TODO: Add media handling with actual upload to a service
      // For now we'll just add the file names as references
      mediaItems.forEach((media, index) => {
        tags.push(["media", `${index}`, media.file.name, media.type]);
      });
      
      const eventId = await nostrService.publishEvent({
        kind: 1, // text_note
        content: content,
        tags: tags
      });
      
      if (eventId) {
        toast.success("Note published!");
        setContent("");
        setMediaItems([]);
        setScheduledDate(undefined);
        setVisibility("public");
        setZapAmount(null);
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
          
          {mediaItems.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {mediaItems.map((media, index) => (
                <MediaPreviewItem
                  key={index}
                  media={media}
                  onRemove={() => removeMedia(index)}
                />
              ))}
            </div>
          )}
          
          <div className="border-t mt-2 pt-2">
            <FormatToolbar
              onBold={() => handleTextFormatting('bold')}
              onItalic={() => handleTextFormatting('italic')}
              onStrikethrough={() => handleTextFormatting('strikethrough')}
              onLink={() => handleTextFormatting('link')}
              onHashtag={() => handleTextFormatting('hashtag')}
              onMention={() => handleTextFormatting('mention')}
              onEmojiSelect={insertEmoji}
              onMediaUpload={handleMediaUpload}
            />
          </div>
          
          <div className="flex flex-wrap justify-between items-center mt-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Schedule post */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={scheduledDate ? "bg-primary/10 border-primary text-primary" : ""}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    {scheduledDate ? format(scheduledDate, "MMM d") : "Schedule"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3">
                    <CalendarComponent
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                    {scheduledDate && (
                      <div className="flex gap-2 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1"
                          onClick={() => setScheduledDate(undefined)}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Post visibility */}
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="h-9 w-[130px]">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">🌍 Public</SelectItem>
                  <SelectItem value="followers">🔒 Followers Only</SelectItem>
                  <SelectItem value="dao">🏛️ DAO Members</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Zap amount */}
              <Select value={zapAmount || ''} onValueChange={setZapAmount}>
                <SelectTrigger className="h-9 w-[100px]">
                  <Zap className="h-4 w-4 mr-1" />
                  <SelectValue placeholder="Zap" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Zap</SelectItem>
                  <SelectItem value="10">10 sats</SelectItem>
                  <SelectItem value="50">50 sats</SelectItem>
                  <SelectItem value="100">100 sats</SelectItem>
                  <SelectItem value="1000">1000 sats</SelectItem>
                  <SelectItem value="5000">5000 sats</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`text-sm ${charsLeft < 20 ? 'text-amber-500' : charsLeft < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {charsLeft} left
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting || (content.length === 0 && mediaItems.length === 0) || content.length > MAX_NOTE_LENGTH}
                className="rounded-full"
              >
                {scheduledDate ? 'Schedule' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CreateNoteForm;
