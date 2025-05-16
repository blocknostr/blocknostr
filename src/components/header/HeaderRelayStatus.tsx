
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

  // Get status classes - Match Nostream.pub indicator
  const getStatusClasses = () => {
    if (!isOnline) return "text-red-500 bg-red-500/5 border-red-500/20";
    if (connectionStatus === 'connecting' || isReconnecting) return "text-yellow-500 bg-yellow-500/5 border-yellow-500/20";
    if (connectedCount === 0) return "text-red-500 bg-red-500/5 border-red-500/20";
    return "text-emerald-500 bg-emerald-500/5 border-emerald-500/20";
  };

  // Get status text - Make more concise like Nostream
  const getStatusText = () => {
    if (!isOnline) return "Offline";
    if (connectionStatus === 'connecting' || isReconnecting) return "Connecting";
    if (connectedCount === 0) return "No relays";
    return `${connectedCount}/${totalCount}`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "flex items-center gap-1.5 text-xs py-1 px-2 rounded border cursor-pointer",
              getStatusClasses()
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
            <span className="font-medium">{getStatusText()}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{connectedCount > 0 ? `${connectedCount} relays connected` : "No relays connected"}</p>
          {connectedCount === 0 && isOnline && !isReconnecting && (
            <p className="text-xs mt-1">Click to reconnect</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default HeaderRelayStatus;
