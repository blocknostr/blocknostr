import { useState, useEffect, useCallback } from 'react';
import { nostrService } from '@/lib/nostr';
import { eventBus, EVENTS } from '@/lib/services/EventBus';
import { relaySelector } from '@/lib/nostr/relay/selection/relay-selector';
import type { Relay } from '@/lib/nostr';

export function useRelays() {
  const [relays, setRelays] = useState<Relay[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  // Function to refresh relay status
  const refreshRelays = useCallback(() => {
    const relayStatus = nostrService.getRelayStatus();
    setRelays(relayStatus);

    const connectedCount = relayStatus.filter(r => r.status === 'connected').length;
    setConnectionStatus(
      connectedCount === 0 ? 'disconnected' :
        connectedCount < relayStatus.length ? 'connected' : 'connected'
    );
  }, []);

  // Optimize connection to relays
  const connectToRelays = useCallback(async (customRelays?: string[]) => {
    if (isConnecting) return;

    setIsConnecting(true);
    setConnectionStatus('connecting');

    try {
      // First connect to user's relays
      await nostrService.connectToUserRelays();

      // If custom relays provided, add those too
      if (customRelays && customRelays.length > 0) {
        await nostrService.addMultipleRelays(customRelays);
      } else {
        // Otherwise use our default set of reliable relays
        const defaultRelays = [
          "wss://relay.damus.io",
          "wss://nos.lol",
          "wss://relay.nostr.band",
          "wss://relay.snort.social"
        ];

        // Use relay selector to pick most reliable ones
        const bestRelays = relaySelector.selectBestRelays(defaultRelays, {
          operation: 'read',
          count: 3
        });

        await nostrService.addMultipleRelays(bestRelays);
      }

      // Update relay status
      refreshRelays();
    } catch (error) {
      console.error("Error connecting to relays:", error);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, refreshRelays]);

  // Listen for relay connection changes
  useEffect(() => {
    const handleRelayConnected = () => refreshRelays();
    const handleRelayDisconnected = () => refreshRelays();

    eventBus.on(EVENTS.RELAY_CONNECTED, handleRelayConnected);
    eventBus.on(EVENTS.RELAY_DISCONNECTED, handleRelayDisconnected);

    // Initial relay status
    refreshRelays();

    // Set up periodic refresh
    const intervalId = setInterval(refreshRelays, 10000);

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
