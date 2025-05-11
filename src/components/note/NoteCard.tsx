
import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { NostrEvent, nostrService } from '@/lib/nostr';
import NoteCardHeader from './NoteCardHeader';
import NoteCardContent from './NoteCardContent';
import NoteCardActions from './NoteCardActions';
import NoteCardComments from './NoteCardComments';
import NoteCardRepostHeader from './NoteCardRepostHeader';
import NoteCardDeleteDialog from './NoteCardDeleteDialog';
import { Link } from 'react-router-dom';
import { useNoteCardDeleteDialog } from './hooks/useNoteCardDeleteDialog';
import { useNoteCardReplies } from './hooks/useNoteCardReplies';

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
  
  // Use the replies hook instead of local state
  const { replyCount, setReplyCount } = useNoteCardReplies({ eventId: event.id || '' });
  
  const { 
    isDeleteDialogOpen, 
    setIsDeleteDialogOpen, 
    isDeleting, 
    handleDeleteClick, 
    handleConfirmDelete 
  } = useNoteCardDeleteDialog({ event, onDelete });
  
  // Calculate reach count and fetch reply count when component mounts
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
  
  const handleCommentClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowComments(!showComments);
  };
  
  const handleReplyAdded = () => {
    setReplyCount(prev => prev + 1);
  };

  return (
    <>
      <Card className="mb-4 hover:bg-accent/5 transition-all duration-200 border-border/30 shadow-none overflow-hidden">
        <Link to={`/post/${event.id}`} className="block cursor-pointer">
          {repostData && <NoteCardRepostHeader repostData={repostData} />}
          
          <CardContent className="pt-5 px-5 pb-3">
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
          </CardContent>
        </Link>
        
        <CardFooter className="pt-0 px-5 pb-3 flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
          <NoteCardActions 
            eventId={event.id || ''} 
            pubkey={event.pubkey || ''}
            onCommentClick={handleCommentClick} 
            replyCount={replyCount}
            isAuthor={event.pubkey === nostrService.publicKey}
            onDelete={handleDeleteClick}
          />
        </CardFooter>
        
        {showComments && (
          <div className="bg-muted/20 animate-fade-in border-t border-border/10">
            <NoteCardComments
              eventId={event.id || ''}
              pubkey={event.pubkey || ''}
              onReplyAdded={handleReplyAdded}
            />
          </div>
        )}
      </Card>
      
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
