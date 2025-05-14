
import React from 'react';
import NoteComposer from './NoteComposer';
import ScheduledIndicator from './ScheduledIndicator';
import SmartComposeToolbar from './SmartComposeToolbar';
import NoteFormFooter from './NoteFormFooter';
import { cn } from '@/lib/utils';

interface NoteFormContentProps {
  content: string;
  setContent: (content: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  handleHashtagClick: (tag: string) => void;
  detectedHashtags: string[];
  scheduledDate: Date | null;
  setScheduledDate: (date: Date | null) => void;
  charsLeft: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
  isSubmitting: boolean;
  MAX_NOTE_LENGTH: number;
}

const NoteFormContent: React.FC<NoteFormContentProps> = ({
  content,
  setContent,
  textareaRef,
  handleHashtagClick,
  detectedHashtags,
  scheduledDate,
  setScheduledDate,
  charsLeft,
  isNearLimit,
  isOverLimit,
  isSubmitting,
  MAX_NOTE_LENGTH
}) => {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-grow">
        <NoteComposer 
          content={content}
          setContent={setContent}
          maxLength={MAX_NOTE_LENGTH}
          textareaRef={textareaRef}
        />
        
        <SmartComposeToolbar 
          onHashtagClick={handleHashtagClick}
        />
        
        {detectedHashtags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {detectedHashtags.map(tag => (
              <span 
                key={tag} 
                className={cn(
                  "text-xs font-medium text-primary px-1.5 py-0.5 rounded-full bg-primary/10",
                  "transition-all duration-200 hover:bg-primary/15 hover:scale-105"
                )}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div className={cn(
        "border-t mt-2 pt-2 border-border/50"
      )}>
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
      
      <ScheduledIndicator scheduledDate={scheduledDate} />
    </div>
  );
};

export default NoteFormContent;
