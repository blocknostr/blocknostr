
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useRelays } from '@/hooks/useRelays';
import { toast } from 'sonner';

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

  // Get status color - Using TailwindCSS colors
  const getStatusColor = () => {
    if (!isOnline) return "bg-red-500 hover:bg-red-600";
    if (connectionStatus === 'connecting' || isReconnecting) return "bg-yellow-500 hover:bg-yellow-600";
    if (connectedCount === 0) return "bg-red-500 hover:bg-red-600";
    return "bg-green-500 hover:bg-green-600"; 
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
          <Badge 
            variant="outline"
            className={`flex items-center gap-1.5 cursor-pointer text-white ${getStatusColor()}`}
            onClick={connectedCount === 0 && isOnline ? handleReconnect : undefined}
          >
            {isReconnecting || connectionStatus === 'connecting' ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : isOnline && connectedCount > 0 ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            <span className="text-xs font-medium">{connectedCount}/{totalCount}</span>
          </Badge>
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
