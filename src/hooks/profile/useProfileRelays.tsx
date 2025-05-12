
import { useState, useEffect } from 'react';
import { nostrService, Relay } from '@/lib/nostr';
import { toast } from 'sonner';
import { parseRelayList } from '@/lib/nostr/utils/nip-utilities';

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
      // Load relays for another user (NIP-65)
      loadUserRelays(pubkey);
    }
  }, [isCurrentUser, pubkey]);
  
  // Function to load another user's relays according to NIP-65
  const loadUserRelays = async (userPubkey: string) => {
    setIsLoading(true);
    try {
      // First try to get the relay list using the new NIP-65 compliant method
      const relayUrls = await nostrService.getRelaysForUser(userPubkey);
      
      if (relayUrls && relayUrls.length > 0) {
        // Convert to Relay objects with disconnected status
        const relayObjects: Relay[] = relayUrls.map(url => ({
          url,
          status: 'disconnected',
          read: true,
          write: true
        }));
        
        setRelays(relayObjects);
      } else {
        // Fallback - let the user know we couldn't find relays
        toast.info("No relay preferences found for this user");
        setRelays([]);
      }
    } catch (error) {
      console.error("Error loading user relays:", error);
      toast.error("Failed to load user's relays");
      setRelays([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to publish user's relay preferences (NIP-65)
  const publishRelayList = async (relays: Relay[]): Promise<boolean> => {
    if (!isCurrentUser) return false;
    
    try {
      // Use the RelayAdapter's publishRelayList method if available
      if ('publishRelayList' in nostrService) {
        const success = await (nostrService as any).publishRelayList(relays);
        if (success) {
          toast.success("Relay preferences updated");
          return true;
        } else {
          toast.error("Failed to update relay preferences");
          return false;
        }
      }
      
      // Fallback implementation if the method isn't available
      const event = {
        kind: 10002,
        content: '',
        tags: relays.map(relay => {
          const tag = ['r', relay.url];
          if (relay.read) tag.push('read');
          if (relay.write) tag.push('write');
          return tag;
        })
      };
      
      // Use type assertion here to fix the TypeScript error
      const eventId = await (nostrService as any).publishEvent(event);
      if (eventId) {
        toast.success("Relay preferences updated");
        return true;
      } else {
        toast.error("Failed to update relay preferences");
        return false;
      }
    } catch (error) {
      console.error("Error publishing relay list:", error);
      toast.error("Failed to update relay preferences");
      return false;
    }
  };

  return { 
    relays, 
    setRelays, 
    isLoading, 
    refreshRelays,
    healthCheckTimestamp,
    publishRelayList
  };
}
