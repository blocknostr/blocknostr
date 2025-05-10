
import { useState, useRef, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Image, Calendar, X, Smile, Paperclip } from "lucide-react";
import { Autocomplete } from "@/components/Autocomplete";
import { MediaPreview } from "@/components/MediaPreview";

const CreateNoteForm = () => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [showHashtagAutocomplete, setShowHashtagAutocomplete] = useState(false);
  const [showTagAutocomplete, setShowTagAutocomplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const pubkey = nostrService.publicKey;
  
  // Max note length (for UI only, actual limit depends on relays)
  const MAX_NOTE_LENGTH = 280;
  const charsLeft = MAX_NOTE_LENGTH - content.length;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && mediaFiles.length === 0) {
      return;
    }
    
    if (!pubkey) {
      toast.error("Please sign in to post");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Extract hashtags from content
      const hashtags: string[] = [];
      const hashtagRegex = /#(\w+)/g;
      let match;
      while ((match = hashtagRegex.exec(content)) !== null) {
        hashtags.push(match[1]);
      }
      
      // Create tags array
      const tags: string[][] = [];
      
      // Add hashtags
      hashtags.forEach(tag => {
        tags.push(['t', tag]);
      });
      
      const eventId = await nostrService.publishEvent({
        kind: 1, // text_note
        content: content,
        tags: tags
      });
      
      if (eventId) {
        toast.success("Note published!");
        setContent("");
        setMediaFiles([]);
      }
    } catch (error) {
      console.error("Failed to publish note:", error);
      toast.error("Failed to publish note");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // Check if adding these files would exceed the limit
      if (mediaFiles.length + newFiles.length > 4) {
        toast.error("Maximum 4 media files allowed");
        return;
      }
      
      setMediaFiles(prev => [...prev, ...newFiles]);
      
      // Reset input value so the same file can be selected again
      e.target.value = '';
    }
  };
  
  const handleRemoveFile = (indexToRemove: number) => {
    setMediaFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    // Check for hashtag autocompletion
    const lastWordMatch = e.target.value.match(/#(\w*)$/);
    setShowHashtagAutocomplete(!!lastWordMatch);
    
    // Check for mention autocompletion
    const mentionMatch = e.target.value.match(/@(\w*)$/);
    setShowTagAutocomplete(!!mentionMatch);
  };
  
  const handleSelectHashtag = (newContent: string) => {
    setContent(newContent);
    setShowHashtagAutocomplete(false);
  };
  
  const handleSelectTag = (newContent: string) => {
    setContent(newContent);
    setShowTagAutocomplete(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      
      // Check if adding these files would exceed the limit
      if (mediaFiles.length + newFiles.length > 4) {
        toast.error("Maximum 4 media files allowed");
        return;
      }
      
      setMediaFiles(prev => [...prev, ...newFiles]);
    }
  };
  
  if (!pubkey) {
    return null;
  }
  
  // Get first character of pubkey for avatar fallback
  const avatarFallback = pubkey ? pubkey.substring(0, 2).toUpperCase() : 'N';
  
  return (
    <form 
      onSubmit={handleSubmit} 
      className="border-b pb-4 mb-4"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="relative">
            <Textarea
              value={content}
              onChange={handleTextAreaChange}
              placeholder="What's happening?"
              className="resize-none border-none h-24 focus-visible:ring-0 text-lg p-0"
              maxLength={MAX_NOTE_LENGTH}
            />
            
            {/* Autocomplete for hashtags */}
            {showHashtagAutocomplete && (
              <Autocomplete 
                content={content} 
                onSelect={handleSelectHashtag} 
                type="hashtag" 
              />
            )}
            
            {/* Autocomplete for tags/mentions */}
            {showTagAutocomplete && (
              <Autocomplete 
                content={content} 
                onSelect={handleSelectTag} 
                type="tag" 
              />
            )}
          </div>
          
          {/* Media preview area */}
          {mediaFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {mediaFiles.map((file, index) => (
                <MediaPreview 
                  key={index}
                  file={file}
                  onRemove={() => handleRemoveFile(index)}
                />
              ))}
            </div>
          )}
          
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-8 w-8 text-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image size={18} />
              </Button>
              
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-8 w-8 text-primary"
                onClick={() => toast.info("Emoji picker coming soon!")}
              >
                <Smile size={18} />
              </Button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,video/*"
                multiple
              />
              
              <div className={`text-sm ${charsLeft < 20 ? 'text-amber-500' : charsLeft < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {charsLeft} characters left
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting || (content.length === 0 && mediaFiles.length === 0) || content.length > MAX_NOTE_LENGTH}
              className="rounded-full"
            >
              Post
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CreateNoteForm;
