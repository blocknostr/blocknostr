
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import NoteCardHeader from '../NoteCardHeader';
import NoteCardContent from '../NoteCardContent';
import NoteCardActions from '../NoteCardActions';
import NoteCardRepostHeader from '../NoteCardRepostHeader';
import NoteCardDeleteDialog from '../NoteCardDeleteDialog';
import NoteCardComments from '../NoteCardComments';
import QuickReplies from '@/components/post/QuickReplies';
import { useNoteCardDeleteDialog } from '../hooks/useNoteCardDeleteDialog';
import { useNoteCardReplies } from '../hooks/useNoteCardReplies';
import { NostrEvent, nostrService } from '@/lib/nostr';
import { Heart } from 'lucide-react';

// Import components
import RenderReplySection from './RenderReplySection';
import RenderRepliesAccordion from './RenderRepliesAccordion';
import RenderIndicators from './RenderIndicators';

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

const NoteCardStructure = ({
  event,
  profileData,
  hideActions = false,
  repostData,
  isReply = false,
  reactionData
}: NoteCardProps) => {
  // Set up local state
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyUpdated, setReplyUpdated] = useState(0);
  
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

  const isCurrentUser = event.pubkey === nostrService.publicKey;

  // Handle reply selection from QuickReplies
  const handleQuickReplySelected = (text: string) => {
    setReplyContent(text);
  };

  // Handle reply added/updated
  const handleReplyAdded = () => {
    // Close reply input and increment counter to force refresh
    setShowReplyInput(false);
    setReplyUpdated(prev => prev + 1);
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
    <Card className="mb-4 border shadow-sm hover:shadow transition-shadow cursor-pointer overflow-hidden" 
          onClick={handleCardClick}>
      
      {/* Render indicators (repost header, reaction header, reply indicator) */}
      <RenderIndicators 
        repostData={repostData} 
        reactionData={reactionData} 
        isReply={isReply} 
      />
      
      {/* Main Card Content */}
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
        
        {/* Replies Accordion */}
        <RenderRepliesAccordion 
          eventId={event?.id} 
          replyCount={replyCount} 
          replyUpdated={replyUpdated}
          pubkey={event?.pubkey}
          onReplyAdded={handleReplyAdded}
        />
        
        {/* Quick Reply Section */}
        <RenderReplySection 
          showReplyInput={showReplyInput}
          eventId={event?.id || ''}
          pubkey={event?.pubkey || ''}
          replyContent={replyContent}
          onReplyAdded={handleReplyAdded}
          onReplySelected={handleQuickReplySelected}
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

export default NoteCardStructure;
