
import React from "react";
import CommentsList from "./CommentsList";

interface CommentsSectionProps {
  comments: any[];
  profiles: Record<string, any>;
  emojiReactions: Record<string, string[]>;
  onEmojiReaction: (emoji: string, targetId: string) => void;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  comments,
  profiles,
  emojiReactions,
  onEmojiReaction
}) => {
  return (
    <div className="mt-4">
      {/* Horizontal separator */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-2 text-xs text-muted-foreground">
            COMMENTS
          </span>
        </div>
      </div>
      
      {/* Comments list */}
      <div className="mt-4">
        <CommentsList
          comments={comments}
          profiles={profiles}
          emojiReactions={emojiReactions}
          onEmojiReaction={onEmojiReaction}
        />
      </div>
    </div>
  );
};

export default CommentsSection;
