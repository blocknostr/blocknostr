
import React from 'react';
import { NostrEvent } from '@/lib/nostr';
import NoteCardStructure from './structure/NoteCardStructure';

// Import the Note type from the shared location
import { Note } from '@/components/notebin/hooks/types';

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

  return <NoteCardStructure {...props} />;
};

export default React.memo(NoteCard);
