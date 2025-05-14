
import React from 'react';
import { NostrEvent } from '@/lib/nostr';
import NoteCardStructure from './structure/NoteCardStructure';

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

// Memoize the component to prevent unnecessary re-renders
const MemoizedNoteCard = React.memo(
  function NoteCard({ 
    event, 
    profileData, 
    hideActions, 
    repostData, 
    isReply, 
    reactionData 
  }: NoteCardProps) {
    if (!event || !event.id) return null;

    return (
      <NoteCardStructure
        event={event}
        profileData={profileData}
        hideActions={hideActions}
        repostData={repostData}
        isReply={isReply}
        reactionData={reactionData}
      />
    );
  },
  // Custom comparison function to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    // Only re-render if the event ID changes or profile data updates
    return prevProps.event.id === nextProps.event.id && 
           JSON.stringify(prevProps.profileData) === JSON.stringify(nextProps.profileData);
  }
);

export default MemoizedNoteCard;
