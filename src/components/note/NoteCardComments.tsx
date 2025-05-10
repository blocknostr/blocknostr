
import { useState } from 'react';
import { nostrService } from '@/lib/nostr';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Comment {
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
  
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      // Create a reply event
      await nostrService.publishEvent({
        kind: 1, // Note kind
        content: newComment,
        tags: [
          ['e', eventId || '', '', 'reply'], // Reference to parent with reply marker
          ['p', pubkey || ''] // Original author
        ]
      });
      
      // Add to local state
      const newCommentObj = { 
        content: newComment, 
        author: nostrService.publicKey,
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

  return (
    <div className="px-4 pb-4 pt-2 border-t">
      <div className="mb-4 space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment, index) => (
            <div key={index} className="flex items-start gap-2">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="bg-muted p-2 rounded-md text-sm flex-1">
                <p className="whitespace-pre-wrap break-words">{comment.content}</p>
              </div>
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
  );
};

export default NoteCardComments;
