import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";
import { RefreshCw, WifiOff } from "lucide-react";

const ConnectionStatusBanner = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
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
  
  if (!isConnected) {
    return (
      <Alert variant="destructive" className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              You're offline. Showing cached content only.
            </AlertDescription>
          </div>
        </div>
      </Alert>
    );
  }
  
  return null;
};

export default ConnectionStatusBanner;
