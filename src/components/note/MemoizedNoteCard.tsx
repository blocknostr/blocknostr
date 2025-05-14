
import React, { useMemo } from 'react';
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
    // Validate event before rendering
    const isValidEvent = useMemo(() => {
      return event && event.id && event.pubkey;
    }, [event]);
    
    // Return null if event is invalid to prevent errors
    if (!isValidEvent) return null;
    
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
    // Only re-render if event ID changes, profile data updates, or reaction data changes
    return prevProps.event.id === nextProps.event.id && 
           JSON.stringify(prevProps.profileData) === JSON.stringify(nextProps.profileData) &&
           JSON.stringify(prevProps.reactionData) === JSON.stringify(nextProps.reactionData);
  }
);

export default MemoizedNoteCard;
