
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
    <CardHeader className="py-2 px-3 border-b flex flex-row justify-between items-center">
      <CardTitle className="text-base">World Chat</CardTitle>
      
      <div className={cn(
        "flex items-center gap-1 text-xs",
        connectionStatus === 'connected' ? "text-green-500" : 
        connectionStatus === 'connecting' ? "text-yellow-500" : 
        "text-red-500"
      )}>
        {connectionStatus === 'connected' ? (
          <>
            <Wifi className="h-3 w-3" />
            <span>Connected</span>
          </>
        ) : connectionStatus === 'connecting' ? (
          <>
            <Wifi className="h-3 w-3" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            <span>Disconnected</span>
          </>
        )}
      </div>
    </CardHeader>
  );
};

export default WorldChatHeader;
