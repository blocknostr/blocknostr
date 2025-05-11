
import React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectionStatus } from "./useWorldChat";
import { Wifi, WifiOff } from "lucide-react";

interface WorldChatHeaderProps {
  connectionStatus: ConnectionStatus;
}

const WorldChatHeader: React.FC<WorldChatHeaderProps> = ({ connectionStatus }) => {
  return (
    <CardHeader className="py-2 px-3 border-b flex flex-row items-center justify-between">
      <CardTitle className="text-base">World Chat</CardTitle>
      <div className="text-xs flex items-center gap-1.5">
        {connectionStatus === 'connected' ? (
          <Wifi className="h-3.5 w-3.5 text-green-500" />
        ) : connectionStatus === 'connecting' ? (
          <Wifi className="h-3.5 w-3.5 text-amber-500" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 text-destructive" />
        )}
      </div>
    </CardHeader>
  );
};

export default WorldChatHeader;
