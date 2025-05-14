
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

// Create a stable memo comparison function
const arePropsEqual = (prevProps: NoteCardProps, nextProps: NoteCardProps) => {
  // Basic comparison of event IDs
  if (prevProps.event?.id !== nextProps.event?.id) return false;
  
  // Check if the content changed
  if (prevProps.event?.content !== nextProps.event?.content) return false;
  
  // Check if the profile data changed
  if (JSON.stringify(prevProps.profileData) !== JSON.stringify(nextProps.profileData)) return false;
  
  // Check if the repost data changed
  if (!!prevProps.repostData !== !!nextProps.repostData) return false;
  
  // Check if the reaction data changed
  if (!!prevProps.reactionData !== !!nextProps.reactionData) return false;
  
  // If we got here, props are equal
  return true;
};

const NoteCard = (props: NoteCardProps) => {
  return <NoteCardStructure {...props} />;
};

const MemoizedNoteCard = memo(NoteCard, arePropsEqual);

export default MemoizedNoteCard;
