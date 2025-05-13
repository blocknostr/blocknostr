
import { relayPerformanceTracker } from "../performance/relay-performance-tracker";

interface RelaySelectionOptions {
  operation: 'read' | 'write' | 'both';
  count?: number;
  preference?: 'speed' | 'reliability' | 'balanced';
}

/**
 * Intelligent relay selection based on performance metrics
 */
class RelaySelector {
  /**
   * Select best relays based on criteria
   */
  selectBestRelays(relays: string[], options: RelaySelectionOptions): string[] {
    const count = options.count || 3;
    const preference = options.preference || 'balanced';
    
    // Get performance metrics for each relay
    const relaysWithMetrics = relays.map(url => {
      const metrics = relayPerformanceTracker.getRelayPerformance(url);
      return {
        url,
        score: metrics?.score || 50,
        responseTime: metrics?.avgResponseTime || 500,
        successRate: metrics?.successRate || 0.5
      };
    });
    
    // Sort relays based on preference
    let sortedRelays: typeof relaysWithMetrics;
    
    switch (preference) {
      case 'speed':
        sortedRelays = relaysWithMetrics.sort((a, b) => a.responseTime - b.responseTime);
        break;
      case 'reliability':
        sortedRelays = relaysWithMetrics.sort((a, b) => b.successRate - a.successRate);
        break;
      case 'balanced':
      default:
        sortedRelays = relaysWithMetrics.sort((a, b) => b.score - a.score);
    }
    
    // Return the best relays
    return sortedRelays.slice(0, count).map(r => r.url);
  }
  
  /**
   * Get recommended relays for a specific operation
   */
  getRecommendedRelays(operation: 'read' | 'write' | 'both', count: number = 3): string[] {
    // Start with known good relays
    const knownRelays = [
      "wss://relay.damus.io",
      "wss://nos.lol",
      "wss://relay.nostr.band",
      "wss://relay.snort.social"
    ];
    
    // Get additional relays from performance tracker
    const bestRelays = relayPerformanceTracker.getBestRelays(5);
    
    // Combine both sources (removing duplicates)
    const allRelays = Array.from(new Set([...knownRelays, ...bestRelays]));
    
    return this.selectBestRelays(allRelays, { operation, count, preference: 'balanced' });
  }
}

// Export singleton instance
export const relaySelector = new RelaySelector();
