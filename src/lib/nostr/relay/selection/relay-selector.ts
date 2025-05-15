import { relayPerformanceTracker } from '../performance/relay-performance-tracker';
import { circuitBreaker, CircuitState } from '../circuit/circuit-breaker';

/**
 * Parameters for relay selection
 */
export interface RelaySelectionParams {
  operation: 'read' | 'write' | 'both';
  count?: number;
  requireWriteSupport?: boolean;
  preferredNips?: number[];
  requireNips?: number[];
  minScore?: number;
}

/**
 * Smart relay selection service
 */
export class RelaySelector {
  private readonly DEFAULT_RELIABLE_RELAYS = [
    "wss://relay.damus.io",
    "wss://nos.lol", 
    "wss://relay.nostr.band",
    "wss://relay.snort.social",
    "wss://purplepag.es"
  ];
  
  /**
   * Select the best relays based on performance and requirements
   * 
   * @param relays Array of relay URLs to choose from
   * @param params Selection parameters
   * @returns Array of selected relay URLs
   */
  selectBestRelays(relays: string[], params: RelaySelectionParams): string[] {
    if (!relays.length) {
      // Return some default relays if none provided
      return this.DEFAULT_RELIABLE_RELAYS.slice(0, 3);
    }
    
    const {
      operation = 'both',
      count = 3,
      requireWriteSupport = false,
      preferredNips = [],
      requireNips = [],
      minScore = 0
    } = params;
    
    // Filter out relays with open circuit breakers
    const availableRelays = relays.filter(url => {
      const state = circuitBreaker.getState(url);
      return state !== CircuitState.OPEN;
    });
    
    // If we have no available relays, reset circuit breakers for default relays
    if (availableRelays.length === 0) {
      console.warn("All relays have open circuit breakers, resetting some defaults");
      this.DEFAULT_RELIABLE_RELAYS.forEach(url => {
        circuitBreaker.reset(url);
      });
      
      // Use default relays as a fallback
      return this.DEFAULT_RELIABLE_RELAYS.slice(0, count);
    }
    
    // Create a scoring function based on the parameters
    const scoreRelay = (relayUrl: string): number => {
      // Get base performance score (0-100)
      let score = relayPerformanceTracker.getRelayScore(relayUrl);
      
      // Default score for new relays with no performance data
      if (score === 0) {
        // Give priority to known reliable relays
        if (this.DEFAULT_RELIABLE_RELAYS.includes(relayUrl)) {
          score = 70; // Good starting score for known relays
        } else {
          score = 50; // Average starting score for unknown relays
        }
      }
      
      // Get detailed performance data if available
      const perfData = relayPerformanceTracker.getRelayPerformance(relayUrl);
      
      // If we have supported NIPs data
      if (perfData?.supportedNips) {
        // Check required NIPs - if any are missing, score is 0
        if (requireNips.length) {
          for (const nip of requireNips) {
            if (!perfData.supportedNips.includes(nip)) {
              return 0; // Missing required NIP
            }
          }
        }
        
        // Bonus for preferred NIPs
        if (preferredNips.length) {
          const supportedPreferredNips = preferredNips.filter(nip => 
            perfData.supportedNips?.includes(nip)
          );
          
          // Add up to 20% bonus for preferred NIPs
          const nipBonus = (supportedPreferredNips.length / preferredNips.length) * 20;
          score += nipBonus;
        }
      }
      
      // Penalty for very high latency
      if (perfData?.avgResponseTime) {
        if (perfData.avgResponseTime > 2000) {
          score -= 20; // 20% penalty for very slow relays
        } else if (perfData.avgResponseTime < 500) {
          score += 10; // 10% bonus for very fast relays
        }
      }
      
      // Penalty for recent failures
      if (perfData?.metrics) {
        // Count failures in the metrics
        const failedMetrics = perfData.metrics.filter(m => !m.success).length;
        score -= Math.min(failedMetrics * 5, 40); // Up to 40% penalty
      }
      
      // Circuit breaker state impacts score
      const circuitState = circuitBreaker.getState(relayUrl);
      if (circuitState === CircuitState.HALF_OPEN) {
        score -= 30; // Significant penalty for half-open circuit
      }
      
      return score;
    };
    
    // Score and filter relays
    const scoredRelays = availableRelays
      .map(url => ({
        url,
        score: scoreRelay(url)
      }))
      .filter(item => item.score >= minScore)
      .sort((a, b) => b.score - a.score); // Sort by score descending
    
    // Return top N relays
    return scoredRelays
      .slice(0, count)
      .map(item => item.url);
  }
  
  /**
   * Select different relay sets for read and write operations
   * 
   * @param relays Array of relay URLs to choose from
   * @param readCount Number of read relays to select
   * @param writeCount Number of write relays to select
   * @returns Object with read and write relay arrays
   */
  selectRelaysByOperationType(
    relays: string[],
    readCount: number = 3,
    writeCount: number = 2
  ): { read: string[], write: string[] } {
    // Select write relays first (more stringent requirements)
    const writeRelays = this.selectBestRelays(relays, {
      operation: 'write',
      count: writeCount,
      requireWriteSupport: true,
      minScore: 40
    });
    
    // Then select read relays, excluding those already chosen for write
    const remainingRelays = relays.filter(url => !writeRelays.includes(url));
    const readRelays = this.selectBestRelays(remainingRelays, {
      operation: 'read',
      count: readCount,
      minScore: 30
    });
    
    return {
      read: readRelays,
      write: writeRelays
    };
  }
  
  /**
   * Find the fastest relay for a critical operation
   * @param relays Array of relay URLs to choose from
   * @returns The URL of the fastest relay or undefined
   */
  findFastestRelay(relays: string[]): string | undefined {
    if (!relays.length) return undefined;
    
    // Filter out relays with open circuit breakers
    const availableRelays = relays.filter(url => {
      const state = circuitBreaker.getState(url);
      return state !== CircuitState.OPEN;
    });
    
    // Fall back to all relays if none are available
    const candidateRelays = availableRelays.length > 0 ? availableRelays : relays;
    
    let fastestRelay: string | undefined;
    let fastestTime = Infinity;
    
    candidateRelays.forEach(url => {
      const perfData = relayPerformanceTracker.getRelayPerformance(url);
      if (perfData?.avgResponseTime && perfData.avgResponseTime < fastestTime) {
        fastestTime = perfData.avgResponseTime;
        fastestRelay = url;
      }
    });
    
    // If we don't have performance data, return a known good relay or the first relay
    if (!fastestRelay) {
      const defaultRelay = this.DEFAULT_RELIABLE_RELAYS.find(url => 
        relays.includes(url)
      );
      return defaultRelay || relays[0];
    }
    
    return fastestRelay;
  }
  
  /**
   * Get a balanced set of relays for optimal operations
   * @param relays Array of relay URLs to choose from
   * @param count Number of relays to select
   * @returns Array of selected relay URLs
   */
  getBalancedRelaySet(relays: string[], count: number = 4): string[] {
    // Make sure we have enough relays
    if (relays.length <= count) {
      return relays;
    }
    
    // Include known good relays in the selection
    const knownGoodRelays = relays.filter(url => 
      this.DEFAULT_RELIABLE_RELAYS.includes(url)
    );
    
    // Score remaining relays
    const otherRelays = relays.filter(url => 
      !this.DEFAULT_RELIABLE_RELAYS.includes(url)
    );
    
    const scoredOtherRelays = otherRelays
      .map(url => ({
        url,
        score: relayPerformanceTracker.getRelayScore(url)
      }))
      .sort((a, b) => b.score - a.score);
    
    // Combine known good relays with top-scoring others
    const combined = [
      ...knownGoodRelays,
      ...scoredOtherRelays.map(r => r.url)
    ];
    
    // Return unique relays up to count
    return [...new Set(combined)].slice(0, count);
  }
}

// Singleton instance
export const relaySelector = new RelaySelector();
