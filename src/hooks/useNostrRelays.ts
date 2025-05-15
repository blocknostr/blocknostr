
import { useState, useEffect, useCallback } from 'react';
import { nostrService } from '@/lib/nostr';
import { eventBus, EVENTS } from '@/lib/services/EventBus';
import { toast } from 'sonner';

/**
 * Hook to manage Nostr relay connections with better error handling and state management
 */
export function useNostrRelays() {
  const [relays, setRelays] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // Function to get current relay status
  const refreshRelayStatus = useCallback(() => {
    const relayStatus = nostrService.getRelayStatus();
    const connectedRelays = relayStatus
      .filter(relay => relay.status === 'connected')
      .map(relay => relay.url);
    
    setRelays(connectedRelays);
    setIsConnected(connectedRelays.length > 0);
    
    return connectedRelays;
  }, []);

  // Connection function with improved error handling
  const connectToRelays = useCallback(async (options?: { 
    showToast?: boolean,
    fallbackRelays?: string[],
    retryCount?: number 
  }) => {
    const { 
      showToast = true, 
      fallbackRelays = ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.nostr.band"], 
      retryCount = 2 
    } = options || {};
    
    if (isConnecting) return false;
    
    setIsConnecting(true);
    
    try {
      // First try user's relays
      let connectedRelays = await nostrService.connectToUserRelays();
      
      // Ensure we have an array to work with
      connectedRelays = connectedRelays || [];
      
      // If no user relays connected, try fallbacks
      if (connectedRelays.length === 0 && fallbackRelays.length > 0) {
        if (showToast) {
          toast("Connecting to fallback relays...");
        }
        
        // Try adding each fallback relay
        for (let i = 0; i < fallbackRelays.length; i++) {
          await nostrService.addRelay(fallbackRelays[i]);
        }
        
        // Check if we successfully connected to any fallbacks
        connectedRelays = refreshRelayStatus();
      }
      
      const success = connectedRelays.length > 0;
      setIsConnected(success);
      
      if (!success && showToast) {
        toast.error("Failed to connect to any relays", {
          description: "Please check your network connection or try again later"
        });
      }
      
      return success;
    } catch (error) {
      console.error("Error connecting to relays:", error);
      if (showToast) {
        toast.error("Connection error", {
          description: "Failed to connect to Nostr relays"
        });
      }
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, refreshRelayStatus]);

  // Listen for relay connection changes
  useEffect(() => {
    const handleRelayConnected = () => refreshRelayStatus();
    const handleRelayDisconnected = () => refreshRelayStatus();
    
    eventBus.on(EVENTS.RELAY_CONNECTED, handleRelayConnected);
    eventBus.on(EVENTS.RELAY_DISCONNECTED, handleRelayDisconnected);
    
    // Initial check
    refreshRelayStatus();
    
    return () => {
      eventBus.off(EVENTS.RELAY_CONNECTED, handleRelayConnected);
      eventBus.off(EVENTS.RELAY_DISCONNECTED, handleRelayDisconnected);
    };
  }, [refreshRelayStatus]);

  return {
    relays,
    isConnecting,
    isConnected,
    connectToRelays,
    refreshRelayStatus
  };
}
