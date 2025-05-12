
/**
 * Selects the best relays for different operations
 */
export class RelaySelector {
  /**
   * Select the best relays for a specific operation
   */
  selectBestRelays(relayUrls: string[], options: {
    operation: 'read' | 'write' | 'both';
    count: number;
    requireWriteSupport?: boolean;
    minScore?: number;
  }): string[] {
    if (!relayUrls.length) return [];
    
    // If we have fewer relays than requested count, return all of them
    if (relayUrls.length <= options.count) {
      return [...relayUrls];
    }
    
    // For now, we'll just return a random selection
    // In a real implementation, this would use performance metrics
    return this.shuffleArray(relayUrls).slice(0, options.count);
  }
  
  /**
   * Shuffle an array using the Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

// Export a singleton instance
export const relaySelector = new RelaySelector();
