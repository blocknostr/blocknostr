
import { adaptedNostrService } from '@/lib/nostr/nostr-adapter';
import { relayPerformanceTracker } from '@/lib/nostr/relay/performance/relay-performance-tracker';
import { relaySelector } from '@/lib/nostr/relay/selection/relay-selector';
import { circuitBreaker } from '@/lib/nostr/relay/circuit/circuit-breaker';
import { nostrService } from '@/lib/nostr';
import { Relay } from '@/lib/nostr';

/**
 * Refresh relay connections for the current user
 */
export function refreshCurrentUserRelays(
  setRelays: React.Dispatch<React.SetStateAction<Relay[]>>,
  setHealthCheckTimestamp: React.Dispatch<React.SetStateAction<number>>,
  retryCount: number = 0
): void {
  const MAX_RETRIES = 3;
  
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
      .then(() => refreshCurrentUserRelays(setRelays, setHealthCheckTimestamp, retryCount + 1))
      .catch(err => console.error("Failed to reconnect to relays:", err));
  }
}
