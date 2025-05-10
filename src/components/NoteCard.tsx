
import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { NostrEvent, nostrService } from '@/lib/nostr';
import NoteCardHeader from './note/NoteCardHeader';
import NoteCardContent from './note/NoteCardContent';
import NoteCardActions from './note/NoteCardActions';
import NoteCardComments from './note/NoteCardComments';
import { Repeat } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [replyCount, setReplyCount] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reachCount, setReachCount] = useState(0);
  
  // Fetch reply count and calculate reach when component mounts
  useEffect(() => {
    if (!event.id) return;
    
    // Get a random reach count between 50 and 10000 for demonstration
    // In a real app, you would track actual impressions
    setReachCount(Math.floor(Math.random() * 9950) + 50);
    
    const fetchReplyCount = async () => {
      const subId = nostrService.subscribe(
        [{
          kinds: [1], // Regular notes (kind 1)
          "#e": [event.id || ''], // Filter by reference to this event
          limit: 100
        }],
        (replyEvent) => {
          // Check if it's actually a reply to this event
          const isReply = replyEvent.tags.some(tag => 
            tag[0] === 'e' && tag[1] === event.id && (tag[3] === 'reply' || !tag[3])
          );
          
          if (isReply) {
            setReplyCount(count => count + 1);
          }
        }
      );
      
      // Cleanup subscription after a short time
      setTimeout(() => {
        nostrService.unsubscribe(subId);
      }, 5000);
    };
    
    fetchReplyCount();
  }, [event.id]);
  
  const handleCommentClick = () => {
    setShowComments(!showComments);
  };
  
  const handleReplyAdded = () => {
    setReplyCount(prev => prev + 1);
  };
  
  const isCurrentUserAuthor = event.pubkey === nostrService.publicKey;
  
  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      
      // In Nostr, we don't actually delete posts but we can mark them as deleted
      await nostrService.publishEvent({
        kind: 5, // Deletion event
        content: "Post deleted by author",
        tags: [
          ['e', event.id || ''] // Reference to deleted event
        ]
      });
      
      setIsDeleteDialogOpen(false);
      setIsDeleting(false);
      toast.success("Post deleted successfully");
      
      // Call parent's onDelete if provided
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Card className="mb-4 hover:bg-accent/10 transition-colors border-accent/10 shadow-sm overflow-hidden">
        <Link to={`/post/${event.id}`} className="block cursor-pointer">
          {repostData && (
            <div className="px-5 pt-3 pb-1 text-xs text-muted-foreground flex items-center gap-1 bg-muted/50">
              <Repeat className="h-3 w-3" />
              <span>Reposted by </span>
              <Link 
                to={`/profile/${repostData.reposterPubkey}`} 
                className="font-medium hover:underline hover:text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                {repostData.reposterProfile?.name || repostData.reposterProfile?.display_name || "Unknown"}
              </Link>
            </div>
          )}
          
          <CardContent className="pt-5 px-5 pb-3">
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
        </Link>
        
        <CardFooter className="pt-0 px-5 pb-3 flex-wrap gap-1">
          <NoteCardActions 
            eventId={event.id || ''} 
            pubkey={event.pubkey || ''} 
            onCommentClick={handleCommentClick} 
            replyCount={replyCount}
            isAuthor={isCurrentUserAuthor}
            onDelete={handleDeleteClick}
          />
        </CardFooter>
        
        {showComments && (
          <div className="bg-muted/30 animate-fade-in">
            <NoteCardComments
              eventId={event.id || ''}
              pubkey={event.pubkey || ''}
              onReplyAdded={handleReplyAdded}
            />
          </div>
        )}
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post from the network.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default NoteCard;
