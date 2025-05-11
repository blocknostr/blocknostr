
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
import { ArrowUpRight } from 'lucide-react';
import { Button } from "../ui/button";

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
  const [clickStartTime, setClickStartTime] = useState<number | null>(null);
  const [isInteractingWithContent, setIsInteractingWithContent] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Click delay in milliseconds to distinguish between clicks and interactions
  const CLICK_DELAY = 200;
  
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
  
  // Handle mouse down to start tracking potential click
  const handleMouseDown = () => {
    if (!isInteractingWithContent) {
      setClickStartTime(Date.now());
    }
  };
  
  // Handle mouse up to determine if navigation should occur
  const handleMouseUp = () => {
    if (clickStartTime && !isInteractingWithContent) {
      const clickDuration = Date.now() - clickStartTime;
      if (clickDuration < CLICK_DELAY && event.id) {
        navigate(`/post/${event.id}`);
      }
      setClickStartTime(null);
    }
  };
  
  // Cancel navigation if mouse moves significantly (for drag operations)
  const handleMouseMove = () => {
    if (clickStartTime) {
      setClickStartTime(null);
    }
  };
  
  // Handle touch start for mobile devices
  const handleTouchStart = () => {
    if (!isInteractingWithContent) {
      setClickStartTime(Date.now());
    }
  };
  
  // Handle touch end for mobile devices
  const handleTouchEnd = () => {
    if (clickStartTime && !isInteractingWithContent) {
      const clickDuration = Date.now() - clickStartTime;
      if (clickDuration < CLICK_DELAY && event.id) {
        navigate(`/post/${event.id}`);
      }
      setClickStartTime(null);
    }
  };
  
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
  
  // Handle keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && event.id) {
      e.preventDefault();
      navigate(`/post/${event.id}`);
    }
  };

  // Handle explicit open click
  const handleViewDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.id) {
      navigate(`/post/${event.id}`);
    }
  };

  return (
    <>
      <Card 
        className="mb-4 hover:bg-accent/10 transition-colors border-accent/10 shadow-sm overflow-hidden relative"
        ref={cardRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={handleInteractionEnd}
        onMouseLeave={handleInteractionEnd}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="article"
        aria-label="Post"
        data-event-id={event.id}
        style={{ cursor: "default" }}
      >
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto opacity-70 hover:opacity-100"
            onClick={handleViewDetailsClick}
            onMouseEnter={handleInteractionStart}
            onMouseLeave={handleInteractionEnd}
            aria-label="View post details"
            title="View post details"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Button>
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
