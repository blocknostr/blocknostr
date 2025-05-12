
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
 * Hook to manage profile relay preferences with improved type safety and connection reliability
 */
export function useProfileRelays({ isCurrentUser, pubkey }: UseProfileRelaysProps) {
  const [relays, setRelays] = useState<Relay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [healthCheckTimestamp, setHealthCheckTimestamp] = useState(Date.now());
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  
  // Function to refresh relay status with improved connection reliability
  const refreshRelays = useCallback(() => {
    if (isCurrentUser) {
      const relayStatus = adaptedNostrService.getRelayStatus();
      setRelays(relayStatus);
      console.log("Refreshed relay status:", relayStatus.length, "relays");
      
      // Check if we have any connected relays
      const connectedCount = relayStatus.filter(r => r.status === 'connected').length;
      if (connectedCount === 0 && retryCount < MAX_RETRIES) {
        console.warn("No connected relays found, attempting to reconnect...");
        
        // Try to connect to default relays plus some popular ones
        nostrService.connectToDefaultRelays()
          .then(() => {
            nostrService.addMultipleRelays([
              "wss://relay.damus.io", 
              "wss://nos.lol", 
              "wss://relay.nostr.band",
              "wss://relay.snort.social"
            ]);
            setRetryCount(prev => prev + 1);
          })
          .catch(err => console.error("Failed to reconnect to relays:", err));
      }
    } else if (pubkey) {
      // Reload relays for another user
      loadUserRelays(pubkey);
    }
    
    // Trigger health check UI update
    setHealthCheckTimestamp(Date.now());
  }, [isCurrentUser, pubkey, retryCount]);
  
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
  }, [isCurrentUser, pubkey, refreshRelays]);
  
  // Function to load another user's relays according to NIP-65 with improved resilience
  const loadUserRelays = async (userPubkey: string) => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log("Loading relays for pubkey:", userPubkey);
      
      // First ensure we're connected to some relays to find the user's relay list
      await nostrService.connectToUserRelays();
      
      // Add more popular relays to increase chances of finding relay lists
      await nostrService.addMultipleRelays([
        "wss://relay.damus.io", 
        "wss://nos.lol", 
        "wss://relay.nostr.band",
        "wss://relay.snort.social"
      ]);
      
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
        
        // Try connecting to these relays to get better data for this user
        nostrService.addMultipleRelays(relayUrls)
          .then(count => {
            console.log(`Connected to ${count} of user's preferred relays`);
            // Refresh relay status after connecting
            setTimeout(refreshRelays, 2000);
          })
          .catch(err => console.warn("Failed to connect to some user relays:", err));
      } else {
        // Fallback - let the user know we couldn't find relays
        console.log("No relay preferences found for user");
        toast.info("No relay preferences found for this user");
        
        // Use default relays as fallback
        const defaultRelays = [
          "wss://relay.damus.io", 
          "wss://nos.lol", 
          "wss://relay.nostr.band",
          "wss://relay.snort.social"
        ].map(url => ({
          url,
          status: 'disconnected',
          read: true,
          write: true
        }));
        
        setRelays(defaultRelays);
        
        // Try connecting to these default relays
        nostrService.addMultipleRelays(defaultRelays.map(r => r.url))
          .catch(err => console.warn("Failed to connect to fallback relays:", err));
      }
    } catch (error) {
      console.error("Error loading user relays:", error);
      toast.error("Failed to load user's relays");
      setLoadError("Failed to load relays");
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
    loadError,
    refreshRelays,
    healthCheckTimestamp,
    publishRelayList
  };
}
