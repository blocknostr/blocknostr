
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import NoteCardHeader from './NoteCardHeader';
import NoteCardContent from './NoteCardContent';
import NoteCardActions from './NoteCardActions';
import NoteCardRepostHeader from './NoteCardRepostHeader';
import NoteCardDeleteDialog from './NoteCardDeleteDialog';
import NoteCardComments from './NoteCardComments';
import QuickReplies from '@/components/post/QuickReplies';
import { useNoteCardDeleteDialog } from './hooks/useNoteCardDeleteDialog';
import { useNoteCardReplies } from './hooks/useNoteCardReplies';
import { NostrEvent, nostrService } from '@/lib/nostr';
import { Heart } from 'lucide-react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";

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

const NoteCard = ({
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

  // Ensure we have a valid event
  if (!event) {
    return null;
  }

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
  
  // Build card component with all the variations
  return (
    <Card className="shadow-sm hover:shadow transition-shadow cursor-pointer overflow-hidden" 
          onClick={handleCardClick}>
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
          pubkey={event?.pubkey || ''}
          createdAt={event?.created_at || 0}
          profileData={profileData}
        />
        
        {/* Note Content - Use the unified NoteCardContent component */}
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
        
        {/* Reply Accordion */}
        {event?.id && replyCount > 0 && (
          <Accordion type="single" collapsible className="mt-2 border-t pt-2">
            <AccordionItem value="replies" className="border-none">
              <AccordionTrigger className="py-1 text-xs text-muted-foreground hover:no-underline">
                {replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}
              </AccordionTrigger>
              <AccordionContent>
                <NoteCardComments 
                  eventId={event.id} 
                  pubkey={event.pubkey}
                  onReplyAdded={handleReplyAdded}
                  key={`comments-${replyUpdated}`}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        
        {/* Quick Reply Section */}
        {showReplyInput && event?.id && (
          <div className="mt-3 border-t pt-3">
            <NoteCardComments 
              eventId={event.id} 
              pubkey={event.pubkey}
              initialCommentText={replyContent}
              onReplyAdded={handleReplyAdded}
            />
            
            {/* Quick Replies */}
            <div className="mt-2 pb-1">
              <QuickReplies onReplySelected={handleQuickReplySelected} />
            </div>
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
