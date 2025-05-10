
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { nostrService } from '@/lib/nostr';

interface CommentFormProps {
  eventId: string;
  pubkey: string;
  onCommentAdded: (commentId: string, content: string) => void;
}

const CommentForm = ({ eventId, pubkey, onCommentAdded }: CommentFormProps) => {
  const [newComment, setNewComment] = useState("");
  
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
      
      onCommentAdded(replyEvent, newComment);
      setNewComment("");
      toast.success("Comment posted");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    }
  };

  return (
    <div className="flex gap-2 mb-4">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
      <div className="flex-1 flex flex-col gap-2">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] resize-none"
        />
        <Button 
          onClick={handleSubmitComment}
          disabled={!newComment.trim()}
          className="self-end"
          size="sm"
        >
          Reply
        </Button>
      </div>
    </div>
  );
};

export default CommentForm;
