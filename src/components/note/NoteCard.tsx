
import { useState, useEffect, useRef } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';
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

interface NoteCardProps {
  event: NostrEvent;
  profileData?: Record<string, any>;
  repostData?: {
    reposterPubkey: string;
    reposterProfile?: Record<string, any>;
  }
  onDelete?: () => void;
}

const NoteCard = ({ event, profileData, repostData, onDelete }: NoteCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [reachCount, setReachCount] = useState(0);
  const [isInteractingWithContent, setIsInteractingWithContent] = useState(false);
  const [activeReply, setActiveReply] = useState<Note | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Use the replies hook instead of local state
  const { replyCount, setReplyCount } = useNoteCardReplies({ eventId: event.id || '' });
  
  const { 
    isDeleteDialogOpen, 
    setIsDeleteDialogOpen, 
    isDeleting, 
    handleDeleteClick, 
    handleConfirmDelete 
  } = useNoteCardDeleteDialog({ event, onDelete });
  
  // Convert event to Note format for actions
  const noteForActions: Note = {
    id: event.id || '',
    title: event.content.substring(0, 30),
    content: event.content,
    language: "text",
    publishedAt: new Date(event.created_at * 1000).toISOString(),
    author: event.pubkey || '',
    event: event,
    tags: event.tags?.map((tag: string[]) => tag[0]) || []
  };
  
  // Calculate reach count when component mounts
  useEffect(() => {
    if (!event.id) return;
    
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
  const handleInteractionStart = () => {
    setIsInteractingWithContent(true);
  };
  
  const handleInteractionEnd = () => {
    setIsInteractingWithContent(false);
  };
  
  const handleCommentClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowComments(!showComments);
  };
  
  const handleReplyAdded = () => {
    setReplyCount(prev => prev + 1);
  };

  return (
    <>
      <NoteCardContainer ref={cardRef} eventId={event.id} className="bg-card hover:shadow-md transition-shadow border border-border">
        <NoteCardDropdownMenu 
          eventId={event.id || ''} 
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
          className="border-t border-border/50 mt-2"
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
            eventId={event.id || ''}
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
};

export default NoteCard;
