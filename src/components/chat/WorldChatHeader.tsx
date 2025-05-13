
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
import { useNavigate } from "react-router-dom";

interface WorldChatHeaderProps {
  connectionStatus: ConnectionStatus;
}

const WorldChatHeader: React.FC<WorldChatHeaderProps> = ({ connectionStatus }) => {
  const navigate = useNavigate();
  
  // Define the available world chat channels
  const worldChatChannels = [
    { name: "World Chat", tag: "world-chat" },
    { name: "Bitcoin World Chat", tag: "bitcoin-world-chat" },
    { name: "Alephium World Chat", tag: "alephium-world-chat" },
    { name: "Ergo World Chat", tag: "ergo-world-chat" },
  ];
  
  // Function to navigate to specific world chat
  const handleChannelSelect = (tag: string) => {
    // In a real implementation, this would navigate to the specific chat
    // or update a context/state to change the current chat channel
    console.log(`Navigating to ${tag}`);
    // For now, we just log the action
  };
  
  return (
    <CardHeader className="py-3 px-4 border-b flex flex-row justify-between items-center bg-background/95 shadow-sm">
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none group" asChild>
          <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
            <CardTitle className="text-base font-bold group-hover:text-primary">World Chat</CardTitle>
            <ChevronDown className="h-4 w-4 opacity-70 group-hover:text-primary" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {worldChatChannels.map((channel) => (
            <DropdownMenuItem 
              key={channel.tag}
              onClick={() => handleChannelSelect(channel.tag)}
              className="cursor-pointer"
            >
              {channel.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <div className={cn(
        "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full",
        connectionStatus === 'connected' ? "text-green-500 bg-green-500/10" : 
        connectionStatus === 'connecting' ? "text-yellow-500 bg-yellow-500/10" : 
        "text-red-500 bg-red-500/10"
      )}>
        {connectionStatus === 'connected' ? (
          <>
            <Wifi className="h-3 w-3" />
            <span className="font-medium">Connected</span>
          </>
        ) : connectionStatus === 'connecting' ? (
          <>
            <Wifi className="h-3 w-3" />
            <span className="font-medium">Connecting...</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            <span className="font-medium">Disconnected</span>
          </>
        )}
      </div>
    </CardHeader>
  );
};

export default WorldChatHeader;
