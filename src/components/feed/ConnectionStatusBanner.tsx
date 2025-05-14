
import { useEffect, useState } from 'react';
import { nostrService } from '@/lib/nostr';
import { contentCache } from '@/lib/nostr/cache/content-cache';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function ConnectionStatusBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [connectedRelays, setConnectedRelays] = useState(0);
  const [totalRelays, setTotalRelays] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  useEffect(() => {
    const updateConnectionStatus = () => {
      // Check if we're offline at browser level
      setIsOffline(!navigator.onLine);
      
      // Check relay connections
      const relays = nostrService.getRelayStatus();
      const connected = relays.filter(r => r.status === 'connected').length;
      setConnectedRelays(connected);
      setTotalRelays(relays.length);
      
      // Show banner if offline or not enough relays connected
      setShowBanner(!navigator.onLine || (relays.length > 0 && connected === 0));
    };
    
    // Update immediately
    updateConnectionStatus();
    
    // Set interval to check periodically
    const interval = setInterval(updateConnectionStatus, 10000);
    
    // Listen for online/offline events
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', updateConnectionStatus);
      window.removeEventListener('offline', updateConnectionStatus);
    };
  }, []);
  
  if (!showBanner) return null;
  
  const handleReconnect = async () => {
    if (isReconnecting || isOffline) return;
    
    try {
      setIsReconnecting(true);
      toast.loading("Reconnecting to relays...");
      await nostrService.connectToUserRelays();
      
      // Check if connected after attempt
      const relays = nostrService.getRelayStatus();
      const connected = relays.filter(r => r.status === 'connected').length;
      
      if (connected > 0) {
        toast.success(`Connected to ${connected} relays`);
        setShowBanner(false);
      } else {
        toast.error("Couldn't connect to any relays");
      }
    } catch (error) {
      console.error("Reconnection error:", error);
      toast.error("Failed to reconnect to relays");
    } finally {
      setIsReconnecting(false);
    }
  };
  
  return (
    <Alert variant={isOffline ? "destructive" : "warning"} className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOffline ? (
            <WifiOff className="h-4 w-4" />
          ) : (
            <Wifi className="h-4 w-4" />
          )}
          <AlertDescription>
            {isOffline 
              ? "You're offline. Showing cached content only." 
              : `Not connected to relays (0/${totalRelays}). Limited functionality available.`}
          </AlertDescription>
        </div>
        <Button 
          size="sm" 
          onClick={handleReconnect}
          disabled={isOffline || isReconnecting}
          variant={isOffline ? "outline" : "secondary"}
        >
          {isReconnecting ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Reconnecting
            </>
          ) : (
            "Reconnect"
          )}
        </Button>
      </div>
    </Alert>
  );
}
