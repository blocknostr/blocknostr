
import React from 'react';
import NoteCardComments from '../NoteCardComments';
import QuickReplies from '@/components/post/QuickReplies';

interface RenderReplySectionProps {
  showReplyInput: boolean;
  eventId: string;
  pubkey: string;
  replyContent: string;
  onReplyAdded: () => void;
  onReplySelected: (text: string) => void;
}

const RenderReplySection: React.FC<RenderReplySectionProps> = ({
  showReplyInput,
  eventId,
  pubkey,
  replyContent,
  onReplyAdded,
  onReplySelected
}) => {
  if (!showReplyInput || !eventId) {
    return null;
  }
  
  return (
    <div className="mt-3 border-t pt-3">
      <NoteCardComments 
        eventId={eventId} 
        pubkey={pubkey}
        initialCommentText={replyContent}
        onReplyAdded={onReplyAdded}
      />
      
      {/* Quick Replies */}
      <div className="mt-2 pb-1">
        <QuickReplies onReplySelected={onReplySelected} />
      </div>
    </div>
  );
};

export default RenderReplySection;
