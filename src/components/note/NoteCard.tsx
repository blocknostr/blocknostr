
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { NostrEvent, nostrService } from '@/lib/nostr';
import NoteCardHeader from './NoteCardHeader';
import NoteCardContent from './NoteCardContent';
import NoteCardActions from './NoteCardActions';
import NoteCardComments from './NoteCardComments';
import NoteCardRepostHeader from './NoteCardRepostHeader';
import NoteCardDeleteDialog from './NoteCardDeleteDialog';
import { useNavigate } from 'react-router-dom';
import { useNoteCardDeleteDialog } from './hooks/useNoteCardDeleteDialog';
import { useNoteCardReplies } from './hooks/useNoteCardReplies';
import { MoreHorizontal } from 'lucide-react';
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [reachCount, setReachCount] = useState(0);
  const [isInteractingWithContent, setIsInteractingWithContent] = useState(false);
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
  
  // Navigation functions moved to dropdown menu actions
  const handleViewDetails = () => {
    if (event.id) {
      navigate(`/post/${event.id}`);
    }
  };
  
  const handleCopyLink = () => {
    if (event.id) {
      // Create a full URL to the post
      const url = `${window.location.origin}/post/${event.id}`;
      navigator.clipboard.writeText(url)
        .then(() => {
          // Show success notification (you might want to use a toast here)
          console.log('Link copied to clipboard');
        })
        .catch(err => {
          console.error('Failed to copy link:', err);
        });
    }
  };

  return (
    <>
      <Card 
        className="mb-4 hover:bg-accent/10 transition-colors border-accent/10 shadow-sm overflow-hidden relative"
        ref={cardRef}
        role="article"
        aria-label="Post"
        data-event-id={event.id}
      >
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto rounded-full hover:bg-accent/50"
                onMouseEnter={handleInteractionStart}
                onMouseLeave={handleInteractionEnd}
                aria-label="Post options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleViewDetails}>
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                Copy link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {event.pubkey === nostrService.publicKey && (
                <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive focus:text-destructive">
                  Delete post
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {repostData && <NoteCardRepostHeader repostData={repostData} />}
        
        <CardContent 
          className="pt-5 px-5 pb-3"
        >
          <div onMouseEnter={handleInteractionStart} onMouseLeave={handleInteractionEnd}>
            <NoteCardHeader 
              pubkey={event.pubkey || ''} 
              createdAt={event.created_at} 
              profileData={profileData} 
            />
          </div>
          <NoteCardContent 
            content={event.content} 
            reachCount={reachCount}
            tags={event.tags} 
          />
        </CardContent>
        
        <CardFooter 
          className="pt-0 px-5 pb-3 flex-wrap gap-1" 
          onMouseEnter={handleInteractionStart} 
          onMouseLeave={handleInteractionEnd}
        >
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
          <div 
            className="bg-muted/30 animate-fade-in" 
            onMouseEnter={handleInteractionStart} 
            onMouseLeave={handleInteractionEnd}
          >
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
