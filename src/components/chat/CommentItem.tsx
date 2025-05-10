
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import ReactionPopover from "./ReactionPopover";

interface CommentItemProps {
  comment: any;
  authorName: string;
  authorPicture: string;
  authorFallback: string;
  date: string;
  emojiReactions: Record<string, string[]>;
  onEmojiReaction: (emoji: string, targetId: string) => void;
}

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  authorName,
  authorPicture,
  authorFallback,
  date,
  emojiReactions,
  onEmojiReaction
}) => {
  return (
    <div className="flex items-start">
      <Avatar className="h-8 w-8 mr-2">
        <AvatarImage src={authorPicture} />
        <AvatarFallback>{authorFallback}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center">
          <span className="font-semibold text-sm mr-2">{authorName}</span>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
        <p className="text-sm mt-0.5">{comment.content}</p>
        
        {/* Reactions for comments */}
        {emojiReactions[comment.id || ''] && (
          <div className="flex flex-wrap gap-1 mt-1">
            {emojiReactions[comment.id || ''].map((emoji, i) => (
              <span key={i} className="bg-muted px-1.5 py-0.5 rounded-full text-xs">
                {emoji}
              </span>
            ))}
          </div>
        )}
        
        {/* Reaction button for comments */}
        <div className="mt-1">
          <ReactionPopover
            emojis={EMOJI_REACTIONS}
            onSelectEmoji={(emoji) => onEmojiReaction(emoji, comment.id || '')}
            buttonSize="sm"
            buttonText="React"
          />
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
