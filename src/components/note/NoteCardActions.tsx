
import React from 'react';
import { NostrEvent } from '@/lib/nostr';
import { RepostButton, LikeButton, CommentButton, StatsButton, DeleteButton } from './actions';
import { nostrService } from '@/lib/nostr';
import { useNoteCardReplies } from './hooks/useNoteCardReplies';

interface NoteProps {
  id: string;
  author: string;
  content: string;
  createdAt: number;
  event?: NostrEvent;
}

interface NoteCardActionsProps {
  note: NoteProps;
  setActiveReply?: () => void;
  replyCount?: number;
  onReplyCountUpdate?: (count: number) => void;
}

const NoteCardActions: React.FC<NoteCardActionsProps> = ({ 
  note, 
  setActiveReply, 
  replyCount: initialReplyCount,
  onReplyCountUpdate
}) => {
  // Only fetch replies if not provided externally
  const { replyCount: fetchedReplyCount } = useNoteCardReplies({ 
    eventId: note?.id || '',
    onUpdate: onReplyCountUpdate,
    skip: initialReplyCount !== undefined
  });
  
  // Use provided count if available, otherwise use fetched count
  const displayReplyCount = initialReplyCount !== undefined ? initialReplyCount : fetchedReplyCount;
  
  // Access the Nostr public key
  const currentUserPubkey = nostrService.publicKey;
  const isCurrentUserNote = currentUserPubkey === note.author;
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-1 text-muted-foreground">
        <CommentButton 
          eventId={note.id} 
          count={displayReplyCount}
          onClick={setActiveReply} 
        />
        
        <RepostButton 
          eventId={note.id}
          content={note.content}
          authorId={note.author}
          createdAt={note.createdAt} 
        />
        
        <LikeButton 
          eventId={note.id} 
          authorPubkey={note.author} 
        />
        
        <StatsButton 
          eventId={note.id} 
        />
      </div>
      
      {isCurrentUserNote && (
        <DeleteButton 
          eventId={note.id}
          event={note.event}
        />
      )}
    </div>
  );
};

export default React.memo(NoteCardActions);
