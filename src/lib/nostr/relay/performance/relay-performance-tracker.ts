/**
 * Tracks performance metrics for relays
 */
export class RelayPerformanceTracker {
  private relayMetrics: Map<string, {
    score: number;
    responseTime: number[];
    avgResponseTime: number;
    failures: number;
    successes: number;
    nips?: number[];
  }> = new Map();

  /**
   * Track response time for a relay operation
   */
  trackResponseTime(relayUrl: string, operation: string, timeMs: number): void {
    const metrics = this.getOrCreateMetrics(relayUrl);
    
    // Add to response times (keep last 10)
    metrics.responseTime.push(timeMs);
    if (metrics.responseTime.length > 10) {
      metrics.responseTime.shift();
    }
    
    // Update average
    metrics.avgResponseTime = this.calculateAverage(metrics.responseTime);
    
    // Update score based on response time
    if (timeMs < 300) {
      metrics.score = Math.min(100, metrics.score + 1);
    } else if (timeMs > 1000) {
      metrics.score = Math.max(0, metrics.score - 1);
    }
    
    // Record success
    metrics.successes++;
    
    // Update metrics
    this.relayMetrics.set(relayUrl, metrics);
  }

  /**
   * Record a failure for a relay
   */
  recordFailure(relayUrl: string, operation: string, reason: string): void {
    const metrics = this.getOrCreateMetrics(relayUrl);
    
    // Record failure
    metrics.failures++;
    
    // Update score
    metrics.score = Math.max(0, metrics.score - 3);
    
    // Update metrics
    this.relayMetrics.set(relayUrl, metrics);
  }

  /**
   * Get performance metrics for a relay
   */
  getRelayPerformance(relayUrl: string): { 
    score: number;
    avgResponseTime: number;
    failures: number;
    successes: number;
  } | null {
    const metrics = this.relayMetrics.get(relayUrl);
    if (!metrics) return null;
    
    return {
      score: metrics.score,
      avgResponseTime: metrics.avgResponseTime,
      failures: metrics.failures,
      successes: metrics.successes
    };
  }

  /**
   * Update the list of NIPs supported by a relay
   */
  updateSupportedNips(relayUrl: string, nips: number[]): void {
    const metrics = this.getOrCreateMetrics(relayUrl);
    metrics.nips = nips;
    this.relayMetrics.set(relayUrl, metrics);
  }

  /**
   * Check if a relay supports a specific NIP
   */
  supportsNip(relayUrl: string, nipNumber: number): boolean {
    const metrics = this.relayMetrics.get(relayUrl);
    if (!metrics || !metrics.nips) return false;
    
    return metrics.nips.includes(nipNumber);
  }
  
  /**
   * Get or create metrics for a relay
   */
  private getOrCreateMetrics(relayUrl: string) {
    return this.relayMetrics.get(relayUrl) || {
      score: 50, // Default score
      responseTime: [],
      avgResponseTime: 0,
      failures: 0,
      successes: 0
    };
  }
  
  /**
   * Calculate average of an array of numbers
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
  }
}

// Export a singleton instance
export const relayPerformanceTracker = new RelayPerformanceTracker();
