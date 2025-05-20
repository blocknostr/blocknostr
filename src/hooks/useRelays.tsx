import { useState, useEffect, useCallback } from 'react';
import { nostrService } from '@/lib/nostr';
import { eventBus, EVENTS } from '@/lib/services/EventBus';
import { relaySelector } from '@/lib/nostr/relay/selection/relay-selector';

// List of 30 popular relays
const popularRelays = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.nostr.band",
  "wss://relay.snort.social",
  "wss://nostr.wine",
  "wss://purplepag.es",
  "wss://nostr.fmt.wiz.biz",
  "wss://relay.nostr.bg",
  "wss://nostr-pub.wellorder.net",
  "wss://nostr.oxtr.dev",
  "wss://nostr.mom",
  "wss://relay.nostr.com.au",
  "wss://eden.nostr.land",
  "wss://nostr.milou.lol",
  "wss://brb.io",
  "wss://nostr.rocks",
  "wss://relay.nostr.info",
  "wss://nostr.zebedee.cloud",
  "wss://nostr.string2.software",
  "wss://relay.nostr.ch",
  "wss://nostr.slothy.win",
  "wss://nostr.massmux.com",
  "wss://nostr.onsats.org",
  "wss://relay.nostr.vision",
  "wss://nostr.lu.ke",
  "wss://relay.nostrati.com",
  "wss://nostr.data.haus",
  "wss://relay.plebstr.com",
  "wss://nostr.inosta.cc",
  "wss://atlas.nostr.land"
];

export function useRelays() {
  const [relays, setRelays] = useState<any[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  // Function to refresh relay status
  const refreshRelays = useCallback(() => {
    const relayStatus = nostrService.getRelayStatus();
    setRelays(relayStatus);
    
    // Update connection status based on relay connections
    const connectedCount = relayStatus.filter(r => r.status === 'connected').length;
    
    if (connectedCount > 0) {
      setConnectionStatus('connected');
    } else if (isConnecting) {
      setConnectionStatus('connecting');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isConnecting]);

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
        // If no custom relays are provided, and potentially if connectToUserRelays didn't connect to enough,
        // use a selection from the popular relays list.
        // Let's try to connect to a subset of these, e.g., the best 10, to avoid too many connections.
        const bestPopularRelays = relaySelector.selectBestRelays(popularRelays, {
          operation: 'read', // or 'write' or 'general' depending on primary use case
          count: 10 // Connect to the best 10 from the popular list
        });
        
        console.log("Attempting to connect to best 10 popular relays:", bestPopularRelays);
        await nostrService.addMultipleRelays(bestPopularRelays);
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
