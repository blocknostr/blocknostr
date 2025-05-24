
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nostrService, NostrEvent } from "@/lib/nostr";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export interface Comment {
  id: string;
  proposalId: string;
  content: string;
  creator: string;
  createdAt: number;
}

interface ProposalCommentsProps {
  proposalId: string;
  communityId: string;
}

const ProposalComments = ({ proposalId, communityId }: ProposalCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  
  const currentUserPubkey = nostrService.publicKey;
  
  // Load comments when component mounts
  useEffect(() => {
    const loadComments = async () => {
      await nostrService.connectToUserRelays();
      
      const commentsSubId = nostrService.subscribe(
        [
          {
            kinds: [34553], // Comment kind
            '#e': [proposalId], // Filter by proposal ID
            limit: 50
          }
        ],
        handleCommentEvent
      );
      
      return () => {
        nostrService.unsubscribe(commentsSubId);
      };
    };
    
    loadComments();
    setTimeout(() => setLoadingComments(false), 2000);
  }, [proposalId]);
  
  const handleCommentEvent = (event: NostrEvent) => {
    try {
      if (!event.id) return;
      
      // Find the proposal reference tag
      const proposalTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e');
      if (!proposalTag || proposalTag[1] !== proposalId) return;
      
      const comment: Comment = {
        id: event.id,
        proposalId: proposalTag[1],
        content: event.content,
        creator: event.pubkey || '',
        createdAt: event.created_at
      };
      
      setComments(prev => {
        // Check if we already have this comment
        if (prev.some(c => c.id === comment.id)) {
          return prev;
        }
        
        // Add new comment
        return [...prev, comment].sort((a, b) => b.createdAt - a.createdAt);
      });
    } catch (e) {
      console.error("Error processing comment event:", e);
    }
  };
  
  const handleSubmitComment = async () => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to comment");
      return;
    }
    
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create comment event
      const event = {
        kind: 34553, // Comment kind
        content: newComment.trim(),
        tags: [
          ['e', proposalId], // Reference to proposal
          ['e', communityId, 'root'] // Reference to community as root
        ]
      };
      
      const commentId = await nostrService.publishEvent(event);
      
      if (commentId) {
        setNewComment("");
        toast.success("Comment added");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatTime = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
  };
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm">Comments</h3>
      
      {currentUserPubkey && (
        <div className="space-y-2">
          <Textarea 
            placeholder="Add your comment..." 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button 
              size="sm" 
              onClick={handleSubmitComment}
              disabled={isSubmitting || !newComment.trim()}
            >
              Post Comment
            </Button>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {loadingComments && comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar className="h-6 w-6">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${comment.creator.substring(0, 8)}`} />
                <AvatarFallback>{comment.creator.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1">
                <div className="flex items-center">
                  <span className="text-xs font-medium">
                    {nostrService.getNpubFromHex(comment.creator).substring(0, 8)}...
                  </span>
                  <span className="mx-1.5 text-muted-foreground text-xs">•</span>
                  <span className="text-xs text-muted-foreground">{formatTime(comment.createdAt)}</span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProposalComments;
