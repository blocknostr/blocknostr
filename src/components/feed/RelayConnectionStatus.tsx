
import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function RelayConnectionStatus() {
  const [connectedCount, setConnectedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  const updateConnectionStatus = async () => {
    // Check browser online status
    setIsOnline(navigator.onLine);
    
    // Check relay connections
    const relays = nostrService.getRelayStatus();
    const connected = relays.filter(r => r.status === 'connected').length;
    setConnectedCount(connected);
    setTotalCount(relays.length);
  };
  
  useEffect(() => {
    // Update immediately
    updateConnectionStatus();
    
    // Set interval to check periodically
    const interval = setInterval(updateConnectionStatus, 5000);
    
    // Listen for online/offline events
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', updateConnectionStatus);
      window.removeEventListener('offline', updateConnectionStatus);
    };
  }, []);

  // Handle reconnection attempt
  const handleReconnect = async () => {
    if (isReconnecting || !isOnline) return;
    
    try {
      setIsReconnecting(true);
      await nostrService.connectToUserRelays();
      await updateConnectionStatus();
    } catch (error) {
      console.error("Failed to reconnect:", error);
    } finally {
      setIsReconnecting(false);
    }
  };

  // Get status color - Using valid badge variants
  const getStatusColor = () => {
    if (!isOnline) return "destructive";
    if (connectedCount === 0) return "destructive";
    if (connectedCount < totalCount / 2) return "secondary"; 
    return "default"; 
  };

  // Get status message
  const getStatusMessage = () => {
    if (!isOnline) return "Browser offline";
    if (connectedCount === 0) return "No relays connected";
    if (connectedCount === totalCount) return "All relays connected";
    return `${connectedCount}/${totalCount} relays connected`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={getStatusColor()} 
            className={`flex items-center gap-1 cursor-pointer ${connectedCount > 0 ? "bg-green-500 hover:bg-green-600" : ""}`}
            onClick={connectedCount === 0 && isOnline ? handleReconnect : undefined}
          >
            {isReconnecting ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : isOnline && connectedCount > 0 ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            <span className="text-xs">{connectedCount}</span>
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

export default RelayConnectionStatus;
