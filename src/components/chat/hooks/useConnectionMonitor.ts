
import { useEffect, useCallback } from "react";

const RETRY_INTERVAL = 5000; // 5 seconds for retry

export const useConnectionMonitor = (
  setupSubscriptions: () => Promise<string[]>,
  updateConnectionStatus: () => void,
  nostrService: any,
  subscriptions: string[]
) => {
  // Setup monitoring of connection status
  useEffect(() => {
    let statusInterval: number;
    let reconnectTimeout: number;
    
    const init = async () => {
      const subs = await setupSubscriptions();
      
      // Set up connection status check interval
      statusInterval = window.setInterval(() => {
        updateConnectionStatus();
        
        // Check if we're still connected to any relays
        const relayStatus = nostrService.getRelayStatus();
        const connectedCount = relayStatus.filter((r: any) => r.status === 'connected').length;
        
        // If we have no connections but we have subscriptions, try to reconnect
        if (connectedCount === 0 && subs.length > 0 && navigator.onLine) {
          console.log("No connected relays detected, scheduling reconnection");
          
          // Clear any existing reconnect timeout
          if (reconnectTimeout) {
            window.clearTimeout(reconnectTimeout);
          }
          
          // Schedule reconnect
          reconnectTimeout = window.setTimeout(() => {
            console.log("Attempting to reconnect to relays");
            setupSubscriptions();
          }, RETRY_INTERVAL);
        }
      }, RETRY_INTERVAL);
    };
    
    init();
    
    // Cleanup function
    return () => {
      if (statusInterval) clearInterval(statusInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [setupSubscriptions, updateConnectionStatus, nostrService, subscriptions]);
};
