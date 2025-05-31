import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageSquare, Repeat2, Zap, SmilePlus } from 'lucide-react';
import { nostrService } from '@/lib/nostr';
import { useAuth } from '@/hooks/useAuth';
import { Event } from 'nostr-tools';
import { toast } from '@/lib/toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    <TooltipProvider delayDuration={300}>
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button 
                className="rounded-full bg-background/90 border shadow-sm hover:bg-accent/30 p-1.5"
                aria-label="Add reaction"
              >
                <SmilePlus className="h-3 w-3 text-muted-foreground" />
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Add reaction
          </TooltipContent>
        </Tooltip>
        <PopoverContent className="w-auto p-1" side="top">
          <div className="flex gap-1">
            {COMMON_EMOJIS.map(emoji => (
              <button 
                key={emoji} 
                className="hover:bg-accent/50 rounded p-1 transition-colors"
                onClick={() => handleReaction(emoji)}
                aria-label={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};

export default ReactionBar;

