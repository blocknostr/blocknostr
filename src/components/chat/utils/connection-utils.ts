
import { useState, useCallback, useEffect } from "react";
import { Relay } from "@/lib/nostr/types";

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export const useConnectionStatus = (getRelayStatus: () => Relay[], isOnline = true) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastStatusChange, setLastStatusChange] = useState(Date.now());
  
  // Use this function to update the connection status with debouncing logic
  const updateConnectionStatus = useCallback(() => {
    const relays = getRelayStatus();
    const connected = relays.filter(r => r.status === 'connected').length;
    const now = Date.now();
    
    // Calculate the new status
    let newStatus: ConnectionStatus;
    
    if (connected > 0) {
      newStatus = 'connected';
      if (connectionStatus !== 'connected') {
        setError(null);
      }
    } else if (relays.length === 0 || !isOnline) {
      newStatus = 'disconnected';
      if (connectionAttempts > 3 && isOnline) {
        setError("Unable to connect to any relays after multiple attempts");
      }
    } else {
      newStatus = 'connecting';
      if (connectionAttempts > 5) {
        setError("Connection taking longer than expected");
      }
    }
    
    // Only update the status if it has been stable for a certain period
    // or if we're going from disconnected -> connected (that should be immediate)
    const minimumStableTime = 2000; // 2 seconds
    const statusChanged = newStatus !== connectionStatus;
    const stableTimeElapsed = (now - lastStatusChange) > minimumStableTime;
    const isImportantChange = connectionStatus === 'disconnected' && newStatus === 'connected';
    
    if (statusChanged && (stableTimeElapsed || isImportantChange)) {
      setConnectionStatus(newStatus);
      setLastStatusChange(now);
    }
    
    setConnectionAttempts(prev => prev + 1);
  }, [getRelayStatus, isOnline, connectionAttempts, connectionStatus, lastStatusChange]);
  
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
