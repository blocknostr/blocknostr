
import React from 'react';
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
  if (!showReplyInput) return null;
  
  return (
    <div className="mt-3 pt-3 border-t border-border">
      <QuickReplies
        eventId={eventId}
        pubkey={pubkey}
        content={replyContent}
        onReplyAdded={onReplyAdded}
        onSelected={onReplySelected}
      />
    </div>
  );
};

export default React.memo(RenderReplySection);
