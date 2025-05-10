
import { useState } from 'react';
import { nostrService } from '@/lib/nostr';
import CommentForm from './comments/CommentForm';
import CommentItem from './comments/CommentItem';
import DeleteCommentDialog from './comments/DeleteCommentDialog';
import { useComments } from '@/hooks/useComments';

interface NoteCardCommentsProps {
  eventId: string;
  pubkey: string;
  initialComments?: Array<{
    id?: string;
    content: string;
    author: string;
    created_at: number;
  }>;
  onReplyAdded: () => void;
}

const NoteCardComments = ({ 
  eventId, 
  pubkey, 
  initialComments = [], 
  onReplyAdded 
}: NoteCardCommentsProps) => {
  const [replyToDelete, setReplyToDelete] = useState<string | null>(null);
  const { comments, profiles, isLoading, addComment, removeComment } = useComments(eventId);
  
  const handleDeleteClick = (commentId: string | undefined) => {
    if (commentId) {
      setReplyToDelete(commentId);
    }
  };
  
  const handleCommentAdded = (commentId: string, content: string) => {
    addComment(commentId, content);
    onReplyAdded();
  };
  
  const handleDeleteSuccess = (commentId: string) => {
    removeComment(commentId);
  };

  return (
    <>
      <div className="px-5 pb-4 pt-3">
        {nostrService.publicKey && (
          <CommentForm 
            eventId={eventId} 
            pubkey={pubkey}
            onCommentAdded={handleCommentAdded}
          />
        )}
        
        <div className="space-y-4 mt-2">
          {isLoading ? (
            <div className="text-sm text-center py-4 text-muted-foreground">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-sm text-center py-4 text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                profile={profiles[comment.author] || {}}
                onDeleteClick={handleDeleteClick}
              />
            ))
          )}
        </div>
      </div>
      
      <DeleteCommentDialog 
        commentId={replyToDelete}
        isOpen={!!replyToDelete}
        onOpenChange={(open) => !open && setReplyToDelete(null)}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </>
  );
};

export default NoteCardComments;
