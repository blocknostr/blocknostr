
import { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface NoteComposerProps {
  content: string;
  setContent: (content: string) => void;
  maxLength: number;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

const NoteComposer: React.FC<NoteComposerProps> = ({ 
  content, 
  setContent, 
  maxLength,
  textareaRef 
}) => {
  // Auto-resize function
  const autoResize = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height temporarily to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set the height based on scroll height with a small buffer
    const newHeight = Math.max(
      textarea.scrollHeight, // Content height
      80 // Minimum height (5rem)
    );
    
    textarea.style.height = `${newHeight}px`;
  };
  
  // Resize on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      autoResize();
    }
  }, []);
  
  // Resize when content changes
  useEffect(() => {
    autoResize();
  }, [content]);
  
  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };
  
  return (
    <Textarea
      ref={textareaRef}
      value={content}
      onChange={handleContentChange}
      placeholder="What's happening?"
      className={cn(
        "resize-none border-none min-h-[5rem] h-auto focus-visible:ring-0 text-base p-0 bg-transparent",
        "transition-all duration-300 ease-in-out",
        "placeholder:text-muted-foreground/60 focus:placeholder:text-muted-foreground/40",
        "font-normal leading-relaxed"
      )}
      maxLength={maxLength * 2} // Allow typing past limit but show warning
      aria-label="Post content"
    />
  );
};

export default NoteComposer;
