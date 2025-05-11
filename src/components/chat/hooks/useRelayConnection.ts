
import { useState, useEffect, useCallback } from "react";
import { nostrService } from "@/lib/nostr";

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

/**
 * Hook to manage relay connection state
 */
export const useRelayConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  // Monitor connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionStatus('connecting');
        
        // Check if connected to at least one relay
        const relays = await nostrService.getRelays();
        const connectedRelay = relays.some(relay => relay.status === 1);
        
        if (connectedRelay) {
          setConnectionStatus('connected');
          setError(null);
        } else {
          setConnectionStatus('disconnected');
          setError('No connected relays');
          
          // Try to connect
          await nostrService.connectToUserRelays();
          
          // Check again after connection attempt
          const relaysAfterConnect = await nostrService.getRelays();
          const connectedRelayAfterConnect = relaysAfterConnect.some(relay => relay.status === 1);
          
          if (connectedRelayAfterConnect) {
            setConnectionStatus('connected');
            setError(null);
          } else {
            setConnectionStatus('disconnected');
            setError('Could not connect to relays');
          }
        }
      } catch (err) {
        console.error('Error checking connection:', err);
        setConnectionStatus('disconnected');
        setError('Connection error');
      }
    };
    
    // Initial check
    checkConnection();
    
    // Setup periodic check
    const interval = setInterval(checkConnection, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  // Function to manually reconnect
  const reconnect = useCallback(async () => {
    try {
      setIsReconnecting(true);
      setConnectionStatus('connecting');
      
      // Try to connect to relays
      await nostrService.connectToUserRelays();
      
      // Check if connected
      const relays = await nostrService.getRelays();
      const connectedRelay = relays.some(relay => relay.status === 1);
      
      if (connectedRelay) {
        setConnectionStatus('connected');
        setError(null);
      } else {
        setConnectionStatus('disconnected');
        setError('Could not connect to relays');
      }
    } catch (err) {
      console.error('Error reconnecting:', err);
      setConnectionStatus('disconnected');
      setError('Reconnection failed');
    } finally {
      setIsReconnecting(false);
    }
  }, []);
  
  return {
    connectionStatus,
    error,
    isReconnecting,
    reconnect
  };
};
