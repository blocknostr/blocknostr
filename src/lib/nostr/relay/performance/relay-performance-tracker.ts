
import { RelayPerformanceData, OperationMetrics } from './types';

/**
 * Tracks performance metrics for relays to optimize relay selection
 */
class RelayPerformanceTracker {
  private relayData: Map<string, RelayPerformanceData> = new Map();
  private readonly MAX_RESPONSE_TIME = 5000; // 5 seconds max response time
  private readonly DECAY_INTERVAL = 3600000; // 1 hour in milliseconds
  private decayTimer: NodeJS.Timeout | null = null;
  
  constructor() {
    this.startDecayTimer();
  }
  
  /**
   * Start timer to gradually decay scores for inactive relays
   */
  private startDecayTimer() {
    if (typeof window !== 'undefined') {
      this.decayTimer = setInterval(() => this.decayScores(), this.DECAY_INTERVAL);
    }
  }
  
  /**
   * Decay scores for relays that haven't been updated recently
   */
  private decayScores() {
    const now = Date.now();
    
    this.relayData.forEach((data, url) => {
      // If relay hasn't been updated in the last hour, decay its score
      const hoursSinceLastUpdate = (now - data.lastUpdated) / this.DECAY_INTERVAL;
      
      if (hoursSinceLastUpdate >= 1) {
        // Decay score by 5% per hour of inactivity, to a minimum of 10
        const decayFactor = Math.pow(0.95, hoursSinceLastUpdate);
        data.score = Math.max(10, Math.round(data.score * decayFactor));
        this.relayData.set(url, data);
      }
    });
  }
  
  /**
   * Track response time for relay operations
   */
  trackResponseTime(relayUrl: string, operation: string, responseTime: number): void {
    const data = this.getOrCreateRelayData(relayUrl);
    
    // Get operation data or create if it doesn't exist
    const opData = data.operations[operation] || { successCount: 0, failureCount: 0, totalTime: 0 };
    
    // Update operation metrics
    opData.successCount++;
    opData.totalTime += responseTime;
    
    // Update relay data
    data.operations[operation] = opData;
    data.successCount++;
    
    // Calculate new average response time across all operations
    let totalTime = 0;
    let totalOps = 0;
    
    Object.values(data.operations).forEach(op => {
      totalTime += op.totalTime;
      totalOps += op.successCount;
    });
    
    data.avgResponseTime = totalOps > 0 ? totalTime / totalOps : 0;
    
    // Calculate new score - higher is better
    this.updateScore(data);
    
    // Update relay data
    data.lastUpdated = Date.now();
    this.relayData.set(relayUrl, data);
  }
  
  /**
   * Record failure for a relay operation
   */
  recordFailure(relayUrl: string, operation: string, errorMessage: string): void {
    const data = this.getOrCreateRelayData(relayUrl);
    
    // Get operation data or create if it doesn't exist
    const opData = data.operations[operation] || { successCount: 0, failureCount: 0, totalTime: 0 };
    
    // Update operation metrics
    opData.failureCount++;
    
    // Update relay data
    data.operations[operation] = opData;
    data.failureCount++;
    
    // Calculate new score
    this.updateScore(data);
    
    // Update relay data
    data.lastUpdated = Date.now();
    this.relayData.set(relayUrl, data);
  }
  
  /**
   * Get performance data for a specific relay
   */
  getRelayPerformance(relayUrl: string): RelayPerformanceData | null {
    return this.relayData.get(relayUrl) || null;
  }
  
  /**
   * Get all relay performance data
   */
  getAllRelayPerformance(): RelayPerformanceData[] {
    return Array.from(this.relayData.values());
  }
  
  /**
   * Get or create relay data entry
   */
  private getOrCreateRelayData(relayUrl: string): RelayPerformanceData {
    if (!this.relayData.has(relayUrl)) {
      this.relayData.set(relayUrl, {
        url: relayUrl,
        score: 50, // Default score
        avgResponseTime: 0,
        successCount: 0,
        failureCount: 0,
        lastUpdated: Date.now(),
        operations: {}
      });
    }
    
    return this.relayData.get(relayUrl)!;
  }
  
  /**
   * Update score based on success rate and response time
   */
  private updateScore(data: RelayPerformanceData): void {
    const totalOperations = data.successCount + data.failureCount;
    
    if (totalOperations === 0) {
      return;
    }
    
    // Calculate success rate (0-100)
    const successRate = (data.successCount / totalOperations) * 100;
    
    // Calculate response time score (0-100)
    // Lower response time = higher score
    const responseTimeScore = Math.max(0, 100 - ((data.avgResponseTime / this.MAX_RESPONSE_TIME) * 100));
    
    // Combine scores with weights
    // Success rate is more important (70%) than response time (30%)
    data.score = Math.round((successRate * 0.7) + (responseTimeScore * 0.3));
  }
  
  /**
   * Reset performance data for a relay
   */
  reset(relayUrl: string): void {
    this.relayData.delete(relayUrl);
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.decayTimer) {
      clearInterval(this.decayTimer);
      this.decayTimer = null;
    }
  }
}

// Create and export singleton instance
export const relayPerformanceTracker = new RelayPerformanceTracker();
