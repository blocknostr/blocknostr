
import { relayPerformanceTracker } from '../performance/relay-performance-tracker';

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
  /**
   * Select the best relays based on performance and requirements
   * 
   * @param relays Array of relay URLs to choose from
   * @param params Selection parameters
   * @returns Array of selected relay URLs
   */
  selectBestRelays(relays: string[], params: RelaySelectionParams): string[] {
    if (!relays.length) return [];
    
    const {
      operation = 'both',
      count = 3,
      requireWriteSupport = false,
      preferredNips = [],
      requireNips = [],
      minScore = 0
    } = params;
    
    // Create a scoring function based on the parameters
    const scoreRelay = (relayUrl: string): number => {
      // Get base performance score (0-100)
      let score = relayPerformanceTracker.getRelayScore(relayUrl);
      
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
      if (perfData?.avgResponseTime && perfData.avgResponseTime > 2000) {
        score -= 20; // 20% penalty for very slow relays
      }
      
      return score;
    };
    
    // Score and filter relays
    const scoredRelays = relays
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
    
    let fastestRelay: string | undefined;
    let fastestTime = Infinity;
    
    relays.forEach(url => {
      const perfData = relayPerformanceTracker.getRelayPerformance(url);
      if (perfData?.avgResponseTime && perfData.avgResponseTime < fastestTime) {
        fastestTime = perfData.avgResponseTime;
        fastestRelay = url;
      }
    });
    
    // If we don't have performance data, return the first relay
    return fastestRelay || relays[0];
  }
}

// Singleton instance
export const relaySelector = new RelaySelector();
