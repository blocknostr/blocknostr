
import React, { useEffect } from "react";
import { cn } from "@/lib/utils";

interface NoteComposerProps {
  content: string;
  setContent: (content: string) => void;
  maxLength?: number;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

const NoteComposer: React.FC<NoteComposerProps> = ({
  content,
  setContent,
  maxLength = 280,
  textareaRef
}) => {
  // Auto-resize the textarea as content changes
  useEffect(() => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    
    // Set the height based on scroll height with a small buffer
    const newHeight = Math.max(
      textarea.scrollHeight, // Content height
      64 // Minimum height (4rem)
    );
    
    textarea.style.height = `${newHeight}px`;
  }, [content, textareaRef]);

  // Manual handling of content change to resize and update state
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setContent(newValue);
    
    // Update textarea height
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, 64)}px`;
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={handleContentChange}
      placeholder="What's happening?"
      className={cn(
        "resize-none border-none min-h-[4rem] h-auto text-base p-0 bg-transparent w-full",
        "transition-all duration-200 ease-in-out",
        "placeholder:text-muted-foreground/60 focus:placeholder:text-muted-foreground/40",
        "font-normal leading-relaxed focus-visible:ring-0",
      )}
      maxLength={maxLength * 2} // Allow typing past limit but show warning
    />
  );
};

export default NoteComposer;
