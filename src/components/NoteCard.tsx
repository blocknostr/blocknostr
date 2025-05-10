
import { useState } from 'react';
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
      <Card className="mb-4 hover:bg-accent/20 transition-colors">
        {repostData && (
          <div className="px-4 pt-2 text-xs text-muted-foreground flex items-center gap-1">
            <Repeat className="h-3 w-3" />
            <span>Reposted by </span>
            <Link 
              to={`/profile/${repostData.reposterPubkey}`} 
              className="font-medium hover:underline"
            >
              {repostData.reposterProfile?.name || repostData.reposterProfile?.display_name || "Unknown"}
            </Link>
          </div>
        )}
        <CardContent className="pt-4">
          <NoteCardHeader 
            pubkey={event.pubkey || ''} 
            createdAt={event.created_at} 
            profileData={profileData} 
          />
          <NoteCardContent content={event.content} />
        </CardContent>
        
        <CardFooter>
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
          <NoteCardComments
            eventId={event.id || ''}
            pubkey={event.pubkey || ''}
            onReplyAdded={handleReplyAdded}
          />
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
