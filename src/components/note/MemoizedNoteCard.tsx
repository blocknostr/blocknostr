
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

// Basic memo comparison function
const arePropsEqual = (prevProps: NoteCardProps, nextProps: NoteCardProps) => {
  // Only compare event IDs for basic implementation
  return prevProps.event?.id === nextProps.event?.id;
};

const NoteCard = (props: NoteCardProps) => {
  return <NoteCardStructure {...props} />;
};

// Use memo to prevent unnecessary re-renders
const MemoizedNoteCard = memo(NoteCard, arePropsEqual);

export default MemoizedNoteCard;
