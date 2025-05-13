
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

const NoteCard = (props: NoteCardProps) => {
  if (!props.event) {
    return null;
  }
  
  console.log(`[MemoizedNoteCard] Rendering note with pubkey ${props.event.pubkey?.substring(0, 8)}, has profile: ${!!props.profileData}`, 
    props.profileData?.name || props.profileData?.display_name);

  return <NoteCardStructure {...props} />;
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(NoteCard, (prevProps, nextProps) => {
  // Only re-render if:
  // 1. The event has changed
  // 2. The profile data has changed (and is meaningful)
  // 3. The repost data has changed
  // 4. Other props have changed
  
  const prevHasProfileData = !!prevProps.profileData && 
    (!!prevProps.profileData.name || !!prevProps.profileData.display_name);
  
  const nextHasProfileData = !!nextProps.profileData && 
    (!!nextProps.profileData.name || !!nextProps.profileData.display_name);
  
  // If we have new profile data but didn't have it before, re-render
  if (!prevHasProfileData && nextHasProfileData) {
    return false; // Don't skip render
  }
  
  // If the event ID has changed, re-render
  if (prevProps.event?.id !== nextProps.event?.id) {
    return false; // Don't skip render
  }
  
  // Default equality check for other props
  return (
    prevProps.hideActions === nextProps.hideActions &&
    prevProps.isReply === nextProps.isReply &&
    prevProps.event === nextProps.event &&
    prevProps.profileData === nextProps.profileData &&
    JSON.stringify(prevProps.repostData) === JSON.stringify(nextProps.repostData) &&
    JSON.stringify(prevProps.reactionData) === JSON.stringify(nextProps.reactionData)
  );
});
