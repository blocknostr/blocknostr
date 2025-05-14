
import { useState, useEffect, useCallback } from 'react';
import { nostrService } from '@/lib/nostr';
import { eventBus, EVENTS } from '@/lib/services/EventBus';
import { relaySelector } from '@/lib/nostr/relay/selection/relay-selector';
import { ConnectionPool } from '@/lib/nostr/relay/connection-pool';

export function useRelays() {
  const [relays, setRelays] = useState<any[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const connectionPool = ConnectionPool.getInstance();

  // Function to refresh relay status
  const refreshRelays = useCallback(() => {
    // Get status from both the service and the connection pool
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
    
    // Log connection metrics from the pool
    const metrics = connectionPool.getMetrics();
    console.log(`Relay metrics: ${metrics.activeConnections}/${metrics.totalConnections} active connections (max: ${metrics.maxConnections})`);
  }, [isConnecting, connectionPool]);

  // Optimize connection to relays
  const connectToRelays = useCallback(async (customRelays?: string[]) => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setConnectionStatus('connecting');
    
    try {
      // Use our connection pool for relay connections
      if (customRelays && customRelays.length > 0) {
        await connectionPool.connectToRelays(customRelays);
      } else {
        // First connect to user's relays
        await nostrService.connectToUserRelays();
        
        // Use default set of reliable relays
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
        
        await connectionPool.connectToRelays(bestRelays);
      }
      
      // Update relay status
      refreshRelays();
    } catch (error) {
      console.error("Error connecting to relays:", error);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, refreshRelays, connectionPool]);

  // Listen for relay connection changes
  useEffect(() => {
    const handleRelayConnected = () => refreshRelays();
    const handleRelayDisconnected = () => refreshRelays();
    
    eventBus.on(EVENTS.RELAY_CONNECTED, handleRelayConnected);
    eventBus.on(EVENTS.RELAY_DISCONNECTED, handleRelayDisconnected);
    
    // Initial relay status
    refreshRelays();
    
    // Set up periodic refresh - reduced interval to catch problems earlier
    const intervalId = setInterval(refreshRelays, 5000);
    
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
