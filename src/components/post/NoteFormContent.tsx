
import React from 'react';
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import QuickReplies from './quick-replies/QuickRepliesContainer';
import NoteComposer from './NoteComposer';
import MediaPreviewList from './MediaPreviewList';
import ScheduledIndicator from './ScheduledIndicator';
import SmartComposeToolbar from './SmartComposeToolbar';
import NoteFormFooter from './NoteFormFooter';

interface NoteFormContentProps {
  content: string;
  setContent: (content: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  mediaUrls: string[];
  removeMedia: (url: string) => void;
  showQuickReplies: boolean;
  setShowQuickReplies: (show: boolean) => void;
  handleQuickReply: (text: string) => void;
  handleHashtagClick: (tag: string) => void;
  detectedHashtags: string[];
  scheduledDate: Date | null;
  setScheduledDate: (date: Date | null) => void;
  handleMediaAdded: (url: string) => void;
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
  mediaUrls,
  removeMedia,
  showQuickReplies,
  setShowQuickReplies,
  handleQuickReply,
  handleHashtagClick,
  detectedHashtags,
  scheduledDate,
  setScheduledDate,
  handleMediaAdded,
  charsLeft,
  isNearLimit,
  isOverLimit,
  isSubmitting,
  MAX_NOTE_LENGTH
}) => {
  return (
    <div className="flex-1">
      <div className="mt-2">
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
          <div className="mt-2 flex flex-wrap gap-1">
            {detectedHashtags.map(tag => (
              <span key={tag} className="text-xs text-primary px-1.5 py-0.5 rounded-full bg-primary/10">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <Collapsible open={showQuickReplies} onOpenChange={setShowQuickReplies}>
        <CollapsibleContent className="mt-3 data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
          <div className="p-2 border rounded-md bg-background">
            <QuickReplies onReplySelected={handleQuickReply} />
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      <MediaPreviewList mediaUrls={mediaUrls} removeMedia={removeMedia} />
      
      <NoteFormFooter
        textareaRef={textareaRef}
        content={content}
        setContent={setContent}
        onMediaAdded={handleMediaAdded}
        scheduledDate={scheduledDate}
        setScheduledDate={setScheduledDate}
        charsLeft={charsLeft}
        isNearLimit={isNearLimit}
        isOverLimit={isOverLimit}
        isSubmitting={isSubmitting}
        showQuickReplies={showQuickReplies}
        setShowQuickReplies={setShowQuickReplies}
      />
      
      <ScheduledIndicator scheduledDate={scheduledDate} />
    </div>
  );
};

export default NoteFormContent;
