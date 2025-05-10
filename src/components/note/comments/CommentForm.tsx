
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from 'lucide-react';
import { toast } from "sonner";
import { nostrService } from '@/lib/nostr';

interface CommentFormProps {
  eventId: string;
  pubkey: string;
  onCommentAdded: (commentId: string, content: string) => void;
}

const CommentForm = ({ eventId, pubkey, onCommentAdded }: CommentFormProps) => {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get user profile data for avatar
  const currentUserPubkey = nostrService.publicKey || '';
  
  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
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
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-end gap-2 mb-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src="" />
        <AvatarFallback className="bg-[#1EAEDB]/20 text-[#1EAEDB]">
          {currentUserPubkey ? currentUserPubkey.charAt(0).toUpperCase() : 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 bg-[#2A2D35] rounded-lg overflow-hidden">
        <Textarea
          placeholder="Send a message..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[60px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[#C8C8C9] placeholder:text-[#8A898C]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmitComment();
            }
          }}
        />
        <div className="flex justify-between items-center p-2 bg-[#222222]">
          <div className="text-xs text-[#8A898C]">
            Shift+Enter for line break
          </div>
          <Button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || isSubmitting}
            size="sm"
            className="h-7 bg-[#1EAEDB] hover:bg-[#0FA0CE] text-white"
          >
            <Send className="h-3.5 w-3.5 mr-1" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommentForm;
