import { nostrService } from './index';
import { relaySelector } from './relay/selection/relay-selector';
import { circuitBreaker } from './relay/circuit/circuit-breaker';
import { relayPerformanceTracker } from './relay/performance/relay-performance-tracker';

/**
 * Adapter that enhances Nostr service with performance optimizations
 */
class NostrAdapter {
  /**
   * Optimized method to get user profile with performance tracking
   */
  async getUserProfile(pubkey: string) {
    const start = performance.now();
    
    try {
      // Get profile through regular service
      const profile = await nostrService.getUserProfile(pubkey);
      
      // Record success and response time
      const responseTime = performance.now() - start;
      const connectedRelays = nostrService.getRelayStatus()
        .filter(r => r.status === 'connected')
        .map(r => r.url);
      
      // Record performance for all connected relays
      connectedRelays.forEach(url => {
        relayPerformanceTracker.recordSuccess(url, responseTime / connectedRelays.length);
      });
      
      return profile;
    } catch (error) {
      // Record failure for connected relays
      const connectedRelays = nostrService.getRelayStatus()
        .filter(r => r.status === 'connected')
        .map(r => r.url);
      
      connectedRelays.forEach(url => {
        relayPerformanceTracker.recordFailure(url);
      });
      
      throw error;
    }
  }
  
  /**
   * Get user's relays with optimized approach
   */
  async getRelaysForUser(pubkey: string): Promise<string[]> {
    try {
      // Select best relays for relay list discovery
      const bestRelays = relaySelector.getRecommendedRelays('read', 4);
      
      // Connect to these optimal relays
      for (const url of bestRelays) {
        if (!circuitBreaker.isCircuitOpen(url)) {
          try {
            await nostrService.connectToRelay(url);
          } catch (error) {
            circuitBreaker.recordFailure(url);
          }
        }
      }
      
      // Now get the user's relay list
      // This will be implemented with NIP-65 support
      // For now returning an empty array as placeholder
      return [];
    } catch (error) {
      console.error("Failed to get relays for user:", error);
      return [];
    }
  }
  
  /**
   * Publish user's relay list with optimized approach
   */
  async publishRelayList(relays: any[]): Promise<boolean> {
    try {
      // Select best relays for publishing
      const bestRelays = relaySelector.getRecommendedRelays('write', 3);
      
      // Connect to these optimal relays
      for (const url of bestRelays) {
        if (!circuitBreaker.isCircuitOpen(url)) {
          try {
            await nostrService.connectToRelay(url);
          } catch (error) {
            circuitBreaker.recordFailure(url);
          }
        }
      }
      
      // Placeholder for publishing relay list
      // Will be implemented with NIP-65 support
      return true;
    } catch (error) {
      console.error("Failed to publish relay list:", error);
      return false;
    }
  }
  
  /**
   * Get relay status with enhanced information
   */
  getRelayStatus() {
    const relayStatus = nostrService.getRelayStatus();
    
    // Enhance with performance data
    return relayStatus.map(relay => {
      const perfData = relayPerformanceTracker.getRelayPerformance(relay.url);
      const circuitState = circuitBreaker.getState(relay.url);
      
      return {
        ...relay,
        performance: perfData,
        circuitState
      };
    });
  }
}

// Export singleton instance
export const adaptedNostrService = new NostrAdapter();
