
import { useState, useEffect, useCallback } from 'react';
import { nostrService } from '@/lib/nostr';
import { adaptedNostrService } from '@/lib/nostr/nostr-adapter';
import { Relay } from '@/lib/nostr';
import { toast } from 'sonner';

interface UseProfileRelaysProps {
  isCurrentUser: boolean;
  pubkey?: string;
}

/**
 * Hook to manage profile relay preferences
 */
export function useProfileRelays({ isCurrentUser, pubkey }: UseProfileRelaysProps) {
  const [relays, setRelays] = useState<Relay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [healthCheckTimestamp, setHealthCheckTimestamp] = useState(Date.now());
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  
  // Function to refresh relay status
  const refreshRelays = useCallback(() => {
    if (isCurrentUser) {
      const relayStatus = adaptedNostrService.getRelayStatus();
      setRelays(relayStatus);
      
      // Check if we have any connected relays
      const connectedCount = relayStatus.filter(r => r.status === 'connected').length;
      if (connectedCount === 0 && retryCount < MAX_RETRIES) {
        console.warn("No connected relays found, attempting to reconnect...");
        
        // Try to connect to default relays plus some popular ones
        nostrService.connectToDefaultRelays()
          .then(() => {
            // Try to connect to popular relays
            const popularRelays = [
              "wss://relay.damus.io", 
              "wss://nos.lol", 
              "wss://relay.nostr.band",
              "wss://relay.snort.social"
            ];
            
            return nostrService.addMultipleRelays(popularRelays);
          })
          .then(() => setRetryCount(prev => prev + 1))
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
    if (isCurrentUser) {
      refreshRelays();
      
      // Set up periodic refresh every 10 seconds
      const intervalId = setInterval(refreshRelays, 10000);
      
      return () => clearInterval(intervalId);
    } else if (pubkey) {
      // Load relays for another user
      loadUserRelays(pubkey);
      
      // Set up periodic refresh for other users too, but less frequently
      const intervalId = setInterval(() => loadUserRelays(pubkey), 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [isCurrentUser, pubkey, refreshRelays]);
  
  // Function to load another user's relays
  const loadUserRelays = async (userPubkey: string) => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log("Loading relays for pubkey:", userPubkey);
      
      // Connect to some default relays first to discover user relays
      await nostrService.connectToUserRelays();
      
      // Add more popular relays to increase chances of finding relay lists
      await nostrService.addMultipleRelays([
        "wss://relay.damus.io", 
        "wss://nos.lol", 
        "wss://relay.nostr.band",
        "wss://relay.snort.social"
      ]);
      
      // Get user relays
      const relayUrls = await adaptedNostrService.getRelaysForUser(userPubkey)
        .catch(() => {
          // Return default relays as fallback
          console.log("No relay preferences found for user - using defaults");
          return [
            "wss://relay.damus.io", 
            "wss://nos.lol", 
            "wss://relay.nostr.band",
            "wss://relay.snort.social"
          ];
        });
      
      if (relayUrls && relayUrls.length > 0) {
        console.log("Found relay preferences:", relayUrls);
        
        // Convert to Relay objects with initial disconnected status
        const initialRelayObjects: Relay[] = relayUrls.map(url => ({
          url,
          status: 'disconnected' as const,
          read: true,
          write: true
        }));
        
        setRelays(initialRelayObjects);
      } else {
        // Fallback - let the user know we couldn't find relays
        console.log("No relay preferences found for user");
        toast.info("No relay preferences found for this user");
        
        // Use default relays as fallback
        const defaultRelays: Relay[] = [
          "wss://relay.damus.io", 
          "wss://nos.lol", 
          "wss://relay.nostr.band",
          "wss://relay.snort.social"
        ].map(url => ({
          url,
          status: 'disconnected' as const,
          read: true,
          write: true
        }));
        
        setRelays(defaultRelays);
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

  // Function to publish user's relay preferences
  const publishRelayList = async (relays: Relay[]): Promise<boolean> => {
    if (!isCurrentUser) return false;
    
    try {
      // Sort relays by status before publishing
      const sortedRelays = [...relays].sort((a, b) => {
        // Sort by status (connected first)
        return a.status === 'connected' ? -1 : 1;
      });
      
      // Use the enhanced adapter method
      const success = await adaptedNostrService.publishRelayList(sortedRelays);
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
