
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
  // Focus the textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);
  
  return (
    <Textarea
      ref={textareaRef}
      value={content}
      onChange={(e) => setContent(e.target.value)}
      placeholder="What's happening?"
      className={cn(
        "resize-none border-0 min-h-[3.5rem] h-auto focus-visible:ring-0 text-base p-0",
        "bg-transparent hover:bg-transparent focus:bg-transparent",
        "transition-all duration-300 ease-in-out",
        "placeholder:text-muted-foreground/60 focus:placeholder:text-muted-foreground/40",
        "rounded-none",
        "font-normal leading-relaxed"
      )}
      maxLength={maxLength * 2} // Allow typing past limit but show warning
      aria-label="Post content"
    />
  );
};

export default NoteComposer;
