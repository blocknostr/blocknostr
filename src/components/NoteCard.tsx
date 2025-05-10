
import { useState } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { NostrEvent, nostrService } from '@/lib/nostr';
import NoteCardHeader from './note/NoteCardHeader';
import NoteCardContent from './note/NoteCardContent';
import NoteCardActions from './note/NoteCardActions';
import NoteCardComments from './note/NoteCardComments';
import { Link } from 'react-router-dom';
import RepostHeader from './note/RepostHeader';
import DeleteNoteDialog from './note/DeleteNoteDialog';
import { useNoteReachCount } from '@/hooks/useNoteReachCount';
import { useNoteReplies } from '@/hooks/useNoteReplies';

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { reachCount } = useNoteReachCount(event.created_at);
  const { replyCount, handleReplyAdded } = useNoteReplies(event.id || '');
  
  const handleCommentClick = () => {
    setShowComments(!showComments);
  };
  
  const isCurrentUserAuthor = event.pubkey === nostrService.publicKey;
  
  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleCardClick = () => {
    window.location.href = `/post/${event.id}`;
  };

  return (
    <>
      <Card className="mb-4 hover:bg-accent/5 transition-colors border-accent/10 shadow-sm overflow-hidden">
        <div 
          onClick={handleCardClick}
          className="cursor-pointer"
        >
          {repostData && (
            <RepostHeader 
              reposterPubkey={repostData.reposterPubkey}
              reposterProfile={repostData.reposterProfile}
            />
          )}
          
          <CardContent className="pt-5 px-5 pb-2">
            <NoteCardHeader 
              pubkey={event.pubkey || ''} 
              createdAt={event.created_at} 
              profileData={profileData} 
            />
            <NoteCardContent 
              content={event.content} 
              reachCount={reachCount}
            />
          </CardContent>
        </div>
        
        <CardFooter className="pt-0 px-5 pb-2">
          <NoteCardActions 
            eventId={event.id || ''} 
            pubkey={event.pubkey || ''} 
            onCommentClick={handleCommentClick} 
            replyCount={replyCount}
            isAuthor={isCurrentUserAuthor}
            onDelete={handleDeleteClick}
            reachCount={reachCount}
          />
        </CardFooter>
        
        {showComments && (
          <NoteCardComments
            eventId={event.id || ''}
            pubkey={event.pubkey || ''}
            onReplyAdded={handleReplyAdded}
          />
        )}
      </Card>
      
      <DeleteNoteDialog
        isOpen={isDeleteDialogOpen}
        eventId={event.id || ''}
        onOpenChange={setIsDeleteDialogOpen}
        onDeleteSuccess={onDelete}
      />
    </>
  );
};

export default NoteCard;
