
import React, { useState, useCallback } from 'react';
import { CardContent } from "@/components/ui/card";
import NoteCardHeader from '../NoteCardHeader';
import NoteCardContent from '../NoteCardContent';
import NoteCardActions from '../NoteCardActions';
import NoteCardDeleteDialog from '../NoteCardDeleteDialog';
import QuickReplies from '@/components/post/QuickReplies';
import { useNoteCardDeleteDialog } from '../hooks/useNoteCardDeleteDialog';
import { NostrEvent, nostrService } from '@/lib/nostr';
import RenderIndicators from './RenderIndicators';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import NoteCardComments from '../NoteCardComments';

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
  // Local state
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyCount, setReplyCount] = useState(0);
  const [replyUpdated, setReplyUpdated] = useState(0);
  
  // Delete dialog state
  const {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeleting,
    handleDeleteClick,
    handleConfirmDelete
  } = useNoteCardDeleteDialog({ event });

  // User checking
  const isCurrentUser = event.pubkey === nostrService.publicKey;

  // Memoized handlers
  const handleReplyAdded = useCallback(() => {
    setShowReplyInput(false);
    setReplyUpdated(prev => prev + 1);
    setReplyCount(prev => prev + 1);
  }, []);

  const handleQuickReplySelected = useCallback((text: string) => {
    setReplyContent(text);
  }, []);

  const handleSetReplyCount = useCallback((count: number) => {
    setReplyCount(count);
  }, []);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // If the click is on a link, button, or accordion, don't navigate
    if ((e.target as HTMLElement).closest('a') || 
        (e.target as HTMLElement).closest('button') ||
        (e.target as HTMLElement).closest('[data-accordion-item]')) {
      return;
    }
    
    if (event?.id) {
      window.location.href = `/post/${event.id}`;
    }
  }, [event?.id]);
  
  return (
    <div 
      className="mb-4 rounded-lg border shadow-sm hover:shadow transition-shadow cursor-pointer overflow-hidden" 
      onClick={handleCardClick}
    >
      {/* Indicators (repost, reaction, reply) */}
      <RenderIndicators 
        repostData={repostData} 
        reactionData={reactionData} 
        isReply={isReply} 
      />
      
      {/* Main content */}
      <CardContent className="p-4">
        {/* Header */}
        <NoteCardHeader
          pubkey={event?.pubkey || ''}
          createdAt={event?.created_at || 0}
          profileData={profileData}
        />
        
        {/* Content */}
        <NoteCardContent 
          content={event?.content || ''}
          tags={Array.isArray(event?.tags) ? event?.tags : []}
          event={event}
        />
        
        {/* Actions */}
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
              onReplyCountUpdate={handleSetReplyCount}
            />
          </div>
        )}
        
        {/* Replies accordion (only show if replies exist) */}
        {replyCount > 0 && event?.id && (
          <Accordion type="single" collapsible className="mt-2">
            <AccordionItem value="replies" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-normal text-muted-foreground">
                {replyCount === 1 ? '1 reply' : `${replyCount} replies`}
              </AccordionTrigger>
              <AccordionContent>
                <NoteCardComments 
                  eventId={event.id} 
                  pubkey={event.pubkey || ''} 
                  replyUpdated={replyUpdated} 
                  onReplyAdded={handleReplyAdded}
                  onReplyCountUpdate={handleSetReplyCount}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        
        {/* Reply input (only show when reply button is clicked) */}
        {showReplyInput && event?.id && (
          <div className="mt-3 pt-3 border-t border-border">
            <QuickReplies
              eventId={event.id}
              pubkey={event.pubkey || ''}
              content={replyContent}
              onReplyAdded={handleReplyAdded}
              onSelected={handleQuickReplySelected}
            />
          </div>
        )}
      </CardContent>
      
      {/* Delete dialog */}
      <NoteCardDeleteDialog 
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default React.memo(NoteCardStructure);
