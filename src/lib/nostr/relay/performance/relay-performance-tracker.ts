
/**
 * Tracks and analyzes performance metrics for each relay
 */
class RelayPerformanceTracker {
  private relayMetrics: Map<string, RelayMetrics> = new Map();
  
  // Track response time for a relay operation
  trackResponseTime(relayUrl: string, operation: string, responseTimeMs: number): void {
    const metrics = this.getOrCreateMetrics(relayUrl);
    
    // Update total response times and counts
    metrics.totalResponseTime += responseTimeMs;
    metrics.requestCount++;
    
    // Calculate new average
    metrics.avgResponseTime = metrics.totalResponseTime / metrics.requestCount;
    
    // Update operation-specific metrics
    if (!metrics.operationMetrics[operation]) {
      metrics.operationMetrics[operation] = {
        totalTime: 0,
        count: 0,
        avgTime: 0
      };
    }
    
    const opMetrics = metrics.operationMetrics[operation];
    opMetrics.totalTime += responseTimeMs;
    opMetrics.count++;
    opMetrics.avgTime = opMetrics.totalTime / opMetrics.count;
    
    // Update score based on response time
    this.updateScore(relayUrl, metrics);
  }
  
  // Record a failure for a relay
  recordFailure(relayUrl: string, operation: string, reason: string): void {
    const metrics = this.getOrCreateMetrics(relayUrl);
    metrics.failures++;
    metrics.lastFailure = Date.now();
    metrics.lastFailureReason = reason;
    
    // Penalize score for failures
    metrics.score = Math.max(0, metrics.score - 10);
  }
  
  // Update supported NIPs for a relay
  updateSupportedNips(relayUrl: string, nips: number[]): void {
    const metrics = this.getOrCreateMetrics(relayUrl);
    metrics.supportedNips = nips;
    
    // Adjust score based on NIP support
    // More NIPs generally means a more capable relay
    const nipBonus = Math.min(20, nips.length);
    metrics.score = Math.min(100, metrics.score + nipBonus);
  }
  
  // Get performance metrics for a relay
  getRelayPerformance(relayUrl: string): RelayMetrics | null {
    return this.relayMetrics.get(relayUrl) || null;
  }
  
  // Get just the score for a relay
  getRelayScore(relayUrl: string): number {
    return this.relayMetrics.get(relayUrl)?.score || 50; // Default to neutral score
  }
  
  // Reset metrics for a relay
  resetMetrics(relayUrl: string): void {
    this.relayMetrics.delete(relayUrl);
  }
  
  // Private helper to get or create metrics
  private getOrCreateMetrics(relayUrl: string): RelayMetrics {
    if (!this.relayMetrics.has(relayUrl)) {
      this.relayMetrics.set(relayUrl, {
        totalResponseTime: 0,
        requestCount: 0,
        avgResponseTime: 0,
        failures: 0,
        lastFailure: 0,
        lastFailureReason: '',
        score: 50, // Start with neutral score
        supportedNips: [],
        operationMetrics: {}
      });
    }
    
    return this.relayMetrics.get(relayUrl)!;
  }
  
  // Update score based on metrics
  private updateScore(relayUrl: string, metrics: RelayMetrics): void {
    // Base score adjustment on response time
    // Faster response = higher score
    const responseTimeScore = 
      metrics.avgResponseTime < 100 ? 20 :  // Very fast
      metrics.avgResponseTime < 250 ? 15 :  // Fast
      metrics.avgResponseTime < 500 ? 10 :  // Good
      metrics.avgResponseTime < 1000 ? 5 :  // Average
      metrics.avgResponseTime < 2000 ? 0 :  // Slow
      metrics.avgResponseTime < 5000 ? -5 : // Very slow
      -10;                                 // Extremely slow
    
    // Consider failure history
    const failurePenalty = Math.min(20, metrics.failures) * -2;
    
    // Time since last failure - failures become less important over time
    const timeSinceFailure = Date.now() - metrics.lastFailure;
    const failureRecovery = 
      timeSinceFailure > 24 * 60 * 60 * 1000 ? 10 :  // Recovered after 24h
      timeSinceFailure > 12 * 60 * 60 * 1000 ? 5 :   // Recovered after 12h
      timeSinceFailure > 1 * 60 * 60 * 1000 ? 2 :    // Recovered after 1h
      0;
    
    // Calculate new score
    metrics.score = Math.max(0, Math.min(100, 
      metrics.score + responseTimeScore + failurePenalty + failureRecovery
    ));
  }
}

// Type for relay metrics
interface RelayMetrics {
  totalResponseTime: number;
  requestCount: number;
  avgResponseTime: number;
  failures: number;
  lastFailure: number;
  lastFailureReason: string;
  score: number;
  supportedNips: number[];
  operationMetrics: Record<string, {
    totalTime: number;
    count: number;
    avgTime: number;
  }>;
}

// Export singleton instance
export const relayPerformanceTracker = new RelayPerformanceTracker();
