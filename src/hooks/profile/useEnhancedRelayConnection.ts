import { useState, useCallback, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';
import { relayPerformanceTracker } from '@/lib/nostr/relay/performance/relay-performance-tracker';
import { relaySelector } from '@/lib/nostr/relay/selection/relay-selector';
import { circuitBreaker } from '@/lib/nostr/relay/circuit/circuit-breaker';
import { CircuitState } from '@/lib/nostr/relay/circuit/circuit-breaker';
import { toast } from 'sonner';
import { Relay } from '@/lib/nostr';
import { ExtendedRelay } from "@/lib/nostr/types/extended-relay";

/**
 * Enhanced hook for relay connections with smart selection and circuit breaker
 */
export function useEnhancedRelayConnection(options: EnhancedRelayConnectionOptions = {}) {
  const [relays, setRelays] = useState<ExtendedRelay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [healthCheckTimestamp, setHealthCheckTimestamp] = useState(Date.now());
  const [requiredRelays, setRequiredRelays] = useState<string[]>([]);
  
  // Connect to user relays with smart selection
  const connectToRelays = useCallback(async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setIsLoading(true);
    
    try {
      // First ensure we have a base set of relays
      await nostrService.connectToUserRelays();
      
      // Get additional relays to try based on performance
      const currentRelays = nostrService.getRelayStatus();
      const currentUrls = currentRelays.map(r => r.url);
      
      // Calculate which relays to prioritize
      const readRelays = relaySelector.selectBestRelays(currentUrls, {
        operation: 'read',
        count: 3,
        minScore: 30
      });
      
      // Special case: if this is for a specific pubkey, try to get their relays
      if (options.pubkey) {
        try {
          const userRelays = await nostrService.getRelaysForUser(options.pubkey);
          if (userRelays && userRelays.length > 0) {
            console.log(`Found ${userRelays.length} relays for user ${options.pubkey}`);
            await nostrService.addMultipleRelays(userRelays);
            setRequiredRelays(userRelays);
          }
        } catch (error) {
          console.warn(`Failed to get relays for user ${options.pubkey}:`, error);
        }
      }
      
      // Always ensure we have some popular relays connected as fallback
      const popularRelays = [
        "wss://relay.damus.io", 
        "wss://nos.lol", 
        "wss://relay.nostr.band",
        "wss://relay.snort.social"
      ];
      
      // Filter out popular relays with open circuit breakers
      const availablePopularRelays = popularRelays.filter(url => {
        const state = circuitBreaker.getState(url);
        return state !== CircuitState.OPEN;
      });
      
      // Connect to popular relays as fallback
      if (availablePopularRelays.length > 0) {
        await nostrService.addMultipleRelays(availablePopularRelays);
      }
      
      // Get updated relay status
      refreshRelays();
    } catch (error) {
      console.error("Error connecting to relays:", error);
      toast.error("Failed to connect to relays");
    } finally {
      setIsConnecting(false);
      setIsLoading(false);
    }
  }, [isConnecting, options.pubkey]);
  
  // Refresh relay status with performance data
  const refreshRelays = useCallback(() => {
    const relayStatus = nostrService.getRelayStatus();
    
    // Enhance with performance data
    const enhancedRelays = relayStatus.map(relay => ({
      url: relay.url,
      read: true,  // Default assumption for UI
      write: true, // Default assumption for UI
      status: relay.status,
      score: relay.score,
      avgResponse: relay.avgResponse,
      circuitStatus: relay.circuitStatus,
      isRequired: !!options.requiredRelays?.includes(relay.url)
    })) as ExtendedRelay[];
    
    setRelays(enhancedRelays);
    setHealthCheckTimestamp(Date.now());
  }, [options.requiredRelays]);
  
  // Initial connection
  useEffect(() => {
    connectToRelays();
    
    // Set up interval to refresh status
    const intervalId = setInterval(refreshRelays, 10000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [connectToRelays, refreshRelays]);
  
  // Return needed values and functions
  return {
    relays,
    isLoading,
    isConnecting,
    healthCheckTimestamp,
    connectToRelays,
    refreshRelays
  };
}
