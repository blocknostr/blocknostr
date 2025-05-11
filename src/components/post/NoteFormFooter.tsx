
import React from 'react';
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
    <div className="flex justify-between items-center mt-4 border-t pt-3">
      <FormattingToolbar 
        textareaRef={textareaRef}
        content={content}
        setContent={setContent}
        onMediaAdded={onMediaAdded}
        scheduledDate={scheduledDate}
        setScheduledDate={setScheduledDate}
      />
      
      <div className="flex items-center gap-2">
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
