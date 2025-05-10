
import { useState } from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { toast } from "sonner";

interface NoteCommentSectionProps {
  event: NostrEvent;
  comments: any[];
  onAddComment: (comment: any) => void;
}

const NoteCommentSection = ({ event, comments, onAddComment }: NoteCommentSectionProps) => {
  const [newComment, setNewComment] = useState("");

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      // Create a reply event
      await nostrService.publishEvent({
        kind: 1, // Note kind
        content: newComment,
        tags: [
          ['e', event.id || '', '', 'reply'], // Reference to parent with reply marker
          ['p', event.pubkey || ''] // Original author
        ]
      });
      
      // Add to local state
      onAddComment({
        content: newComment, 
        author: nostrService.publicKey,
        created_at: Math.floor(Date.now() / 1000)
      });
      
      setNewComment("");
      toast.success("Reply posted");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post reply");
    }
  };

  return (
    <div className="pt-3">
      <div className="mb-4 space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No replies yet. Be the first to reply!</p>
        ) : (
          comments.map((comment, index) => (
            <div key={index} className="flex items-start gap-2">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="bg-muted/50 p-2 rounded-md text-sm flex-1">
                <p className="whitespace-pre-wrap break-words">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
      {nostrService.publicKey && (
        <div className="flex gap-2">
          <Textarea
            placeholder="Post your reply"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <Button 
            onClick={handleSubmitComment}
            disabled={!newComment.trim()}
            className="self-end rounded-full"
          >
            Reply
          </Button>
        </div>
      )}
    </div>
  );
};

export default NoteCommentSection;
