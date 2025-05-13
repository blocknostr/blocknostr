import { useState, useEffect, useCallback } from 'react';
import { nostrService } from '@/lib/nostr';
import { adaptedNostrService } from '@/lib/nostr/nostr-adapter';
import { Relay } from '@/lib/nostr';
import { toast } from 'sonner';
import { parseRelayList } from '@/lib/nostr/utils/nip';
import { relayPerformanceTracker } from '@/lib/nostr/relay/performance/relay-performance-tracker';
import { relaySelector } from '@/lib/nostr/relay/selection/relay-selector';
import { circuitBreaker } from '@/lib/nostr/relay/circuit/circuit-breaker';
import { retry } from '@/lib/utils/retry';

interface UseProfileRelaysProps {
  isCurrentUser: boolean;
  pubkey?: string;
}

/**
 * Enhanced hook to manage profile relay preferences with performance tracking and smart selection
 */
export function useProfileRelays({ isCurrentUser, pubkey }: UseProfileRelaysProps) {
  const [relays, setRelays] = useState<Relay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [healthCheckTimestamp, setHealthCheckTimestamp] = useState(Date.now());
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  
  // Function to refresh relay status with enhanced performance data
  const refreshRelays = useCallback(() => {
    if (isCurrentUser) {
      const relayStatus = adaptedNostrService.getRelayStatus();
      
      // Enhance with performance data
      const enhancedRelays = relayStatus.map(relay => {
        const perfData = relayPerformanceTracker.getRelayPerformance(relay.url);
        const circuitState = circuitBreaker.getState(relay.url);
        
        return {
          ...relay,
          score: perfData?.score || 50,
          avgResponse: perfData?.avgResponseTime,
          circuitState
        };
      });
      
      setRelays(enhancedRelays);
      console.log("Refreshed relay status:", enhancedRelays.length, "relays");
      
      // Check if we have any connected relays
      const connectedCount = enhancedRelays.filter(r => r.status === 'connected').length;
      if (connectedCount === 0 && retryCount < MAX_RETRIES) {
        console.warn("No connected relays found, attempting to reconnect...");
        
        // Try to connect to default relays plus some popular ones
        nostrService.connectToDefaultRelays()
          .then(() => {
            // Use relay selector to pick best relays to try
            const allRelays = [
              "wss://relay.damus.io", 
              "wss://nos.lol", 
              "wss://relay.nostr.band",
              "wss://relay.snort.social"
            ];
            
            const bestRelays = relaySelector.selectBestRelays(allRelays, {
              operation: 'both',
              count: 4  // Try all of them
            });
            
            return nostrService.addMultipleRelays(bestRelays);
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
  
  // Function to load another user's relays according to NIP-65 with enhanced resilience
  const loadUserRelays = async (userPubkey: string) => {
    setIsLoading(true);
    setLoadError(null);
    
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
            setTimeout(refreshRelays, 2000);
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
    } catch (error) {
      console.error("Error loading user relays:", error);
      toast.error("Failed to load user's relays");
      setLoadError("Failed to load relays");
      setRelays([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to publish user's relay preferences (NIP-65) with smart selection
  const publishRelayList = async (relays: Relay[]): Promise<boolean> => {
    if (!isCurrentUser) return false;
    
    try {
      // Sort relays by performance score before publishing
      const sortedRelays = [...relays].sort((a, b) => {
        // Sort by score if available
        if (a.score !== undefined && b.score !== undefined) {
          return b.score - a.score;
        }
        // Otherwise sort by status (connected first)
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
