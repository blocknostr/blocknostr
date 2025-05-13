
import { useState, useEffect, useCallback } from 'react';
import { Relay } from '@/lib/nostr';
import { toast } from 'sonner';
import { useRelayLoading } from './useRelayLoading';
import { useRelayPublishing } from './useRelayPublishing';
import { useUserRelayLoader } from './useUserRelayLoader';

interface UseProfileRelaysProps {
  isCurrentUser: boolean;
  pubkey?: string;
}

/**
 * Enhanced hook to manage profile relay preferences with performance tracking and smart selection
 */
export function useProfileRelays({ isCurrentUser, pubkey }: UseProfileRelaysProps) {
  const [relays, setRelays] = useState<Relay[]>([]);
  const [healthCheckTimestamp, setHealthCheckTimestamp] = useState(Date.now());
  
  // Import sub-hooks
  const { isLoading, loadError } = useRelayLoading();
  const { publishRelayList } = useRelayPublishing();
  const { loadUserRelays } = useUserRelayLoader({ setRelays });

  // Function to refresh relay status with enhanced performance data
  const refreshRelays = useCallback(() => {
    if (isCurrentUser) {
      const { refreshCurrentUserRelays } = require('./relayRefreshUtils');
      refreshCurrentUserRelays(setRelays, setHealthCheckTimestamp);
    } else if (pubkey) {
      // Reload relays for another user
      loadUserRelays(pubkey);
    }
    
    // Trigger health check UI update
    setHealthCheckTimestamp(Date.now());
  }, [isCurrentUser, pubkey, loadUserRelays]);
  
  // Load initial relay status with improved error handling
  useEffect(() => {
    console.log("useProfileRelays: isCurrentUser =", isCurrentUser, "pubkey =", pubkey);
    
    if (isCurrentUser) {
      refreshRelays();
      
      // Set up periodic refresh every 10 seconds
      const intervalId = setInterval(refreshRelays, 10000);
      
      return () => clearInterval(intervalId);
    } else if (pubkey) {
      // Load relays for another user (NIP-65)
      loadUserRelays(pubkey);
      
      // Set up periodic refresh for other users too, but less frequently
      const intervalId = setInterval(() => loadUserRelays(pubkey), 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [isCurrentUser, pubkey, refreshRelays, loadUserRelays]);

  return { 
    relays, 
    setRelays, 
    isLoading,
    loadError,
    refreshRelays,
    healthCheckTimestamp,
    publishRelayList
  };
}
