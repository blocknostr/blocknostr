
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
}

// Common emojis for quick reactions
const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const ReactionBar: React.FC<ReactionBarProps> = ({ isLoggedIn, onAddReaction }) => {
  const handleReaction = (emoji: string) => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to react");
      return;
    }
    onAddReaction(emoji);
  };

  return (
    <div className="mt-0.5">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-5 px-1 text-[10px]">
            <SmilePlus className="h-3 w-3 mr-1" />
            React
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1">
          <div className="flex gap-1">
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
