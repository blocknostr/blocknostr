import React, { useMemo, useCallback } from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, ChevronDown, Minimize2, Settings } from "lucide-react";
import type { ConnectionStatus } from "./hooks";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Channel data structure
export interface ChatChannel {
  name: string;
  tag: string;
  color?: string;
}

// Define the available world chat channels with colors
export const WORLD_CHAT_CHANNELS: ChatChannel[] = [
  { name: "World Chat", tag: "world-chat", color: "bg-gradient-to-r from-violet-500 to-purple-500" },
  { name: "Bitcoin World Chat", tag: "bitcoin-world-chat", color: "bg-gradient-to-r from-orange-500 to-yellow-500" },
  { name: "Alephium World Chat", tag: "alephium-world-chat", color: "bg-gradient-to-r from-blue-500 to-cyan-500" },
  { name: "Ergo World Chat", tag: "ergo-world-chat", color: "bg-gradient-to-r from-green-500 to-emerald-500" },
];

interface WorldChatHeaderProps {
  connectionStatus: ConnectionStatus;
  currentChatTag: string;
  onChannelSelect: (channel: ChatChannel) => void;
  onMinimize?: () => void;
}

const WorldChatHeader: React.FC<WorldChatHeaderProps> = React.memo(({ 
  connectionStatus,
  currentChatTag,
  onChannelSelect,
  onMinimize
}) => {
  // ✅ FIXED: Memoize channel lookup to prevent re-renders
  const currentChannel = useMemo(() => {
    return WORLD_CHAT_CHANNELS.find(
      channel => channel.tag === currentChatTag
    ) || WORLD_CHAT_CHANNELS[0];
  }, [currentChatTag]);

  // ✅ FIXED: Memoize connection status classes to prevent re-renders
  const connectionClasses = useMemo(() => {
    return cn(
      "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200",
      connectionStatus === 'connected' 
        ? "text-green-500 bg-green-500/10 border-green-500/20 shadow-green-500/20 shadow-sm" 
        : connectionStatus === 'connecting' 
        ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/20 animate-pulse" 
        : "text-red-500 bg-red-500/10 border-red-500/20"
    );
  }, [connectionStatus]);

  // ✅ FIXED: Memoize connection icon to prevent re-renders
  const connectionIcon = useMemo(() => {
    if (connectionStatus === 'connected') {
      return <Wifi className="h-4 w-4" />;
    } else if (connectionStatus === 'connecting') {
      return <Wifi className="h-4 w-4 animate-pulse" />;
    } else {
      return <WifiOff className="h-4 w-4" />;
    }
  }, [connectionStatus]);

  // ✅ FIXED: Create stable click handlers to prevent re-renders
  const handleChannelClick = useCallback((channel: ChatChannel) => {
    return () => onChannelSelect(channel);
  }, [onChannelSelect]);

  // ✅ FIXED: Memoize dropdown menu items to prevent re-renders
  const dropdownMenuItems = useMemo(() => {
    return WORLD_CHAT_CHANNELS.map((channel) => {
      const isCurrentChannel = channel.tag === currentChatTag;
      return (
        <DropdownMenuItem 
          key={channel.tag}
          onClick={handleChannelClick(channel)}
          className={cn(
            "cursor-pointer flex items-center gap-3 p-3",
            isCurrentChannel && "bg-primary/10 font-medium border-l-2 border-primary"
          )}
        >
          <div className={cn("w-2 h-2 rounded-full", channel.color || "bg-primary")} />
          <span className="flex-1">{channel.name}</span>
          {isCurrentChannel && (
            <Badge variant="secondary" className="text-xs">Current</Badge>
          )}
        </DropdownMenuItem>
      );
    });
  }, [currentChatTag, handleChannelClick]);
  
  return (
    <CardHeader className="py-3 px-4 border-b border-primary/10 flex flex-row justify-between items-center bg-gradient-to-r from-background via-background to-primary/5 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {/* Channel indicator dot */}
        <div className={cn("w-3 h-3 rounded-full", currentChannel.color || "bg-primary")} />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto p-0 focus:outline-none group hover:bg-transparent">
              <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                <CardTitle className="text-base font-bold group-hover:text-primary bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {currentChannel.name}
                </CardTitle>
                <ChevronDown className="h-4 w-4 opacity-70 group-hover:text-primary group-hover:opacity-100 transition-all" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 border-primary/20">
            {dropdownMenuItems}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-muted-foreground">
              <Settings className="h-4 w-4 mr-2" />
              Channel Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Connection status */}
        <div className={connectionClasses}>
          {connectionIcon}
        </div>
        
        {/* Minimize button */}
        {onMinimize && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMinimize}
            className="h-8 w-8 p-0 hover:bg-muted/50 transition-colors"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </CardHeader>
  );
});

// ✅ FIXED: Add display name for debugging
WorldChatHeader.displayName = 'WorldChatHeader';

export default WorldChatHeader;

