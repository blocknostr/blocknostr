
import React from "react";
import CommentItem from "./CommentItem";
import { formatDistanceToNow } from 'date-fns';

interface CommentsListProps {
  comments: any[];
  profiles: Record<string, any>;
  emojiReactions: Record<string, string[]>;
  onEmojiReaction: (emoji: string, targetId: string) => void;
}

const CommentsList: React.FC<CommentsListProps> = ({
  comments,
  profiles,
  emojiReactions,
  onEmojiReaction
}) => {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const commentAuthorProfile = comment.pubkey ? profiles[comment.pubkey] : null;
        const commentAuthorName = commentAuthorProfile?.name || 
          commentAuthorProfile?.display_name || 
          `${comment.pubkey?.substring(0, 8)}...`;
        const commentAuthorPicture = commentAuthorProfile?.picture || '';
        const commentAvatarFallback = commentAuthorName ? commentAuthorName.charAt(0).toUpperCase() : 'C';
        const commentDate = formatDistanceToNow(new Date(comment.created_at * 1000), { addSuffix: true });
        
        return (
          <CommentItem
            key={comment.id}
            comment={comment}
            authorName={commentAuthorName}
            authorPicture={commentAuthorPicture}
            authorFallback={commentAvatarFallback}
            date={commentDate}
            emojiReactions={emojiReactions}
            onEmojiReaction={onEmojiReaction}
          />
        );
      })}
    </div>
  );
};

export default CommentsList;
