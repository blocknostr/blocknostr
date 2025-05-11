
import { useState, useCallback, useEffect } from "react";
import { Relay } from "@/lib/nostr/types";

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export const useConnectionStatus = (getRelayStatus: () => Relay[], isOnline = true) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  const updateConnectionStatus = useCallback(() => {
    const relays = getRelayStatus();
    const connected = relays.filter(r => r.status === 'connected').length;
    
    if (connected > 0) {
      setConnectionStatus('connected');
      setError(null);
    } else if (relays.length === 0 || !isOnline) {
      setConnectionStatus('disconnected');
      if (connectionAttempts > 3 && isOnline) {
        setError("Unable to connect to any relays after multiple attempts");
      }
    } else {
      setConnectionStatus('connecting');
      if (connectionAttempts > 5) {
        setError("Connection taking longer than expected");
      }
    }
    
    setConnectionAttempts(prev => prev + 1);
  }, [getRelayStatus, isOnline, connectionAttempts]);
  
  // Reset connection attempts when online status changes
  useEffect(() => {
    if (isOnline) {
      setConnectionAttempts(0);
    }
  }, [isOnline]);
  
  return {
    connectionStatus,
    error,
    setError,
    updateConnectionStatus,
    connectionAttempts
  };
};
