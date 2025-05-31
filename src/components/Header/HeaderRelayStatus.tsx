import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { toast } from "@/lib/toast";
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/hooks/redux';
import { selectConnectionStatusSafe } from '@/store/slices/chatSlice';
import { coreNostrService } from '@/lib/nostr/core-service';

export function HeaderRelayStatus() {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // ✅ FIXED: Use centralized Redux connection status
  const connectionStatus = useAppSelector(selectConnectionStatusSafe);
  const { isConnected, connectedRelays, totalRelays } = connectionStatus;
  
  // Track browser online status
  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  // Handle reconnection attempt
  const handleReconnect = async () => {
    if (isReconnecting || !isOnline) return;
    
    try {
      setIsReconnecting(true);
      toast.loading("Reconnecting to relays...");
      
      // Use the centralized core service for reconnection
      await coreNostrService.connectToDefaultRelays();
      
      toast.success("Reconnection complete");
    } catch (error) {
      console.error("Failed to reconnect:", error);
      toast.error("Failed to reconnect");
    } finally {
      setIsReconnecting(false);
    }
  };

  // Get status classes - Match WorldChat indicator
  const getStatusClasses = () => {
    if (!isOnline) return "text-red-500 bg-red-500/10";
    if (isReconnecting) return "text-yellow-500 bg-yellow-500/10";
    if (!isConnected || connectedRelays === 0) return "text-red-500 bg-red-500/10";
    return "text-green-500 bg-green-500/10";
  };

  // Get status text - Make "connecting" more prominent
  const getStatusText = () => {
    if (!isOnline) return "Offline";
    if (isReconnecting) return "Connecting...";
    if (!isConnected || connectedRelays === 0) return "Disconnected";
    return "Connected";
  };

  // Get status message for tooltip
  const getStatusMessage = () => {
    if (!isOnline) return "Browser offline";
    if (isReconnecting) return "Connecting to relays...";
    if (!isConnected || connectedRelays === 0) return "No relays connected. Click to reconnect";
    if (connectedRelays === totalRelays) return "All relays connected";
    return `${connectedRelays}/${totalRelays} relays connected`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full cursor-pointer",
              getStatusClasses(),
              (!isConnected || connectedRelays === 0) && isOnline && !isReconnecting ? "hover:bg-opacity-20" : ""
            )}
            onClick={(!isConnected || connectedRelays === 0) && isOnline ? handleReconnect : undefined}
          >
            {isReconnecting ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : isOnline && isConnected && connectedRelays > 0 ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            <span className="font-medium">{getStatusText()}</span>
            <span className="font-medium text-xs opacity-80">({connectedRelays}/{totalRelays})</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getStatusMessage()}</p>
          {(!isConnected || connectedRelays === 0) && isOnline && !isReconnecting && (
            <p className="text-xs mt-1">Click to reconnect</p>
          )}
          {isReconnecting && (
            <p className="text-xs mt-1">Reconnecting...</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default HeaderRelayStatus;

