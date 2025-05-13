
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useRelays } from '@/hooks/useRelays';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function HeaderRelayStatus() {
  const { relays, isConnecting, connectionStatus, connectToRelays } = useRelays();
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
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
  
  // Count connected relays
  const connectedCount = relays.filter(r => r.status === 'connected').length;
  const totalCount = relays.length;

  // Handle reconnection attempt
  const handleReconnect = async () => {
    if (isReconnecting || !isOnline) return;
    
    try {
      setIsReconnecting(true);
      toast.loading("Reconnecting to relays...");
      await connectToRelays();
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
    if (connectionStatus === 'connecting' || isReconnecting) return "text-yellow-500 bg-yellow-500/10";
    if (connectedCount === 0) return "text-red-500 bg-red-500/10";
    return "text-green-500 bg-green-500/10";
  };

  // Get status message
  const getStatusMessage = () => {
    if (!isOnline) return "Browser offline";
    if (connectionStatus === 'connecting' || isReconnecting) return "Connecting to relays...";
    if (connectedCount === 0) return "No relays connected";
    if (connectedCount === totalCount) return "All relays connected";
    return `${connectedCount}/${totalCount} relays connected`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full cursor-pointer",
              getStatusClasses(),
              connectedCount === 0 && isOnline && !isReconnecting ? "hover:bg-opacity-20" : ""
            )}
            onClick={connectedCount === 0 && isOnline ? handleReconnect : undefined}
          >
            {isReconnecting || connectionStatus === 'connecting' ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : isOnline && connectedCount > 0 ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            <span className="font-medium">{connectedCount}/{totalCount}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getStatusMessage()}</p>
          {connectedCount === 0 && isOnline && !isReconnecting && (
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
