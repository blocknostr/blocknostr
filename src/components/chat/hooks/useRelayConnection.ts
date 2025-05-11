
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
      
      // First try to connect to user relays
      await nostrService.connectToUserRelays();
      
      // Give relays a moment to establish connections
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if connected
      const isConnected = await checkConnection();
      
      if (!isConnected) {
        console.log("Failed to connect to user relays, trying default relays");
        // If user relays failed, try default relays
        await nostrService.connectToDefaultRelays();
        
        // Give relays a moment to establish connections
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check connection again
        await checkConnection();
      }
      
      // Final check
      const relayStatus = nostrService.getRelayStatus();
      const connectedRelay = relayStatus.some(relay => relay.status === 'connected');
      
      if (connectedRelay) {
        toast.success("Connected to relays");
        setConnectionStatus('connected');
        setLastConnectedTime(Date.now());
        setError(null);
      } else {
        setConnectionStatus('disconnected');
        setError('Could not connect to relays');
        toast.error("Failed to connect to any relays");
      }
    } catch (err) {
      console.error('Error reconnecting:', err);
      setConnectionStatus('disconnected');
      setError('Reconnection failed');
      toast.error("Failed to reconnect to relays");
    } finally {
      setIsReconnecting(false);
    }
  }, [isReconnecting, checkConnection]);
  
  // Initial connection
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        setConnectionStatus('connecting');
        console.log("Initializing relay connections...");
        
        // Try to connect to relays
        await nostrService.connectToUserRelays();
        
        // Give a moment for connections to establish
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check connections
        await checkConnection();
      } catch (err) {
        console.error("Error during initial connection:", err);
        setConnectionStatus('disconnected');
        setError("Connection initialization failed");
      }
    };
    
    initializeConnection();
  }, [checkConnection]);
  
  // Setup periodic check
  useEffect(() => {
    // Initial check
    checkConnection();
    
    // Periodic checks
    const interval = setInterval(async () => {
      const isConnected = await checkConnection();
      
      // If disconnected for more than 30 seconds, try to reconnect
      if (!isConnected && !isReconnecting && 
          lastConnectedTime && (Date.now() - lastConnectedTime > 30000)) {
        console.log("Auto-reconnecting after extended disconnection");
        reconnect();
      }
    }, CONNECTION_CHECK_INTERVAL);
    
    return () => {
      clearInterval(interval);
    };
  }, [checkConnection, isReconnecting, lastConnectedTime, reconnect]);
  
  return {
    connectionStatus,
    error,
    isReconnecting,
    reconnect
  };
};
