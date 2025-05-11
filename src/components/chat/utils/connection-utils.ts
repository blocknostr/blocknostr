
import { useState, useCallback, useEffect } from "react";

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export const useConnectionStatus = (getRelayStatus: () => Array<{status: string}>, isOnline = true) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  
  const updateConnectionStatus = useCallback(() => {
    const relays = getRelayStatus();
    const connected = relays.filter(r => r.status === 'connected').length;
    
    if (connected > 0) {
      setConnectionStatus('connected');
      setError(null);
    } else if (relays.length === 0 || !isOnline) {
      setConnectionStatus('disconnected');
    } else {
      setConnectionStatus('connecting');
    }
  }, [getRelayStatus, isOnline]);
  
  return {
    connectionStatus,
    error,
    setError,
    updateConnectionStatus
  };
};
