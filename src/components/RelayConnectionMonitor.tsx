
import { useEffect, useState, useCallback } from 'react';
import { nostrService } from '@/lib/nostr';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function RelayConnectionMonitor() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionCount, setConnectionCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  // Function to check connection status
  const checkConnection = useCallback(() => {
    const relays = nostrService.getRelayStatus();
    const connected = relays.filter(r => r.status === 'connected').length;
    setConnectionCount(connected);
    setIsConnected(connected > 0);
  }, []);
  
  // Check connection on mount and periodically
  useEffect(() => {
    checkConnection();
    
    // Check connections every 15 seconds
    const intervalId = setInterval(checkConnection, 15000);
    
    // Cleanup
    return () => clearInterval(intervalId);
  }, [checkConnection]);
  
  // Handle reconnection button click
  const handleReconnect = async () => {
    if (isReconnecting) return;
    
    setIsReconnecting(true);
    
    try {
      toast.loading("Reconnecting to Nostr network...");
      
      await nostrService.connectToUserRelays();
      
      // Check if we connected successfully
      const relays = nostrService.getRelayStatus();
      const connected = relays.filter(r => r.status === 'connected').length;
      
      if (connected > 0) {
        toast.success(`Connected to ${connected} relays`);
        setIsConnected(true);
        setConnectionCount(connected);
      } else {
        // Try default relays as fallback
        await nostrService.connectToDefaultRelays();
        
        const defaultConnected = nostrService.getRelayStatus()
          .filter(r => r.status === 'connected').length;
        
        if (defaultConnected > 0) {
          toast.success(`Connected to ${defaultConnected} relays`);
          setIsConnected(true);
          setConnectionCount(defaultConnected);
        } else {
          toast.error("Failed to connect to any relays");
        }
      }
    } catch (error) {
      console.error("Error reconnecting:", error);
      toast.error("Failed to reconnect");
    } finally {
      setIsReconnecting(false);
    }
  };
  
  // Don't show anything if we're not logged in
  if (!nostrService.publicKey) return null;
  
  // Don't render anything if connected
  if (isConnected && !isReconnecting) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-background border shadow-lg rounded-lg p-3 flex items-center gap-3">
        <div className="flex items-center">
          {isReconnecting ? (
            <RefreshCw className="h-5 w-5 text-amber-500 animate-spin" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
          <span className="ml-2 text-sm">
            {isReconnecting ? "Reconnecting..." : "Not connected to Nostr network"}
          </span>
        </div>
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleReconnect}
          disabled={isReconnecting}
        >
          Reconnect
        </Button>
      </div>
    </div>
  );
}

export default RelayConnectionMonitor;
