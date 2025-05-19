
/**
 * Tracks relay performance metrics like response time
 */

interface RelayPerformanceData {
  url: string;
  score: number;            // Overall performance score (0-100)
  avgResponseTime?: number; // Average response time in ms
  requestCount: number;     // Number of requests made
  errorCount: number;       // Number of errors
  successRate: number;      // Success rate (0-1)
  lastUpdated: number;      // Timestamp of last update
}

class RelayPerformanceTracker {
  private relayData: Map<string, RelayPerformanceData> = new Map();
  
  /**
   * Record start of a request to a relay
   * @param relayUrl URL of the relay
   * @returns Request id for tracking
   */
  public startRequest(relayUrl: string): string {
    const requestId = `${relayUrl}-${Date.now()}-${Math.random()}`;
    
    // Store start time in a way that's retrievable with the request ID
    (window as any).__relayRequestStartTimes = (window as any).__relayRequestStartTimes || {};
    (window as any).__relayRequestStartTimes[requestId] = Date.now();
    
    return requestId;
  }
  
  /**
   * Record end of a successful request
   * @param requestId Request identifier from startRequest
   */
  public endRequest(requestId: string): void {
    const startTimes = (window as any).__relayRequestStartTimes;
    if (!startTimes || !startTimes[requestId]) {
      return; // No start time found
    }
    
    const startTime = startTimes[requestId];
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Extract relay URL from request ID
    const relayUrl = requestId.split('-')[0];
    this.recordMetric(relayUrl, responseTime, true);
    
    // Clean up
    delete startTimes[requestId];
  }
  
  /**
   * Record a failed request
   * @param requestId Request identifier from startRequest
   */
  public failRequest(requestId: string): void {
    const startTimes = (window as any).__relayRequestStartTimes;
    if (!startTimes || !startTimes[requestId]) {
      return; // No start time found
    }
    
    // Extract relay URL from request ID
    const relayUrl = requestId.split('-')[0];
    
    // Record failure (no response time for failures)
    this.recordMetric(relayUrl, null, false);
    
    // Clean up
    delete startTimes[requestId];
  }
  
  /**
   * Record performance metrics for a relay
   * @param relayUrl URL of the relay
   * @param responseTime Response time in ms (null for failures)
   * @param success Whether the request was successful
   */
  private recordMetric(relayUrl: string, responseTime: number | null, success: boolean): void {
    // Get existing data or create new
    const existingData = this.relayData.get(relayUrl) || {
      url: relayUrl,
      score: 50,
      requestCount: 0,
      errorCount: 0,
      successRate: 1,
      lastUpdated: Date.now()
    };
    
    // Update metrics
    existingData.requestCount++;
    if (!success) {
      existingData.errorCount++;
    }
    existingData.successRate = 
      (existingData.requestCount - existingData.errorCount) / existingData.requestCount;
    existingData.lastUpdated = Date.now();
    
    // Update response time with exponential moving average
    if (responseTime !== null) {
      if (existingData.avgResponseTime === undefined) {
        existingData.avgResponseTime = responseTime;
      } else {
        // Give 30% weight to new value
        existingData.avgResponseTime = 
          existingData.avgResponseTime * 0.7 + responseTime * 0.3;
      }
    }
    
    // Calculate score (higher is better)
    let score = 50; // Base score
    
    // Penalty for errors, up to -40 points
    score -= Math.min(40, (1 - existingData.successRate) * 80);
    
    // Response time factor (faster is better)
    // <100ms: +20 points
    // 100-300ms: +10 points
    // 300-500ms: +0 points
    // 500-1000ms: -10 points
    // >1000ms: -20 points
    if (existingData.avgResponseTime !== undefined) {
      if (existingData.avgResponseTime < 100) score += 20;
      else if (existingData.avgResponseTime < 300) score += 10;
      else if (existingData.avgResponseTime < 500) score += 0;
      else if (existingData.avgResponseTime < 1000) score -= 10;
      else score -= 20;
    }
    
    // Ensure score stays between 0 and 100
    existingData.score = Math.max(0, Math.min(100, score));
    
    // Store updated data
    this.relayData.set(relayUrl, existingData);
  }
  
  /**
   * Get performance data for a relay
   * @param relayUrl URL of the relay
   * @returns Performance data or null if no data available
   */
  public getRelayPerformance(relayUrl: string): RelayPerformanceData | null {
    return this.relayData.get(relayUrl) || null;
  }
  
  /**
   * Get performance data for all relays
   * @returns Array of relay performance data
   */
  public getAllRelaysPerformance(): RelayPerformanceData[] {
    return Array.from(this.relayData.values());
  }
  
  /**
   * Reset performance data for a relay
   * @param relayUrl URL of the relay
   */
  public resetRelayMetrics(relayUrl: string): void {
    this.relayData.delete(relayUrl);
  }
}

// Export singleton instance for app-wide use
export const relayPerformanceTracker = new RelayPerformanceTracker();
