
import { useCallback } from 'react';
import { Relay } from '@/lib/nostr';
import { toast } from 'sonner';
import { nostrService } from '@/lib/nostr';
import { adaptedNostrService } from '@/lib/nostr/nostr-adapter';
import { relaySelector } from '@/lib/nostr/relay/selection/relay-selector';
import { retry } from '@/lib/utils/retry';
import { useRelayLoading } from './useRelayLoading';

interface UseUserRelayLoaderProps {
  setRelays: React.Dispatch<React.SetStateAction<Relay[]>>;
}

/**
 * Hook for loading user relay information
 */
export function useUserRelayLoader({ setRelays }: UseUserRelayLoaderProps) {
  const { startLoading, endLoading } = useRelayLoading();

  // Function to load another user's relays according to NIP-65 with enhanced resilience
  const loadUserRelays = useCallback(async (userPubkey: string) => {
    startLoading();
    
    try {
      console.log("Loading relays for pubkey:", userPubkey);
      
      // Use retry utility for better resilience
      const userRelays = await retry(
        async () => {
          // First ensure we're connected to some relays to find the user's relay list
          await nostrService.connectToUserRelays();
          
          // Add more popular relays to increase chances of finding relay lists
          await nostrService.addMultipleRelays([
            "wss://relay.damus.io", 
            "wss://nos.lol", 
            "wss://relay.nostr.band",
            "wss://relay.snort.social"
          ]);
          
          // Use the enhanced adapter method to get user relays
          const relayUrls = await adaptedNostrService.getRelaysForUser(userPubkey);
          if (!relayUrls || relayUrls.length === 0) {
            throw new Error("No relays found for user");
          }
          
          return relayUrls;
        },
        {
          maxAttempts: 2,
          baseDelay: 2000,
          onRetry: () => console.log("Retrying relay discovery...")
        }
      ).catch(() => {
        // Return default relays as fallback
        console.log("No relay preferences found for user - using defaults");
        return [
          "wss://relay.damus.io", 
          "wss://nos.lol", 
          "wss://relay.nostr.band",
          "wss://relay.snort.social"
        ];
      });
      
      if (userRelays && userRelays.length > 0) {
        console.log("Found relay preferences:", userRelays);
        
        // Convert to Relay objects with initial disconnected status
        const initialRelayObjects: Relay[] = userRelays.map(url => ({
          url,
          status: 'disconnected' as const,
          read: true,
          write: true
        }));
        
        setRelays(initialRelayObjects);
        
        // Use relay selector to prioritize which relays to connect to
        const prioritizedRelays = relaySelector.selectBestRelays(
          userRelays,
          { operation: 'read', count: Math.min(4, userRelays.length) }
        );
        
        // Try connecting to these prioritized relays
        nostrService.addMultipleRelays(prioritizedRelays)
          .then(count => {
            console.log(`Connected to ${count} of user's preferred relays`);
            // Refresh relay status after connecting
            setTimeout(() => {
              const { refreshCurrentUserRelays } = require('./relayRefreshUtils');
              refreshCurrentUserRelays(setRelays, () => {});
            }, 2000);
          })
          .catch(err => console.warn("Failed to connect to some user relays:", err));
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
        
        // Use relay selector for fallback relays
        const bestRelays = relaySelector.selectBestRelays(
          defaultRelays.map(r => r.url),
          { operation: 'read', count: 4 }
        );
        
        // Try connecting to selected fallback relays
        nostrService.addMultipleRelays(bestRelays)
          .catch(err => console.warn("Failed to connect to fallback relays:", err));
      }

      endLoading();
    } catch (error) {
      console.error("Error loading user relays:", error);
      toast.error("Failed to load user's relays");
      endLoading("Failed to load relays");
      setRelays([]);
    }
  }, [setRelays, startLoading, endLoading]);

  return { loadUserRelays };
}
