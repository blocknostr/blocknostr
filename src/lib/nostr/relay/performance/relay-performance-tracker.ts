/**
 * RelayPerformanceTracker
 * 
 * Tracks performance metrics for relays to guide intelligent relay selection
 */
export class RelayPerformanceTracker {
  private relayScores: Map<string, number> = new Map();
  private responseTimes: Map<string, number[]> = new Map();
  private failures: Map<string, number> = new Map();
  private lastResponse: Map<string, number> = new Map();
  private supportedNips: Map<string, number[]> = new Map();
  
  // Store up to 10 response times per relay for averaging
  private readonly MAX_TIMES_TO_KEEP = 10;
  
  /**
   * Track a response time for a specific operation
   * 
   * @param relayUrl The URL of the relay
   * @param operation The operation name
   * @param time The response time in milliseconds
   */
  trackResponseTime(relayUrl: string, operation: string, time: number): void {
    // Record last response time
    this.lastResponse.set(relayUrl, Date.now());
    
    // Add to response times list
    if (!this.responseTimes.has(relayUrl)) {
      this.responseTimes.set(relayUrl, []);
    }
    
    const times = this.responseTimes.get(relayUrl)!;
    times.push(time);
    
    // Keep only the last MAX_TIMES_TO_KEEP times
    if (times.length > this.MAX_TIMES_TO_KEEP) {
      times.shift(); // Remove oldest
    }
    
    this.responseTimes.set(relayUrl, times);
    
    // Update score
    this.updateScore(relayUrl);
  }
  
  /**
   * Record a failure for a relay operation
   * 
   * @param relayUrl The URL of the relay
   * @param operation The operation that failed
   * @param reason The reason for the failure
   */
  recordFailure(relayUrl: string, operation: string, reason: string): void {
    // Increment failure count
    const failures = this.failures.get(relayUrl) || 0;
    this.failures.set(relayUrl, failures + 1);
    
    // Update score
    this.updateScore(relayUrl);
  }
  
  /**
   * Update supported NIPs information for a relay
   * 
   * @param relayUrl The URL of the relay
   * @param nips Array of NIP numbers supported by the relay
   */
  updateSupportedNips(relayUrl: string, nips: number[]): void {
    this.supportedNips.set(relayUrl, nips);
    
    // Update score with NIP support information
    this.updateScore(relayUrl);
  }
  
  /**
   * Update performance score for a relay
   * 
   * @param relayUrl The URL of the relay
   */
  private updateScore(relayUrl: string): void {
    // Base score of 50
    let score = 50;
    
    // Response time factor (lower is better)
    const times = this.responseTimes.get(relayUrl);
    if (times && times.length > 0) {
      // Calculate average response time
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      
      // Score adjustment based on response time
      // <100ms: +20 points
      // 100-300ms: +10 points
      // 300-500ms: no change
      // 500-1000ms: -10 points
      // >1000ms: -20 points
      if (avgTime < 100) {
        score += 20;
      } else if (avgTime < 300) {
        score += 10;
      } else if (avgTime > 1000) {
        score -= 20;
      } else if (avgTime > 500) {
        score -= 10;
      }
    }
    
    // Failures factor (fewer is better)
    const failures = this.failures.get(relayUrl) || 0;
    score -= failures * 5; // -5 points per failure
    
    // NIP support factor
    const nips = this.supportedNips.get(relayUrl);
    if (nips) {
      // Important NIPs we especially want
      const criticalNips = [1, 4, 9, 10, 11, 20, 28, 33, 40, 42];
      
      // Count how many critical NIPs are supported
      const supportedCriticalNips = criticalNips.filter(n => nips.includes(n));
      
      // +2 points per critical NIP supported
      score += supportedCriticalNips.length * 2;
      
      // Bonus for having many NIPs
      if (nips.length > 30) score += 10;
      else if (nips.length > 20) score += 5;
    }
    
    // Cap score between 0 and 100
    score = Math.max(0, Math.min(100, score));
    
    // Store updated score
    this.relayScores.set(relayUrl, score);
  }
  
  /**
   * Get current score for a relay
   * 
   * @param relayUrl The URL of the relay
   * @returns Score between 0 and 100, or undefined if no data
   */
  getScore(relayUrl: string): number | undefined {
    return this.relayScores.get(relayUrl);
  }
  
  /**
   * Get average response time for a relay
   * 
   * @param relayUrl The URL of the relay
   * @returns Average response time in milliseconds, or undefined if no data
   */
  getAverageResponseTime(relayUrl: string): number | undefined {
    const times = this.responseTimes.get(relayUrl);
    if (!times || times.length === 0) {
      return undefined;
    }
    
    return times.reduce((a, b) => a + b, 0) / times.length;
  }
  
  /**
   * Get full performance data for a relay
   * 
   * @param relayUrl The URL of the relay
   * @returns Performance data object or undefined if no data
   */
  getRelayPerformance(relayUrl: string): {
    score: number;
    avgResponseTime?: number;
    failures: number;
    supportedNips?: number[];
  } | undefined {
    if (!this.relayScores.has(relayUrl)) {
      return undefined;
    }
    
    return {
      score: this.relayScores.get(relayUrl) || 50,
      avgResponseTime: this.getAverageResponseTime(relayUrl),
      failures: this.failures.get(relayUrl) || 0,
      supportedNips: this.supportedNips.get(relayUrl)
    };
  }
}

// Create and export a singleton instance
export const relayPerformanceTracker = new RelayPerformanceTracker();
