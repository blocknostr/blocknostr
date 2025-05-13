
import { relayPerformanceTracker } from '../performance/relay-performance-tracker';
import { circuitBreaker, CircuitState } from '../circuit/circuit-breaker';

interface RelaySelectionOptions {
  operation: 'read' | 'write' | 'both';
  count?: number;
  requireReadSupport?: boolean;
  requireWriteSupport?: boolean;
  minScore?: number;
}

/**
 * Intelligent relay selector that chooses the best relays for a given operation
 * based on performance metrics, circuit breaker status, and custom criteria
 */
export const relaySelector = {
  /**
   * Select the best performing relays for a given operation type
   * 
   * @param relays Array of relay URLs to choose from
   * @param options Selection options
   * @returns Array of selected relay URLs
   */
  selectBestRelays(relays: string[], options: RelaySelectionOptions): string[] {
    const {
      operation = 'both',
      count = 3,
      requireReadSupport = operation === 'read' || operation === 'both',
      requireWriteSupport = operation === 'write' || operation === 'both',
      minScore = 20
    } = options;
    
    // Filter relays based on criteria
    const filteredRelays = relays.filter(url => {
      // Skip closed relays
      if (circuitBreaker.getState(url) === CircuitState.OPEN) {
        return false;
      }
      
      // Get performance data from performance tracker
      const score = relayPerformanceTracker.getRelayScore ? 
        relayPerformanceTracker.getRelayScore(url) : 50; // Default score if method missing
      
      // Apply minimum score threshold
      if (score < minScore) {
        return false;
      }
      
      return true;
    });
    
    // Sort relays by score (descending)
    const sortedRelays = filteredRelays.sort((a, b) => {
      const scoreA = relayPerformanceTracker.getRelayScore ? 
        relayPerformanceTracker.getRelayScore(a) : 50;
      const scoreB = relayPerformanceTracker.getRelayScore ? 
        relayPerformanceTracker.getRelayScore(b) : 50;
      
      return scoreB - scoreA;
    });
    
    // Return the top N relays
    return sortedRelays.slice(0, count);
  }
};
