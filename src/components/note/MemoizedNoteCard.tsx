
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CardContent } from "@/components/ui/card";
import NoteCardHeader from './NoteCardHeader';
import NoteCardContent from './NoteCardContent';
import NoteCardActions from './NoteCardActions';
import NoteCardRepostHeader from './NoteCardRepostHeader';
import NoteCardDeleteDialog from './NoteCardDeleteDialog';
import { useNoteCardDeleteDialog } from './hooks/useNoteCardDeleteDialog';
import { NostrEvent, nostrService } from '@/lib/nostr';
import { Heart } from 'lucide-react';
import NoteCardContainer from './NoteCardContainer';

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
  feedVariant?: "virtualized" | "standard";
}

const NoteCard = ({
  event,
  profileData,
  hideActions = false,
  repostData,
  isReply = false,
  reactionData,
  feedVariant = "standard"
}: NoteCardProps) => {
  // Set up local state with the correct type
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

  // Ensure we have a valid event
  if (!event) {
    return null;
  }

  const isCurrentUser = event.pubkey === nostrService.publicKey;

  const handleCardClick = (e: React.MouseEvent) => {
    // If the click is on a link or button, don't navigate
    if ((e.target as HTMLElement).closest('a') || 
        (e.target as HTMLElement).closest('button')) {
      return;
    }
    
    if (event?.id) {
      window.location.href = `/post/${event.id}`;
    }
  };
  
  // Build card component with all the variations
  return (
    <NoteCardContainer 
      eventId={event.id} 
      className="hover:shadow transition-shadow cursor-pointer" 
      onClick={handleCardClick}
      feedVariant={feedVariant}
    >
      {/* Render repost header if this is a repost */}
      {repostData && (
        <NoteCardRepostHeader
          reposterPubkey={repostData.reposterPubkey}
          reposterProfile={repostData.reposterProfile}
        />
      )}
      
      {/* Render reaction header if this is a reaction */}
      {reactionData && (
        <div className="bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
          <Heart className="h-3 w-3" />
          <span>Liked this post</span>
        </div>
      )}
      
      {/* Render reply indicator if this is a reply */}
      {isReply && (
        <div className="bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
          <span>Reply to a post</span>
        </div>
      )}
      
      {/* Main Card Content */}
      <CardContent className={`p-4 ${feedVariant === "virtualized" ? "pb-3" : "pb-4"}`}>
        {/* Note Header */}
        <NoteCardHeader
          pubkey={event?.pubkey || ''}
          createdAt={event?.created_at || 0}
          profileData={profileData}
        />
        
        {/* Note Content */}
        <div className="mt-2">
          <NoteCardContent 
            content={event?.content || ''}
            tags={Array.isArray(event?.tags) ? event?.tags : []}
            event={event}
          />
        </div>
        
        {/* Note Actions */}
        {!hideActions && (
          <div className="mt-3">
            <NoteCardActions
              note={{
                id: event?.id || '',
                author: event?.pubkey || '',
                content: event?.content || '',
                createdAt: event?.created_at || 0,
                event: event
              }}
              setActiveReply={(note) => setActiveReply(note)}
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
    </NoteCardContainer>
  );
};

export default React.memo(NoteCard);
