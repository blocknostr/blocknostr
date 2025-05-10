
import { useState } from 'react';
import { nostrService, NostrEvent } from '@/lib/nostr';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2 } from 'lucide-react';
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

interface Comment {
  id?: string;
  content: string;
  author: string;
  created_at: number;
}

interface NoteCardCommentsProps {
  eventId: string;
  pubkey: string;
  initialComments?: Comment[];
  onReplyAdded: () => void;
}

const NoteCardComments = ({ eventId, pubkey, initialComments = [], onReplyAdded }: NoteCardCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [replyToDelete, setReplyToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      // Create a reply event
      const replyEvent = await nostrService.publishEvent({
        kind: 1, // Note kind
        content: newComment,
        tags: [
          ['e', eventId || '', '', 'reply'], // Reference to parent with reply marker
          ['p', pubkey || ''] // Original author
        ]
      });
      
      // Add to local state
      const newCommentObj = { 
        id: replyEvent,
        content: newComment, 
        author: nostrService.publicKey || '',
        created_at: Math.floor(Date.now() / 1000)
      };
      
      setComments(prev => [...prev, newCommentObj]);
      setNewComment("");
      onReplyAdded();
      toast.success("Comment posted");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    }
  };
  
  const handleDeleteClick = (commentId: string | undefined) => {
    if (commentId) {
      setReplyToDelete(commentId);
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!replyToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // In Nostr, we don't actually delete comments but we can mark them as deleted
      await nostrService.publishEvent({
        kind: 5, // Deletion event
        content: "Reply deleted by author",
        tags: [
          ['e', replyToDelete] // Reference to deleted event
        ]
      });
      
      // Remove from local state
      setComments(prev => prev.filter(comment => comment.id !== replyToDelete));
      
      setReplyToDelete(null);
      setIsDeleting(false);
      toast.success("Reply deleted successfully");
    } catch (error) {
      console.error("Error deleting reply:", error);
      toast.error("Failed to delete reply");
      setIsDeleting(false);
      setReplyToDelete(null);
    }
  };

  return (
    <>
      <div className="px-4 pb-4 pt-2 border-t">
        <div className="mb-4 space-y-4">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment, index) => (
              <div key={index} className="flex items-start gap-2 group">
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="bg-muted p-2 rounded-md text-sm flex-1">
                  <p className="whitespace-pre-wrap break-words">{comment.content}</p>
                </div>
                {comment.author === nostrService.publicKey && comment.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteClick(comment.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
        {nostrService.publicKey && (
          <div className="flex gap-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
            />
            <Button 
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              className="self-end"
            >
              Post
            </Button>
          </div>
        )}
      </div>
      
      <AlertDialog open={!!replyToDelete} onOpenChange={(open) => !open && setReplyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reply</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your reply from the network.
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

export default NoteCardComments;
