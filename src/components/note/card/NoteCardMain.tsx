import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import NoteCardHeader from '../NoteCardHeader';
import NoteCardContent from '../NoteCardContent';
import NoteCardActions from '../NoteCardActions';
import NoteCardRepostHeader from '../NoteCardRepostHeader';
import NoteCardDeleteDialog from '../NoteCardDeleteDialog';
import NoteCardComments from '../NoteCardComments';
import NoteCardRepliesSection from './NoteCardRepliesSection';
import { useNoteCardDeleteDialog } from '../hooks/useNoteCardDeleteDialog';
import { useNoteCardReplies } from '../hooks/useNoteCardReplies';
import { NostrEvent } from '@/lib/nostr';
import { extractMediaItems } from '@/lib/nostr/utils/media-extraction';
import { Note } from '@/components/notebin/hooks/types';

interface NoteCardMainProps {
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

const NoteCardMain = ({
  event,
  profileData,
  hideActions = false,
  repostData,
  isReply = false,
  reactionData
}: NoteCardMainProps) => {
  // Set up local state
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyUpdated, setReplyUpdated] = useState(0);
  const [hasMedia, setHasMedia] = useState(false);
  
  // Check for media content on mount
  useEffect(() => {
    if (event) {
      const mediaItems = extractMediaItems(event);
      setHasMedia(mediaItems.length > 0);
    }
  }, [event]);
  
  // Use the reply count hook
  const { replyCount } = useNoteCardReplies({ 
    eventId: event?.id || '' 
  });
  
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

  // Handle reply added/updated
  const handleReplyAdded = () => {
    // Close reply input and increment counter to force refresh
    setShowReplyInput(false);
    setReplyUpdated(prev => prev + 1);
  };

  // Handle reply selection
  const handleQuickReplySelected = (text: string) => {
    setReplyContent(text);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If the click is on a link, button, or accordion, don't navigate
    if ((e.target as HTMLElement).closest('a') || 
        (e.target as HTMLElement).closest('button') ||
        (e.target as HTMLElement).closest('[data-accordion-item]')) {
      return;
    }
    
    if (event?.id) {
      window.location.href = `/post/${event.id}`;
    }
  };

  return (
    <Card 
      className={`shadow-sm hover:shadow transition-shadow cursor-pointer overflow-hidden ${hasMedia ? 'has-media' : ''}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
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
              setActiveReply={() => setShowReplyInput(!showReplyInput)}
              replyCount={replyCount}
            />
          </div>
        )}
        
        {/* Comments section */}
        <NoteCardRepliesSection
          eventId={event?.id}
          pubkey={event?.pubkey}
          showReplyInput={showReplyInput}
          replyContent={replyContent}
          replyCount={replyCount}
          replyUpdated={replyUpdated}
          onReplyAdded={handleReplyAdded}
          onQuickReplySelected={handleQuickReplySelected}
        />
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

export default NoteCardMain;
