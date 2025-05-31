import { useState, useEffect, useCallback } from 'react';
import { nostrService } from '@/lib/nostr';
import { eventBus, EVENTS } from '@/lib/services/EventBus';
import { useAppSelector } from './redux';
import { selectConnectionStatusSafe } from '@/store/slices/chatSlice';

export function useRelays() {
  const [relays, setRelays] = useState<any[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // ✅ FIXED: Use centralized Redux connection status instead of local state
  const connectionStatusState = useAppSelector(selectConnectionStatusSafe);
  const connectionStatus = connectionStatusState.isConnected ? 'connected' : 'disconnected';

  // Function to refresh relay status
  const refreshRelays = useCallback(() => {
    const relayStatus = nostrService.getRelayStatus();
    setRelays(relayStatus);
  }, []);

  // ✅ SIMPLIFIED: Remove independent connection logic to prevent race conditions
  const connectToRelays = useCallback(async (customRelays?: string[]) => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    
    try {
      // First connect to user's relays
      await nostrService.connectToUserRelays();
      
      // If custom relays provided, add those too
      if (customRelays && customRelays.length > 0) {
        await nostrService.addMultipleRelays(customRelays);
      } else {
        // Otherwise use our default set of reliable FREE relays
        const defaultRelays = [
          "wss://relay.damus.io",      // Most reliable free relay
          "wss://nos.lol",             // High availability free relay
          "wss://relay.nostr.band",    // Comprehensive free relay
          "wss://offchain.pub",        // Fast European free relay
          "wss://relay.blocknostr.com" // BlockNostr relay
        ];
        
        await nostrService.addMultipleRelays(defaultRelays);
      }
      
      // Update relay status
      refreshRelays();
    } catch (error) {
      console.error("Error connecting to relays:", error);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, refreshRelays]);

  // ✅ FIXED: Reduced frequency and removed independent status checking
  useEffect(() => {
    const handleRelayConnected = () => refreshRelays();
    const handleRelayDisconnected = () => refreshRelays();
    
    eventBus.on(EVENTS.RELAY_CONNECTED, handleRelayConnected);
    eventBus.on(EVENTS.RELAY_DISCONNECTED, handleRelayDisconnected);
    
    // Initial relay status
    refreshRelays();
    
    // ✅ REDUCED: Much less frequent refresh to prevent spam (since we have events now)
    const intervalId = setInterval(refreshRelays, 120000); // Every 2 minutes instead of 1 minute
    
    return () => {
      eventBus.off(EVENTS.RELAY_CONNECTED, handleRelayConnected);
      eventBus.off(EVENTS.RELAY_DISCONNECTED, handleRelayDisconnected);
      clearInterval(intervalId);
    };
  }, [refreshRelays]);

  return {
    relays,
    isConnecting,
    connectionStatus,
    connectToRelays,
    refreshRelays
  };
}

