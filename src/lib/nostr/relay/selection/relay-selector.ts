
import { RelaySelectionOptions } from './types';
import { relayPerformanceTracker } from '../performance/relay-performance-tracker';

/**
 * Intelligent relay selector that chooses optimal relays based on performance metrics
 */
class RelaySelector {
  /**
   * Select best relays for a given operation
   */
  selectBestRelays(
    availableRelays: string[],
    options: RelaySelectionOptions
  ): string[] {
    if (!availableRelays.length) return [];
    
    // Get performance data for all available relays
    const relaysWithData = availableRelays.map(url => {
      const perfData = relayPerformanceTracker.getRelayPerformance(url);
      return {
        url,
        score: perfData?.score || 50,
        avgResponse: perfData?.avgResponseTime || 0
      };
    });
    
    // Apply minimum score filter if specified
    let filteredRelays = relaysWithData;
    if (options.minScore !== undefined) {
      filteredRelays = filteredRelays.filter(relay => relay.score >= (options.minScore || 0));
    }
    
    // Sort by score (higher first)
    filteredRelays.sort((a, b) => b.score - a.score);
    
    // Take the requested count, or all if fewer are available
    const selectedCount = Math.min(options.count, filteredRelays.length);
    return filteredRelays.slice(0, selectedCount).map(relay => relay.url);
  }
}

// Create and export singleton instance
export const relaySelector = new RelaySelector();
