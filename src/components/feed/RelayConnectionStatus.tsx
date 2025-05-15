import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { nostrService } from "@/lib/nostr";
import { Wifi, WifiOff } from "lucide-react";

const RelayConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  
  const checkConnectionStatus = useCallback(() => {
    const relays = nostrService.getRelayStatus();
    const connectedRelays = relays.filter(relay => {
      // Convert to string for safe comparison if needed
      return String(relay.status) === "1" || relay.status === "connected";
    }).length;
    setIsConnected(connectedRelays > 0);
  }, []);
  
  useEffect(() => {
    checkConnectionStatus();
    
    const interval = setInterval(checkConnectionStatus, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [checkConnectionStatus]);

  return (
    <TooltipProvider delayDuration={50}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-accent/30 rounded-full"
          >
            {isConnected ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="text-xs">
          {isConnected ? "Connected to relays" : "Disconnected from relays"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RelayConnectionStatus;
