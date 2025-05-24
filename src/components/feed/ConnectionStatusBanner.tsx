
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
      
      // Only show banner if browser is offline
      setShowBanner(!navigator.onLine);
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
  
  // We now only show the offline message, not the relay connection status
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
