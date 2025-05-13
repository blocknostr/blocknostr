
import { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Bold, Italic, Smile, Calendar, Image } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker from './EmojiPicker';
import EnhancedMediaUpload from './EnhancedMediaUpload';
import { formatDistanceToNow } from 'date-fns';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface FormattingToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  content: string;
  setContent: (content: string) => void;
  onMediaAdded: (url: string) => void;
  scheduledDate: Date | null;
  setScheduledDate: (date: Date | null) => void;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  textareaRef,
  content,
  setContent,
  onMediaAdded,
  scheduledDate,
  setScheduledDate
}) => {
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

  const toolbarBtnClass = "rounded-full h-9 w-9 flex items-center justify-center transition-all duration-200";
  const toolbarIconClass = "h-4 w-4";

  return (
    <div className="flex gap-2 py-1">
      {/* Bold button directly visible */}
      <Button 
        variant="ghost" 
        size="icon" 
        type="button" 
        className={cn(toolbarBtnClass, "hover:bg-primary/10")} 
        onClick={() => insertFormatting('bold')} 
        aria-label="Bold text"
      >
        <Bold className={toolbarIconClass} />
      </Button>
      
      {/* Italic button directly visible */}
      <Button 
        variant="ghost" 
        size="icon" 
        type="button" 
        className={cn(toolbarBtnClass, "hover:bg-primary/10")} 
        onClick={() => insertFormatting('italic')} 
        aria-label="Italic text"
      >
        <Italic className={toolbarIconClass} />
      </Button>
      
      {/* Enhanced Media upload button */}
      <EnhancedMediaUpload onMediaAdded={onMediaAdded} />
      
      {/* Emoji picker button */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            type="button" 
            className={cn(toolbarBtnClass, "hover:bg-primary/10")}
            aria-label="Insert emoji"
          >
            <Smile className={toolbarIconClass} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 border-border/80 shadow-lg">
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
              toolbarBtnClass,
              scheduledDate ? "text-primary bg-primary/10 hover:bg-primary/20" : "hover:bg-primary/10"
            )}
            aria-label="Schedule post"
          >
            <Calendar className={toolbarIconClass} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-border/80 shadow-lg" align="start">
          <div className="p-3">
            <p className="text-sm font-medium mb-2">Schedule post</p>
            <CalendarComponent
              mode="single"
              selected={scheduledDate}
              onSelect={setScheduledDate}
              initialFocus
              disabled={{ before: new Date() }}
              className="rounded-md border-border/50"
            />
            
            {scheduledDate && (
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/30">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(scheduledDate, { addSuffix: true })}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setScheduledDate(null)}
                  className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default FormattingToolbar;
