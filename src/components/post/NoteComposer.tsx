
import { useState, useRef } from 'react';
import { Textarea } from "@/components/ui/textarea";

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
  return (
    <Textarea
      ref={textareaRef}
      value={content}
      onChange={(e) => setContent(e.target.value)}
      placeholder="What's happening?"
      className="resize-none border-none h-24 focus-visible:ring-0 text-lg p-0 bg-transparent"
      maxLength={maxLength * 2} // Allow typing past limit but show warning
      aria-label="Post content"
    />
  );
};

export default NoteComposer;
