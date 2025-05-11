
import { useState, useEffect, useCallback } from "react";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

const CONNECTION_CHECK_INTERVAL = 20000; // Check connection every 20 seconds
const RECONNECT_ATTEMPT_DELAY = 3000; // Wait 3 seconds between reconnection attempts

/**
 * Hook to manage relay connection state with enhanced reliability
 */
export const useRelayConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastConnectedTime, setLastConnectedTime] = useState<number | null>(null);
  
  // Check if we have at least one connected relay
  const checkConnection = useCallback(async () => {
    try {
      // Check if connected to at least one relay
      const relayStatus = nostrService.getRelayStatus();
      console.log("Relay status:", relayStatus);
      
      const connectedRelay = relayStatus.some(relay => relay.status === 'connected');
      
      if (connectedRelay) {
        if (connectionStatus !== 'connected') {
          console.log("Connection established to at least one relay");
        }
        setConnectionStatus('connected');
        setLastConnectedTime(Date.now());
        setError(null);
        return true;
      } else {
        console.log("No connected relays found");
        
        // Only change to disconnected if we were previously connected or connecting for a while
        if (connectionStatus === 'connected') {
          console.error("Connection lost to all relays");
          toast.error("Connection to relays lost. Attempting to reconnect...");
        } else if (connectionStatus === 'connecting' && Date.now() - (lastConnectedTime || 0) > 10000) {
          console.error("Failed to connect to any relays");
        }
        
        setConnectionStatus('disconnected');
        setError('No connected relays');
        return false;
      }
    } catch (err) {
      console.error('Error checking connection:', err);
      setConnectionStatus('disconnected');
      setError('Connection error');
      return false;
    }
  }, [connectionStatus, lastConnectedTime]);
  
  // Function to manually reconnect
  const reconnect = useCallback(async () => {
    if (isReconnecting) return;
    
    try {
      setIsReconnecting(true);
      setConnectionStatus('connecting');
      console.log("Attempting to reconnect to relays...");
      
      // Try to connect to user relays first
      await nostrService.connectToUserRelays();
      
      // Check connection after connection attempt
      const connected = await checkConnection();
      
      if (connected) {
        toast.success("Reconnected to relays");
      } else {
        toast.error("Failed to reconnect to relays");
      }
      
      return connected;
    } catch (error) {
      console.error("Error during reconnection:", error);
      setError('Reconnection failed');
      setConnectionStatus('disconnected');
      toast.error("Failed to reconnect to relays");
      return false;
    } finally {
      setIsReconnecting(false);
    }
  }, [isReconnecting, checkConnection]);
  
  // Initial connection check and periodic checks
  useEffect(() => {
    // Check connection immediately
    checkConnection();
    
    // Set up periodic connection checks
    const intervalId = setInterval(() => {
      checkConnection();
    }, CONNECTION_CHECK_INTERVAL);
    
    // Cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }, [checkConnection]);
  
  return {
    connectionStatus,
    error,
    isReconnecting,
    reconnect,
    checkConnection
  };
};
