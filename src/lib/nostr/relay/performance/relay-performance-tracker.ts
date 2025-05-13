/**
 * Tracks relay performance metrics to optimize connections
 */
class RelayPerformanceTracker {
  private metrics: Map<string, {
    responseTime: number[];
    successRate: number;
    lastUsed: number;
    score: number;
  }> = new Map();
  
  /**
   * Record a successful response from a relay
   */
  recordSuccess(relayUrl: string, responseTimeMs: number): void {
    const now = Date.now();
    const current = this.metrics.get(relayUrl) || {
      responseTime: [],
      successRate: 1,
      lastUsed: now,
      score: 50 // Default middle score
    };
    
    // Keep the last 10 response times
    current.responseTime.push(responseTimeMs);
    if (current.responseTime.length > 10) {
      current.responseTime.shift();
    }
    
    // Increase success rate
    current.successRate = Math.min(1, current.successRate * 0.9 + 0.1);
    current.lastUsed = now;
    
    // Calculate score based on response time and success rate
    const avgResponseTime = this.calculateAverage(current.responseTime);
    const recencyScore = Math.max(0, (now - current.lastUsed) / (24 * 60 * 60 * 1000));
    
    // Score formula: success rate (60%) + response time (30%) + recency (10%)
    current.score = (
      (current.successRate * 60) + 
      (Math.max(0, 1 - (avgResponseTime / 5000)) * 30) + 
      (Math.max(0, 1 - recencyScore) * 10)
    );
    
    this.metrics.set(relayUrl, current);
  }
  
  /**
   * Record a failed request to a relay
   */
  recordFailure(relayUrl: string): void {
    const now = Date.now();
    const current = this.metrics.get(relayUrl) || {
      responseTime: [],
      successRate: 0.5,
      lastUsed: now,
      score: 30 // Lower default score for failures
    };
    
    // Decrease success rate
    current.successRate = Math.max(0, current.successRate * 0.8 - 0.1);
    current.lastUsed = now;
    
    // Update score
    const avgResponseTime = this.calculateAverage(current.responseTime) || 5000;
    const recencyScore = Math.max(0, (now - current.lastUsed) / (24 * 60 * 60 * 1000));
    
    current.score = (
      (current.successRate * 60) + 
      (Math.max(0, 1 - (avgResponseTime / 5000)) * 30) + 
      (Math.max(0, 1 - recencyScore) * 10)
    );
    
    this.metrics.set(relayUrl, current);
  }
  
  /**
   * Get performance metrics for a relay
   */
  getRelayPerformance(relayUrl: string) {
    const metrics = this.metrics.get(relayUrl);
    if (!metrics) return null;
    
    return {
      avgResponseTime: this.calculateAverage(metrics.responseTime),
      successRate: metrics.successRate,
      score: metrics.score,
      lastUsed: metrics.lastUsed
    };
  }
  
  /**
   * Get the best performing relays
   */
  getBestRelays(count: number = 3) {
    return Array.from(this.metrics.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, count)
      .map(([url]) => url);
  }
  
  /**
   * Helper to calculate average
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  /**
   * Save metrics to local storage for persistence
   */
  saveMetrics(): void {
    try {
      localStorage.setItem('relay-performance', 
        JSON.stringify(Array.from(this.metrics.entries()))
      );
    } catch (error) {
      console.warn('Failed to save relay metrics to localStorage', error);
    }
  }
  
  /**
   * Load metrics from local storage
   */
  loadMetrics(): void {
    try {
      const stored = localStorage.getItem('relay-performance');
      if (stored) {
        this.metrics = new Map(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load relay metrics from localStorage', error);
    }
  }
}

// Export singleton instance
export const relayPerformanceTracker = new RelayPerformanceTracker();
relayPerformanceTracker.loadMetrics();

// Save metrics before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    relayPerformanceTracker.saveMetrics();
  });
}
