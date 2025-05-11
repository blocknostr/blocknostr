
import { useState, useEffect } from 'react';
import { nostrService, Relay } from '@/lib/nostr';
import { toast } from 'sonner';

interface UseProfileRelaysProps {
  isCurrentUser: boolean;
  pubkey?: string;
}

export function useProfileRelays({ isCurrentUser, pubkey }: UseProfileRelaysProps) {
  const [relays, setRelays] = useState<Relay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [healthCheckTimestamp, setHealthCheckTimestamp] = useState(Date.now());
  
  // Function to refresh relay status
  const refreshRelays = () => {
    if (isCurrentUser) {
      const relayStatus = nostrService.getRelayStatus();
      setRelays(relayStatus);
    }
    // Trigger health check UI update
    setHealthCheckTimestamp(Date.now());
  };
  
  // Load initial relay status
  useEffect(() => {
    if (isCurrentUser) {
      refreshRelays();
      
      // Set up periodic refresh every 10 seconds
      const intervalId = setInterval(refreshRelays, 10000);
      
      return () => clearInterval(intervalId);
    } else if (pubkey) {
      // Load relays for another user
      loadUserRelays(pubkey);
    }
  }, [isCurrentUser, pubkey]);
  
  // Function to load another user's relays
  const loadUserRelays = async (userPubkey: string) => {
    setIsLoading(true);
    try {
      const userRelays = await nostrService.getRelaysForUser(userPubkey);
      
      // Convert to Relay objects with disconnected status
      const relayObjects: Relay[] = userRelays.map(url => ({
        url,
        status: 'disconnected',
        read: true,
        write: true
      }));
      
      setRelays(relayObjects);
    } catch (error) {
      console.error("Error loading user relays:", error);
      toast.error("Failed to load user's relays");
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    relays, 
    setRelays, 
    isLoading, 
    refreshRelays,
    healthCheckTimestamp
  };
}
