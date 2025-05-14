
import React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, WifiOff, ChevronDown } from "lucide-react";
import type { ConnectionStatus } from "./hooks";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Channel data structure
export interface ChatChannel {
  name: string;
  tag: string;
}

// Define the available world chat channels
export const WORLD_CHAT_CHANNELS: ChatChannel[] = [
  { name: "World Chat", tag: "world-chat" },
  { name: "Bitcoin World Chat", tag: "bitcoin-world-chat" },
  { name: "Alephium World Chat", tag: "alephium-world-chat" },
  { name: "Ergo World Chat", tag: "ergo-world-chat" },
];

interface WorldChatHeaderProps {
  connectionStatus: ConnectionStatus;
  currentChatTag: string;
  onChannelSelect: (channel: ChatChannel) => void;
}

const WorldChatHeader: React.FC<WorldChatHeaderProps> = ({ 
  connectionStatus,
  currentChatTag,
  onChannelSelect
}) => {
  // Find the current channel object based on the tag
  const currentChannel = WORLD_CHAT_CHANNELS.find(
    channel => channel.tag === currentChatTag
  ) || WORLD_CHAT_CHANNELS[0];
  
  return (
    <CardHeader className="py-3 px-4 border-b flex flex-row justify-between items-center bg-background/95 shadow-sm">
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none group" asChild>
          <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
            <CardTitle className="text-base font-bold group-hover:text-primary">
              {currentChannel.name}
            </CardTitle>
            <ChevronDown className="h-4 w-4 opacity-70 group-hover:text-primary" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {WORLD_CHAT_CHANNELS.map((channel) => (
            <DropdownMenuItem 
              key={channel.tag}
              onClick={() => onChannelSelect(channel)}
              className={cn(
                "cursor-pointer",
                channel.tag === currentChatTag && "bg-muted font-medium"
              )}
            >
              {channel.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <div className={cn(
        "flex items-center justify-center w-6 h-6 rounded-full",
        connectionStatus === 'connected' ? "text-green-500 bg-green-500/10" : 
        connectionStatus === 'connecting' ? "text-yellow-500 bg-yellow-500/10" : 
        "text-red-500 bg-red-500/10"
      )}>
        {connectionStatus === 'connected' ? (
          <Wifi className="h-3.5 w-3.5" />
        ) : connectionStatus === 'connecting' ? (
          <Wifi className="h-3.5 w-3.5" />
        ) : (
          <WifiOff className="h-3.5 w-3.5" />
        )}
      </div>
    </CardHeader>
  );
};

export default WorldChatHeader;
