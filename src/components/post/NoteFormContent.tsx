
import React, { useRef, useEffect, RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import CharacterCounter from './CharacterCounter';
import ScheduledIndicator from './ScheduledIndicator';
import NoteFormFooter from './NoteFormFooter';
import FormattingToolbar from './FormattingToolbar';
import EmojiPicker from './EmojiPicker';
import { useAutosize } from '@/hooks/use-autosize';

export interface NoteFormContentProps {
  content: string;
  setContent: (content: string) => void;
  scheduledDate: Date | null;
  setScheduledDate: (date: Date | null) => void;
  MAX_NOTE_LENGTH: number;
  textareaRef: RefObject<HTMLTextAreaElement>;
  isSubmitting: boolean;
}

const NoteFormContent: React.FC<NoteFormContentProps> = ({
  content,
  setContent,
  scheduledDate,
  setScheduledDate,
  MAX_NOTE_LENGTH,
  textareaRef,
  isSubmitting
}) => {
  // Calculate characters left and warning thresholds
  const charsLeft = MAX_NOTE_LENGTH - (content?.length || 0);
  const isNearLimit = charsLeft <= 20;
  const isOverLimit = charsLeft < 0;
  
  // Auto-resize textarea as content grows
  useAutosize(textareaRef, content);
  
  // Focus textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [textareaRef]);
  
  // Handle formatting toolbar actions
  const handleFormatClick = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let formattedText = '';
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'link':
        formattedText = selectedText.match(/^https?:\/\//) 
          ? `[](${selectedText})` 
          : `[${selectedText}](url)`;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
        break;
      case 'ul':
        formattedText = `- ${selectedText}`;
        break;
      case 'ol':
        formattedText = `1. ${selectedText}`;
        break;
      case 'image':
        formattedText = selectedText.match(/^https?:\/\//) 
          ? selectedText 
          : 'https://example.com/image.jpg';
        break;
      case 'mention':
        // Add proper nostr: mention format
        formattedText = selectedText.startsWith('@') 
          ? selectedText // Keep as is if already an @ mention
          : `@${selectedText}`; // Otherwise add @ prefix
        break;
      default:
        formattedText = selectedText;
    }
    
    const newContent = 
      content.substring(0, start) + 
      formattedText + 
      content.substring(end);
    
    setContent(newContent);
    
    // Focus back to textarea and position cursor after inserted text
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.selectionStart = start + formattedText.length;
        textarea.selectionEnd = start + formattedText.length;
      }
    }, 0);
  };
  
  // Handle emoji insertion
  const handleEmojiSelected = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newContent = 
      content.substring(0, start) + 
      emoji + 
      content.substring(end);
    
    setContent(newContent);
    
    // Focus back to textarea and position cursor after inserted emoji
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newPosition = start + emoji.length;
        textarea.selectionStart = newPosition;
        textarea.selectionEnd = newPosition;
      }
    }, 0);
  };
  
  return (
    <div className="space-y-2">
      {/* Main textarea input */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder="What's happening?"
          className="min-h-24 resize-none bg-background p-3 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 overflow-hidden"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
        />
        
        {/* Show character counter */}
        <div className="absolute bottom-2 right-2">
          <CharacterCounter 
            charsLeft={charsLeft} 
            isNearLimit={isNearLimit} 
            isOverLimit={isOverLimit} 
          />
        </div>
      </div>
      
      {/* Scheduled post indicator */}
      {scheduledDate && (
        <ScheduledIndicator 
          scheduledDate={scheduledDate} 
          onCancelSchedule={() => setScheduledDate(null)}
        />
      )}
      
      {/* Formatting toolbar and emoji picker */}
      <div className="flex items-center justify-between border-t pt-2">
        <FormattingToolbar onFormatClick={handleFormatClick} />
        <EmojiPicker onEmojiSelect={handleEmojiSelected} />
      </div>
      
      {/* Footer actions */}
      <NoteFormFooter
        textareaRef={textareaRef}
        content={content}
        setContent={setContent}
        scheduledDate={scheduledDate}
        setScheduledDate={setScheduledDate}
        charsLeft={charsLeft}
        isNearLimit={isNearLimit}
        isOverLimit={isOverLimit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default NoteFormContent;
