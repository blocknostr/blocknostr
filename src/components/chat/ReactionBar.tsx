
import React from "react";
import { Button } from "@/components/ui/button";
import { SmilePlus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface ReactionBarProps {
  isLoggedIn: boolean;
  onAddReaction: (emoji: string) => void;
  isCurrentUser: boolean;
}

// Common emojis for quick reactions
const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "👏", "🙏", "🔥"];

const ReactionBar: React.FC<ReactionBarProps> = ({ isLoggedIn, onAddReaction, isCurrentUser }) => {
  const handleReaction = (emoji: string) => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to react");
      return;
    }
    onAddReaction(emoji);
  };

  return (
    <div className={`absolute ${isCurrentUser ? 'left-0 -translate-x-[95%]' : 'right-0 translate-x-[95%]'} top-1/2 -translate-y-1/2`}>
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 w-5 p-0 rounded-full opacity-0 group-hover:opacity-90 transition-opacity"
          >
            <SmilePlus className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1" align={isCurrentUser ? "start" : "end"}>
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {COMMON_EMOJIS.map(emoji => (
              <Button 
                key={emoji} 
                variant="ghost" 
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ReactionBar;
