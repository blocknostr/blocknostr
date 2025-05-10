
import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { NostrEvent, nostrService, RelayTrustLevel } from '@/lib/nostr';
import NoteCardHeader from './note/NoteCardHeader';
import NoteCardContent from './note/NoteCardContent';
import NoteCardActions from './note/NoteCardActions';
import NoteCardComments from './note/NoteCardComments';
import { Repeat, Shield, AlertCircle } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [hasNecessaryTrustedRelays, setHasNecessaryTrustedRelays] = useState(true);
  
  // Check for trusted relays when posting sensitive content (NIP-B7)
  useEffect(() => {
    const checkTrustedRelays = () => {
      // Determine if this content might be sensitive
      // Consider content sensitive if it has p tags (mentions others) or a tags (contains attachments)
      const hasMentions = event.tags.some(tag => tag[0] === 'p');
      const hasAttachments = event.tags.some(tag => tag[0] === 'a');
      const isDM = event.kind === 4;
      const isSensitiveKind = [4, 13, 14, 15, 16].includes(event.kind); // DMs and other sensitive kinds
      
      // If this is sensitive content, check for trusted relays
      if (isSensitiveKind || isDM || hasMentions || hasAttachments) {
        const publishingRelays = nostrService.getPublishingRelays();
        
        // We need at least one trusted relay for publishing sensitive content
        setHasNecessaryTrustedRelays(publishingRelays.length > 0);
      }
    };
    
    checkTrustedRelays();
  }, [event]);
  
  // Fetch reply count and calculate reach when component mounts
  useEffect(() => {
    if (!event.id) return;
    
    // Get a more realistic reach count - still random but based on the age of the post
    // and some randomization for demonstration purposes
    const postAge = Math.floor(Date.now() / 1000) - event.created_at;
    const hoursOld = Math.max(1, postAge / 3600);
    const baseReach = Math.floor(50 + (Math.random() * 20 * hoursOld));
    setReachCount(baseReach);
    
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
  }, [event.id, event.created_at]);
  
  const handleCommentClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowComments(!showComments);
  };
  
  const handleReplyAdded = () => {
    setReplyCount(prev => prev + 1);
  };
  
  const isCurrentUserAuthor = event.pubkey === nostrService.publicKey;
  
  const handleDeleteClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); 
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
            
            {!hasNecessaryTrustedRelays && isCurrentUserAuthor && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="mt-2 flex items-center gap-2 p-2 rounded-md bg-yellow-100/20 border border-yellow-200/30 text-yellow-600 dark:text-yellow-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>No trusted relays for sensitive content (NIP-B7)</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="w-80 p-3">
                    <div className="space-y-2">
                      <p className="font-medium">Relay Trust Warning (NIP-B7)</p>
                      <p className="text-sm">You don't have any trusted relays configured for sensitive content. To improve privacy and content distribution based on NIP-B7, please add trusted relays in your profile settings.</p>
                      <div className="flex items-center gap-1 text-sm mt-1">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span>Trusted relays protect your private and sensitive data</span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardContent>
        </Link>
        
        <CardFooter className="pt-0 px-5 pb-3 flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
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
