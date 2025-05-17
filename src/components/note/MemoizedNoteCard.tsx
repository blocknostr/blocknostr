
import React, { memo } from 'react';
import { NostrEvent } from '@/lib/nostr';
import NoteCard from './NoteCard';

export interface NoteCardProps {
  event: NostrEvent;
  profileData?: any;
  isExpanded?: boolean;
}

const MemoizedNoteCard = memo(function MemoizedNoteCard(props: NoteCardProps) {
  return <NoteCard {...props} />;
});

export default MemoizedNoteCard;
