
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import NoteCardHeader from './NoteCardHeader';
import NoteCardContent from './NoteCardContent';
import NoteCardActions from './NoteCardActions';
import NoteCardRepostHeader from './NoteCardRepostHeader';
import NoteCardDeleteDialog from './NoteCardDeleteDialog';
import { useNoteCardDeleteDialog } from './hooks/useNoteCardDeleteDialog';
import { NostrEvent, nostrService } from '@/lib/nostr';
import { Note } from '../notebin/hooks/types';
import { Heart } from 'lucide-react';

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

const NoteCard = ({
  event,
  profileData,
  hideActions = false,
  repostData,
  isReply = false,
  reactionData
}: NoteCardProps) => {
  // Set up local state
  const [activeReply, setActiveReply] = useState<Note | null>(null);
  
  // Use custom hook for delete dialog
  const {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeleting,
    handleDeleteClick,
    handleConfirmDelete
  } = useNoteCardDeleteDialog({
    event,
    onDelete: () => {
      // Refresh the page if needed
    }
  });

  const isCurrentUser = event.pubkey === nostrService.publicKey;

  const handleCardClick = () => {
    if (event.id) {
      window.location.href = `/post/${event.id}`;
    }
  };
  
  // Build card component with all the variations
  return (
    <Card className="shadow-sm hover:shadow transition-shadow cursor-pointer overflow-hidden" onClick={handleCardClick}>
      {/* Render repost header if this is a repost */}
      {repostData && (
        <NoteCardRepostHeader
          reposterPubkey={repostData.reposterPubkey}
          reposterProfile={repostData.reposterProfile}
        />
      )}
      
      {/* Render reaction header if this is a reaction */}
      {reactionData && (
        <div className="bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5" />
          <span>Liked this post</span>
        </div>
      )}
      
      {/* Render reply indicator if this is a reply */}
      {isReply && (
        <div className="bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground flex items-center gap-1.5">
          <span>Reply to a post</span>
        </div>
      )}
      
      {/* Main Card Content */}
      <CardContent className="p-4">
        {/* Note Header */}
        <NoteCardHeader
          pubkey={event.pubkey}
          createdAt={event.created_at}
          profileData={profileData}
        />
        
        {/* Note Content */}
        <div className="mt-2">
          <NoteCardContent event={event} />
        </div>
        
        {/* Note Actions */}
        {!hideActions && (
          <div className="mt-3">
            <NoteCardActions
              note={{
                id: event.id || '',
                author: event.pubkey || '',
                content: event.content || '',
                createdAt: event.created_at || 0,
                event: event
              }}
              setActiveReply={setActiveReply}
            />
          </div>
        )}
      </CardContent>
      
      {/* Delete Dialog for current user's posts */}
      <NoteCardDeleteDialog 
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </Card>
  );
};

export default React.memo(NoteCard);
