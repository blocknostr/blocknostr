
import React from 'react';
import { NostrEvent } from '@/lib/nostr';
import MemoizedNoteCard from './MemoizedNoteCard';

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

// Direct export of MemoizedNoteCard component with type safety
const NoteCard = (props: NoteCardProps) => {
  return <MemoizedNoteCard {...props} />;
};

export default NoteCard;
