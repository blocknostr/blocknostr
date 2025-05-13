
import React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, WifiOff, Volume2, VolumeX } from "lucide-react";
import type { ConnectionStatus } from "./hooks";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WorldChatHeaderProps {
  connectionStatus: ConnectionStatus;
  isMuted: boolean;
  onToggleMute: () => void;
}

const WorldChatHeader: React.FC<WorldChatHeaderProps> = ({ 
  connectionStatus, 
  isMuted,
  onToggleMute
}) => {
  return (
    <CardHeader className="py-3 px-4 border-b flex flex-row justify-between items-center bg-background/95 shadow-sm">
      <CardTitle className="text-base font-bold">World Chat</CardTitle>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onToggleMute}
              className={cn(
                "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-colors",
                connectionStatus === 'connected' ? "text-green-500 bg-green-500/10" : 
                connectionStatus === 'connecting' ? "text-yellow-500 bg-yellow-500/10" : 
                "text-red-500 bg-red-500/10",
                isMuted && "border border-red-400/30"
              )}
            >
              {connectionStatus === 'connected' ? (
                <>
                  <Wifi className="h-3 w-3" />
                  {isMuted && <VolumeX className="h-3 w-3" />}
                </>
              ) : connectionStatus === 'connecting' ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {isMuted 
              ? "Unmute chat (Currently muted)" 
              : "Mute chat (Currently receiving messages)"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </CardHeader>
  );
};

export default WorldChatHeader;
