
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

// Advanced memo comparison function
const arePropsEqual = (prevProps: NoteCardProps, nextProps: NoteCardProps): boolean => {
  // Compare event IDs
  if (prevProps.event.id !== nextProps.event.id) return false;
  
  // Compare pubkeys
  if (prevProps.event.pubkey !== nextProps.event.pubkey) return false;
  
  // Compare content
  if (prevProps.event.content !== nextProps.event.content) return false;
  
  // Compare profile data using a simple check on name
  if (prevProps.profileData?.name !== nextProps.profileData?.name || 
      prevProps.profileData?.display_name !== nextProps.profileData?.display_name ||
      prevProps.profileData?.picture !== nextProps.profileData?.picture) {
    return false;
  }
  
  // Compare repost data
  if (!!prevProps.repostData !== !!nextProps.repostData) return false;
  if (prevProps.repostData?.reposterPubkey !== nextProps.repostData?.reposterPubkey) return false;
  
  // Compare reaction data
  if (!!prevProps.reactionData !== !!nextProps.reactionData) return false;
  if (prevProps.reactionData?.emoji !== nextProps.reactionData?.emoji) return false;
  
  // Compare reply status
  if (prevProps.isReply !== nextProps.isReply) return false;
  
  // Compare hideActions
  if (prevProps.hideActions !== nextProps.hideActions) return false;
  
  // Default to true if all checks pass
  return true;
};

// Memoize the component to prevent unnecessary re-renders
const MemoizedNoteCard = React.memo(
  function NoteCard(props: NoteCardProps) {
    // Validate event before rendering to prevent errors
    if (!props.event || !props.event.id || !props.event.pubkey) {
      return null;
    }
    
    return <NoteCardStructure {...props} />;
  },
  arePropsEqual
);

export default MemoizedNoteCard;
