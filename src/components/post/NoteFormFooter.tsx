
import React from 'react';
import { Button } from "@/components/ui/button";
import FormattingToolbar from './FormattingToolbar';
import CharacterCounter from './CharacterCounter';
import SubmitButton from './SubmitButton';

interface NoteFormFooterProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  content: string;
  setContent: (content: string) => void;
  onMediaAdded: (url: string) => void;
  scheduledDate: Date | null;
  setScheduledDate: (date: Date | null) => void;
  charsLeft: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
  isSubmitting: boolean;
}

const NoteFormFooter: React.FC<NoteFormFooterProps> = ({
  textareaRef,
  content,
  setContent,
  onMediaAdded,
  scheduledDate,
  setScheduledDate,
  charsLeft,
  isNearLimit,
  isOverLimit,
  isSubmitting
}) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center">
        <FormattingToolbar 
          textareaRef={textareaRef}
          content={content}
          setContent={setContent}
          onMediaAdded={onMediaAdded}
          scheduledDate={scheduledDate}
          setScheduledDate={setScheduledDate}
        />
      </div>
      
      <div className="flex items-center gap-3">
        <CharacterCounter 
          charsLeft={charsLeft} 
          isNearLimit={isNearLimit} 
          isOverLimit={isOverLimit} 
        />
        
        <SubmitButton 
          isSubmitting={isSubmitting}
          disabled={content.length === 0 || isOverLimit}
          scheduledDate={scheduledDate}
        />
      </div>
    </div>
  );
};

export default NoteFormFooter;
