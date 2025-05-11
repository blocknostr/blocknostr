
import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import FormattingToolbar from './FormattingToolbar';
import CharacterCounter from './CharacterCounter';
import SubmitButton from './SubmitButton';
import { cn } from "@/lib/utils";

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
  showQuickReplies: boolean;
  setShowQuickReplies: (show: boolean) => void;
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
  isSubmitting,
  showQuickReplies,
  setShowQuickReplies
}) => {
  return (
    <div className="flex justify-between items-center mt-4 border-t pt-3">
      <div className="flex items-center">
        <FormattingToolbar 
          textareaRef={textareaRef}
          content={content}
          setContent={setContent}
          onMediaAdded={onMediaAdded}
          scheduledDate={scheduledDate}
          setScheduledDate={setScheduledDate}
        />
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setShowQuickReplies(!showQuickReplies)}
          className={cn(
            "rounded-full h-8 w-8",
            showQuickReplies && "text-primary bg-primary/10"
          )}
          title="Quick Replies"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>
      
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
