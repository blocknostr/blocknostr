
import { useState, useEffect, useCallback } from 'react';
import { nostrService } from '@/lib/nostr';
import { adaptedNostrService } from '@/lib/nostr/nostr-adapter';
import { Relay } from '@/lib/nostr';
import { toast } from 'sonner';
import { parseRelayList } from '@/lib/nostr/utils/nip';

interface UseProfileRelaysProps {
  isCurrentUser: boolean;
  pubkey?: string;
}

/**
 * Hook to manage profile relay preferences with improved type safety
 */
export function useProfileRelays({ isCurrentUser, pubkey }: UseProfileRelaysProps) {
  const [relays, setRelays] = useState<Relay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [healthCheckTimestamp, setHealthCheckTimestamp] = useState(Date.now());
  
  // Function to refresh relay status
  const refreshRelays = useCallback(() => {
    if (isCurrentUser) {
      const relayStatus = adaptedNostrService.getRelayStatus();
      setRelays(relayStatus);
      console.log("Refreshed relay status:", relayStatus.length, "relays");
    } else if (pubkey) {
      // Reload relays for another user
      loadUserRelays(pubkey);
    }
    
    // Trigger health check UI update
    setHealthCheckTimestamp(Date.now());
  }, [isCurrentUser, pubkey]);
  
  // Load initial relay status
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
    }
  }, [isCurrentUser, pubkey, refreshRelays]);
  
  // Function to load another user's relays according to NIP-65
  const loadUserRelays = async (userPubkey: string) => {
    setIsLoading(true);
    try {
      console.log("Loading relays for pubkey:", userPubkey);
      // First try to get the relay list using the new NIP-65 compliant method
      const relayUrls = await adaptedNostrService.getRelaysForUser(userPubkey);
      
      if (relayUrls && relayUrls.length > 0) {
        console.log("Found relay preferences:", relayUrls);
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
        console.log("No relay preferences found for user");
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
      // Use the adapter's publishRelayList method with proper typing
      const success = await adaptedNostrService.publishRelayList(relays);
      if (success) {
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
