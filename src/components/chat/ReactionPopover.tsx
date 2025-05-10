
import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SmilePlus } from "lucide-react";

interface ReactionPopoverProps {
  onSelectEmoji: (emoji: string) => void;
  emojis: string[];
  buttonSize?: "sm" | "default";
  buttonText?: string;
}

const ReactionPopover: React.FC<ReactionPopoverProps> = ({ 
  onSelectEmoji, 
  emojis, 
  buttonSize = "sm",
  buttonText = "Add Reaction" 
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size={buttonSize} 
          className={buttonSize === "sm" ? "h-6 px-2 text-xs" : "h-8 px-2"}
        >
          <SmilePlus className={buttonSize === "sm" ? "h-3 w-3 mr-1" : "h-4 w-4 mr-1"} />
          {buttonText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-1">
        <div className="flex gap-1">
          {emojis.map(emoji => (
            <Button 
              key={emoji} 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onSelectEmoji(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ReactionPopover;
