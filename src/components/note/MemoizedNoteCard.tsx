
import React, { memo } from 'react';
import NoteCardStructure from './structure/NoteCardStructure';
import { NostrEvent } from '@/lib/nostr';

interface NoteCardProps {
  event: NostrEvent;
  profileData?: Record<string, any>;
  hideActions?: boolean;
  repostData?: {
    reposterPubkey: string;
    reposterProfile?: Record<string, any>;
  };
  isReply?: boolean;
  reactionData?: {
    emoji: string;
    reactionEvent: NostrEvent;
  };
}

// Memoized version of the NoteCard component
const MemoizedNoteCard = memo(
  function NoteCard({
    event,
    profileData,
    hideActions = false,
    repostData,
    isReply = false,
    reactionData,
  }: NoteCardProps) {
    return (
      <div data-id={event?.id} className="note-card-wrapper">
        <NoteCardStructure
          event={event}
          profileData={profileData}
          hideActions={hideActions}
          repostData={repostData}
          isReply={isReply}
          reactionData={reactionData}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if the event ID changes or profiles/repost data changes
    const isSameEvent = prevProps.event?.id === nextProps.event?.id;
    const isSameProfile = prevProps.profileData === nextProps.profileData;
    const isSameRepostData = prevProps.repostData === nextProps.repostData;
    const isSameReactionData = 
      (!prevProps.reactionData && !nextProps.reactionData) || 
      (prevProps.reactionData?.emoji === nextProps.reactionData?.emoji);
    
    return isSameEvent && isSameProfile && isSameRepostData && isSameReactionData;
  }
);

export default MemoizedNoteCard;
