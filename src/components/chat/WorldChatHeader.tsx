
import React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, WifiOff } from "lucide-react";
import type { ConnectionStatus } from "./hooks";
import { cn } from "@/lib/utils";

interface WorldChatHeaderProps {
  connectionStatus: ConnectionStatus;
}

const WorldChatHeader: React.FC<WorldChatHeaderProps> = ({ connectionStatus }) => {
  return (
    <CardHeader className="py-3 px-4 border-b flex flex-row justify-between items-center bg-background/95 shadow-sm">
      <CardTitle className="text-base font-bold">World Chat</CardTitle>
      
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
