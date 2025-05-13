
import { useEffect, useState } from "react";
import { nostrService } from "@/lib/nostr";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ConnectionStatusBanner() {
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [relayCount, setRelayCount] = useState<{ total: number; connected: number }>({ total: 0, connected: 0 });
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const checkConnectionStatus = () => {
      const relayStatus = nostrService.getRelayStatus();
      const total = relayStatus.length;
      const connected = relayStatus.filter(r => r.status === "connected").length;
      
      setRelayCount({ total, connected });
      
      if (connected > 0) {
        setStatus("connected");
      } else if (total > 0) {
        setStatus("disconnected");
      } else {
        setStatus("connecting");
      }
    };

    // Check initially
    checkConnectionStatus();

    // Setup interval to check periodically
    const intervalId = setInterval(checkConnectionStatus, 5000);

    // Setup event listener for relay connection changes
    const handleRelayStatusChange = () => {
      checkConnectionStatus();
    };
    
    window.addEventListener('relay-status-change', handleRelayStatusChange);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('relay-status-change', handleRelayStatusChange);
    };
  }, []);

  // Hide the banner for connected status after 3 seconds
  useEffect(() => {
    if (status === "connected") {
      const timeoutId = setTimeout(() => {
        setVisible(false);
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    } else {
      setVisible(true);
    }
  }, [status]);

  // Don't render anything if connected and not visible
  if (status === "connected" && !visible) {
    return null;
  }

  return (
    <Alert 
      variant={status === "connected" ? "default" : "destructive"} 
      className={cn(
        "mb-4 transition-all duration-300",
        status === "connected" ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/30" : 
        status === "disconnected" ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30" :
        "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/30"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {status === "connected" ? (
            <Wifi className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
          ) : status === "disconnected" ? (
            <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
          ) : (
            <Loader2 className="h-4 w-4 text-yellow-600 dark:text-yellow-400 animate-spin mr-2" />
          )}
          
          <div>
            <AlertTitle className="text-sm font-medium">
              {status === "connected" ? "Connected" : 
               status === "disconnected" ? "Disconnected" : 
               "Connecting..."}
            </AlertTitle>
            <AlertDescription className="text-xs">
              {status === "connected" ? 
                `Connected to ${relayCount.connected} of ${relayCount.total} relays` : 
               status === "disconnected" ? 
                "Unable to connect to relays. Check your connection." : 
                "Connecting to Nostr relays..."}
            </AlertDescription>
          </div>
        </div>
        
        {status === "disconnected" && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => nostrService.connectToUserRelays()}
            className="h-8 text-xs"
          >
            Retry
          </Button>
        )}
      </div>
    </Alert>
  );
}
