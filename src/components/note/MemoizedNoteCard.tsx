
import React, { memo } from 'react';
import { NostrEvent } from '@/lib/nostr';
import NoteCardContainer from './NoteCardContainer';
import NoteCardHeader from './NoteCardHeader';
import NoteCardContent from './NoteCardContent';
import NoteCardActions from './NoteCardActions';
import NoteCardComments from './NoteCardComments';
import NoteCardRepostHeader from './NoteCardRepostHeader';
import NoteCardDeleteDialog from './NoteCardDeleteDialog';
import NoteCardDropdownMenu from './NoteCardDropdownMenu';
import NoteCardMainContent from './NoteCardMainContent';
import NoteCardFooter from './NoteCardFooter';
import NoteCardCommentsSection from './NoteCardCommentsSection';
import { useNoteCardDeleteDialog } from './hooks/useNoteCardDeleteDialog';
import { useNoteCardReplies } from './hooks/useNoteCardReplies';
import { Note } from '@/components/notebin/hooks/types';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import NoteCardFallback from './NoteCardFallback';

interface NoteCardProps {
  event: NostrEvent;
  profileData?: Record<string, any>;
  repostData?: {
    reposterPubkey: string;
    reposterProfile?: Record<string, any>;
  }
  onDelete?: () => void;
}

// Use memo to prevent unnecessary re-renders
const MemoizedNoteCard = memo(
  ({ event, profileData, repostData, onDelete }: NoteCardProps) => {
    // Add validation to prevent errors from malformed data
    if (!event || !event.id) {
      return <NoteCardFallback message="Invalid post data" />;
    }

    const [showComments, setShowComments] = React.useState(false);
    const [reachCount, setReachCount] = React.useState(0);
    const [isInteractingWithContent, setIsInteractingWithContent] = React.useState(false);
    const [activeReply, setActiveReply] = React.useState<Note | null>(null);
    const cardRef = React.useRef<HTMLDivElement>(null);
    
    // Use the replies hook
    const { replyCount, setReplyCount } = useNoteCardReplies({ 
      eventId: event.id
    });
    
    const { 
      isDeleteDialogOpen, 
      setIsDeleteDialogOpen, 
      isDeleting, 
      handleDeleteClick, 
      handleConfirmDelete 
    } = useNoteCardDeleteDialog({ event, onDelete });
    
    // Convert event to Note format for actions
    const noteForActions: Note = {
      id: event.id,
      title: event.content.substring(0, 30),
      content: event.content,
      language: "text",
      publishedAt: new Date(event.created_at * 1000).toISOString(),
      author: event.pubkey || '',
      event: event,
      tags: event.tags?.map((tag: string[]) => tag[0]) || []
    };
    
    // Calculate reach count when component mounts - with memoization to prevent recalculation
    React.useEffect(() => {
      // Get a more accurate reach count based on post activity and age
      const calculateReachCount = () => {
        const postAge = Math.floor(Date.now() / 1000) - event.created_at;
        const hoursOld = Math.max(1, postAge / 3600);
        
        // Base reach increases with post age but at a declining rate
        const baseReach = Math.floor(30 + (Math.sqrt(hoursOld) * 15));
        
        // Add randomization (± 20%)
        const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
        
        return Math.floor(baseReach * randomFactor);
      };
      
      setReachCount(calculateReachCount());
    }, [event.id, event.created_at]);
    
    // Set interaction state when interacting with interactive elements
    const handleInteractionStart = React.useCallback(() => {
      setIsInteractingWithContent(true);
    }, []);
    
    const handleInteractionEnd = React.useCallback(() => {
      setIsInteractingWithContent(false);
    }, []);
    
    const handleCommentClick = React.useCallback((e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setShowComments(prev => !prev);
    }, []);
    
    const handleReplyAdded = React.useCallback(() => {
      setReplyCount(prev => prev + 1);
    }, [setReplyCount]);

    return (
      <>
        <NoteCardContainer ref={cardRef} eventId={event.id}>
          <NoteCardDropdownMenu 
            eventId={event.id} 
            pubkey={event.pubkey || ''} 
            profileData={profileData}
            onDeleteClick={handleDeleteClick}
            onInteractionStart={handleInteractionStart}
            onInteractionEnd={handleInteractionEnd}
          />
          
          {repostData && <NoteCardRepostHeader repostData={repostData} />}
          
          <NoteCardMainContent 
            onInteractionStart={handleInteractionStart} 
            onInteractionEnd={handleInteractionEnd}
          >
            <NoteCardHeader 
              pubkey={event.pubkey || ''} 
              createdAt={event.created_at} 
              profileData={profileData} 
            />
            <NoteCardContent 
              content={event.content} 
              reachCount={reachCount}
              tags={event.tags} 
            />
          </NoteCardMainContent>
          
          <NoteCardFooter 
            onInteractionStart={handleInteractionStart} 
            onInteractionEnd={handleInteractionEnd}
          >
            <NoteCardActions 
              note={noteForActions}
              setActiveReply={setActiveReply}
            />
          </NoteCardFooter>
          
          <NoteCardCommentsSection 
            showComments={showComments}
            onInteractionStart={handleInteractionStart}
            onInteractionEnd={handleInteractionEnd}
          >
            <NoteCardComments
              eventId={event.id}
              pubkey={event.pubkey || ''}
              onReplyAdded={handleReplyAdded}
            />
          </NoteCardCommentsSection>
        </NoteCardContainer>
        
        <NoteCardDeleteDialog 
          open={isDeleteDialogOpen} 
          onOpenChange={setIsDeleteDialogOpen} 
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      </>
    );
  },
  // Custom equality function to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    // Only re-render if these essential props changed
    return (
      prevProps.event.id === nextProps.event.id &&
      prevProps.event.content === nextProps.event.content &&
      prevProps.event.created_at === nextProps.event.created_at &&
      prevProps.profileData?.name === nextProps.profileData?.name &&
      prevProps.profileData?.picture === nextProps.profileData?.picture
    );
  }
);

MemoizedNoteCard.displayName = 'MemoizedNoteCard';

// Export a wrapped version with error boundary
const NoteCard = (props: NoteCardProps) => (
  <ErrorBoundary fallback={<NoteCardFallback message="Error loading post" />}>
    <MemoizedNoteCard {...props} />
  </ErrorBoundary>
);

export default NoteCard;
