
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import ReactionPopover from "./ReactionPopover";

interface OriginalPostProps {
  note: any;
  authorName: string;
  authorPicture: string;
  avatarFallback: string;
  formattedDate: string;
  emojiReactions: Record<string, string[]>;
  onEmojiReaction: (emoji: string, targetId: string) => void;
}

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const OriginalPost: React.FC<OriginalPostProps> = ({
  note,
  authorName,
  authorPicture,
  avatarFallback,
  formattedDate,
  emojiReactions,
  onEmojiReaction
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-start mb-1">
        <Avatar className="h-10 w-10 mr-3">
          <AvatarImage src={authorPicture} />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center">
            <span className="font-semibold mr-2">{authorName}</span>
            <span className="text-xs text-muted-foreground">{formattedDate}</span>
          </div>
          <div className="mt-1 whitespace-pre-wrap">{note?.content}</div>
          
          {/* Reactions for original post */}
          {emojiReactions[note?.id] && (
            <div className="flex flex-wrap gap-1 mt-2">
              {emojiReactions[note?.id].map((emoji, i) => (
                <span key={i} className="bg-muted px-1.5 py-0.5 rounded-full text-xs">
                  {emoji}
                </span>
              ))}
            </div>
          )}
          
          {/* Reaction button for original post */}
          <div className="mt-2">
            <ReactionPopover
              emojis={EMOJI_REACTIONS}
              onSelectEmoji={(emoji) => onEmojiReaction(emoji, note?.id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OriginalPost;
