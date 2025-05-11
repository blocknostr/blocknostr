
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

  return (
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
      <EnhancedMediaUpload onMediaAdded={onMediaAdded} />
      
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
  );
};

export default FormattingToolbar;
