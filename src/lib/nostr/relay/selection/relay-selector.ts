
import { relayPerformanceTracker } from "../performance/relay-performance-tracker";
import { circuitBreaker, CircuitState } from "../circuit/circuit-breaker";

interface RelaySelectionOptions {
  operation: 'read' | 'write' | 'both';
  count: number;
  minScore?: number;
  requireWriteSupport?: boolean;
}

class RelaySelector {
  /**
   * Select the best relays for a given operation
   * @param relayUrls List of relay URLs to choose from
   * @param options Selection options
   * @returns Array of selected relay URLs
   */
  public selectBestRelays(relayUrls: string[], options: RelaySelectionOptions): string[] {
    if (!relayUrls.length) return [];
    
    // Create scoring function based on operation type
    const getRelayScore = (url: string): number => {
      // Check circuit breaker first - don't use broken relays
      if (circuitBreaker.getState(url) === CircuitState.OPEN) {
        return -1; // Negative score means "don't use"
      }
      
      // Get performance metrics
      const perfData = relayPerformanceTracker.getRelayPerformance(url);
      if (!perfData) {
        return 50; // Default score for relays without data
      }
      
      return perfData.score;
    };
    
    // Score and filter relays
    const scoredRelays = relayUrls
      .map(url => ({
        url,
        score: getRelayScore(url)
      }))
      .filter(relay => {
        // Skip relays with negative scores (circuit open)
        if (relay.score < 0) return false;
        
        // Apply minimum score filter if specified
        if (options.minScore !== undefined && relay.score < options.minScore) {
          return false;
        }
        
        return true;
      });
    
    // Sort by score (highest first)
    scoredRelays.sort((a, b) => b.score - a.score);
    
    // Return the requested number of relays
    return scoredRelays
      .slice(0, options.count)
      .map(relay => relay.url);
  }
}

// Export singleton instance for app-wide use
export const relaySelector = new RelaySelector();
