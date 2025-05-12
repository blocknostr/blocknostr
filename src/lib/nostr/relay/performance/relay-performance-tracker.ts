
import { safeLocalStorageGet, safeLocalStorageSet } from '@/lib/utils/storage';

export interface RelayMetric {
  timestamp: number;
  success: boolean;
  duration?: number;  // In milliseconds
  operation: 'read' | 'write' | 'ping' | 'connect';
  error?: string;
}

export interface RelayPerformanceData {
  url: string;
  metrics: RelayMetric[];
  lastPing?: number;
  avgResponseTime?: number;
  successRate?: number;
  score?: number;
  lastUpdated: number;
  supportedNips?: number[];
  geolocation?: {
    region?: string;
    country?: string;
    latency?: number;
  };
}

/**
 * Class for tracking relay performance metrics
 */
export class RelayPerformanceTracker {
  private relayData: Map<string, RelayPerformanceData> = new Map();
  private readonly STORAGE_KEY = 'nostr_relay_performance';
  private readonly MAX_METRICS_PER_RELAY = 20; // Maximum number of metrics to store per relay
  
  constructor() {
    this.loadFromStorage();
  }
  
  /**
   * Track response time for a relay operation
   * @param relayUrl URL of the relay
   * @param operation Operation type
   * @param duration Time taken in milliseconds
   */
  trackResponseTime(relayUrl: string, operation: 'read' | 'write' | 'ping' | 'connect', duration: number): void {
    const metric: RelayMetric = {
      timestamp: Date.now(),
      success: true,
      duration,
      operation
    };
    
    this.addMetric(relayUrl, metric);
  }
  
  /**
   * Record a successful operation
   * @param relayUrl URL of the relay
   * @param operation Operation type
   */
  recordSuccess(relayUrl: string, operation: 'read' | 'write' | 'ping' | 'connect'): void {
    const metric: RelayMetric = {
      timestamp: Date.now(),
      success: true,
      operation
    };
    
    this.addMetric(relayUrl, metric);
  }
  
  /**
   * Record a failed operation
   * @param relayUrl URL of the relay
   * @param operation Operation type
   * @param error Error message
   */
  recordFailure(relayUrl: string, operation: 'read' | 'write' | 'ping' | 'connect', error?: string): void {
    const metric: RelayMetric = {
      timestamp: Date.now(),
      success: false,
      operation,
      error
    };
    
    this.addMetric(relayUrl, metric);
  }
  
  /**
   * Add a metric to the relay data
   * @param relayUrl URL of the relay
   * @param metric Metric to add
   */
  private addMetric(relayUrl: string, metric: RelayMetric): void {
    if (!relayUrl) return;
    
    // Get or create relay data
    const relayData = this.relayData.get(relayUrl) || {
      url: relayUrl,
      metrics: [],
      lastUpdated: Date.now()
    };
    
    // Add new metric at the beginning (most recent first)
    relayData.metrics.unshift(metric);
    
    // Limit the number of metrics stored
    if (relayData.metrics.length > this.MAX_METRICS_PER_RELAY) {
      relayData.metrics = relayData.metrics.slice(0, this.MAX_METRICS_PER_RELAY);
    }
    
    // Update aggregate statistics
    this.updateRelayStats(relayData);
    
    // Save updated data
    this.relayData.set(relayUrl, relayData);
    
    // Store to storage (rate limited)
    this.debouncedSave();
  }
  
  /**
   * Update aggregate statistics for a relay
   * @param relayData Relay data to update
   */
  private updateRelayStats(relayData: RelayPerformanceData): void {
    if (!relayData.metrics.length) return;
    
    // Calculate average response time from successful metrics with duration
    const responseTimes = relayData.metrics
      .filter(m => m.success && typeof m.duration === 'number')
      .map(m => m.duration as number);
      
    if (responseTimes.length > 0) {
      relayData.avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }
    
    // Calculate success rate
    const totalOperations = relayData.metrics.length;
    const successfulOperations = relayData.metrics.filter(m => m.success).length;
    relayData.successRate = totalOperations > 0 ? successfulOperations / totalOperations : 0;
    
    // Update timestamp
    relayData.lastUpdated = Date.now();
    
    // Calculate overall score (weighted combination of metrics)
    // Lower is better for response time (faster), higher is better for success rate
    const responseTimeScore = relayData.avgResponseTime ? Math.min(1, 2000 / (relayData.avgResponseTime + 500)) : 0.5;
    const successRateScore = relayData.successRate || 0;
    
    // Recent metrics are weighted more heavily
    const recentMetricsWeight = this.calculateRecencyWeight(relayData.metrics);
    
    // Calculate final score (0-100, higher is better)
    relayData.score = Math.round((responseTimeScore * 0.4 + successRateScore * 0.4 + recentMetricsWeight * 0.2) * 100);
  }
  
  /**
   * Calculate weight based on recency of metrics
   * @param metrics Array of metrics
   * @returns Weight factor (0-1)
   */
  private calculateRecencyWeight(metrics: RelayMetric[]): number {
    if (!metrics.length) return 0;
    
    const now = Date.now();
    const MAX_AGE_MS = 3600000; // 1 hour
    
    // Calculate recency score for each metric (1.0 for brand new, approaching 0 for older)
    const recencyScores = metrics.map(m => {
      const age = now - m.timestamp;
      return Math.max(0, 1 - (age / MAX_AGE_MS));
    });
    
    // Weight recent success/failure more heavily
    const recentSuccesses = metrics
      .filter(m => m.success)
      .map((m, i) => m.success ? recencyScores[i] : 0)
      .reduce((sum, score) => sum + score, 0);
      
    const recentFailures = metrics
      .filter(m => !m.success)
      .map((m, i) => !m.success ? recencyScores[i] : 0)
      .reduce((sum, score) => sum + score, 0);
    
    const totalRecentWeight = recencyScores.reduce((sum, score) => sum + score, 0);
    
    return totalRecentWeight > 0 ? 
      recentSuccesses / (recentSuccesses + recentFailures) : 
      0.5;
  }
  
  /**
   * Get the performance data for a relay
   * @param relayUrl URL of the relay
   * @returns Relay performance data or undefined
   */
  getRelayPerformance(relayUrl: string): RelayPerformanceData | undefined {
    return this.relayData.get(relayUrl);
  }
  
  /**
   * Calculate the score for a relay
   * @param relayUrl URL of the relay
   * @returns Score (0-100, higher is better) or 50 if no data
   */
  getRelayScore(relayUrl: string): number {
    const data = this.relayData.get(relayUrl);
    return data?.score || 50; // Default midpoint score
  }
  
  /**
   * Get all relay performance data
   * @returns Array of relay performance data
   */
  getAllRelayPerformance(): RelayPerformanceData[] {
    return Array.from(this.relayData.values());
  }
  
  /**
   * Add or update supported NIPs for a relay
   * @param relayUrl URL of the relay
   * @param nips Array of supported NIP numbers
   */
  updateSupportedNips(relayUrl: string, nips: number[]): void {
    const relayData = this.relayData.get(relayUrl) || {
      url: relayUrl,
      metrics: [],
      lastUpdated: Date.now()
    };
    
    relayData.supportedNips = nips;
    this.relayData.set(relayUrl, relayData);
    this.debouncedSave();
  }
  
  /**
   * Update geolocation information for a relay
   * @param relayUrl URL of the relay
   * @param geoData Geolocation data
   */
  updateGeolocation(relayUrl: string, geoData: { region?: string; country?: string; latency?: number }): void {
    const relayData = this.relayData.get(relayUrl) || {
      url: relayUrl,
      metrics: [],
      lastUpdated: Date.now()
    };
    
    relayData.geolocation = geoData;
    this.relayData.set(relayUrl, relayData);
    this.debouncedSave();
  }
  
  /**
   * Load relay performance data from storage
   */
  private loadFromStorage(): void {
    try {
      const storedData = safeLocalStorageGet(this.STORAGE_KEY);
      if (storedData) {
        const parsedData: RelayPerformanceData[] = JSON.parse(storedData);
        parsedData.forEach(data => {
          this.relayData.set(data.url, data);
        });
        console.log(`Loaded performance data for ${this.relayData.size} relays`);
      }
    } catch (error) {
      console.error('Error loading relay performance data:', error);
    }
  }
  
  /**
   * Save relay performance data to storage
   */
  private saveToStorage(): void {
    try {
      const dataArray = Array.from(this.relayData.values());
      
      // Clean up old data before saving
      this.pruneOldData();
      
      safeLocalStorageSet(this.STORAGE_KEY, JSON.stringify(dataArray));
    } catch (error) {
      console.error('Error saving relay performance data:', error);
    }
  }
  
  /**
   * Remove old or excess metrics to save storage space
   */
  private pruneOldData(): void {
    const now = Date.now();
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000; // 1 week in ms
    
    this.relayData.forEach((data, url) => {
      // Filter out metrics older than one week
      data.metrics = data.metrics.filter(m => (now - m.timestamp) < ONE_WEEK);
      
      // If no metrics left, check if the relay was used recently
      if (data.metrics.length === 0 && (now - data.lastUpdated > ONE_WEEK)) {
        this.relayData.delete(url);
      }
    });
  }
  
  // Debounce logic to avoid excessive storage writes
  private saveTimeout: number | null = null;
  private debouncedSave(): void {
    if (this.saveTimeout) {
      window.clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = window.setTimeout(() => {
      this.saveToStorage();
      this.saveTimeout = null;
    }, 5000); // Save after 5 seconds of inactivity
  }
}

// Singleton instance
export const relayPerformanceTracker = new RelayPerformanceTracker();
