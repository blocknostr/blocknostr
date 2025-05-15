
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
    
    const wasConnected = isConnected;
    const nowConnected = connectedRelays.length > 0;
    
    setRelays(connectedRelays);
    setIsConnected(nowConnected);
    
    // Log relay status changes
    if (wasConnected !== nowConnected) {
      console.log(`[useNostrRelays] Relay connection status changed: ${nowConnected ? 'connected' : 'disconnected'}`);
    }
    
    return connectedRelays;
  }, [isConnected]);

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
    
    if (isConnecting) {
      console.log("[useNostrRelays] Already connecting to relays, skipping");
      return false;
    }
    
    console.log("[useNostrRelays] Connecting to relays...");
    setIsConnecting(true);
    
    try {
      // First try user's relays
      let connectedRelays = await nostrService.connectToUserRelays();
      
      // Ensure we have an array to work with
      connectedRelays = connectedRelays || [];
      
      // If no user relays connected, try fallbacks
      if (connectedRelays.length === 0 && fallbackRelays.length > 0) {
        console.log("[useNostrRelays] No user relays connected, trying fallbacks:", fallbackRelays);
        
        if (showToast) {
          toast("Connecting to fallback relays...");
        }
        
        // Try adding each fallback relay
        for (let i = 0; i < fallbackRelays.length; i++) {
          console.log(`[useNostrRelays] Trying fallback relay: ${fallbackRelays[i]}`);
          await nostrService.addRelay(fallbackRelays[i]);
        }
        
        // Check if we successfully connected to any fallbacks
        connectedRelays = refreshRelayStatus();
      }
      
      const success = connectedRelays.length > 0;
      setIsConnected(success);
      
      console.log(`[useNostrRelays] Connection ${success ? 'successful' : 'failed'}. Connected relays:`, connectedRelays);
      
      if (!success && showToast) {
        toast.error("Failed to connect to any relays", {
          description: "Please check your network connection or try again later"
        });
      }
      
      return success;
    } catch (error) {
      console.error("[useNostrRelays] Error connecting to relays:", error);
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
    const handleRelayConnected = (url: string) => {
      console.log(`[useNostrRelays] Relay connected: ${url}`);
      refreshRelayStatus();
    };
    
    const handleRelayDisconnected = (url: string) => {
      console.log(`[useNostrRelays] Relay disconnected: ${url}`);
      refreshRelayStatus();
    };
    
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
