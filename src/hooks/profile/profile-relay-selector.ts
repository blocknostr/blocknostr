/**
 * A utility class to select the best relays for profile requests
 * This helps optimize network performance by selecting relays intelligently
 */
export class ProfileRelaySelector {
  private relayScores: Map<string, number> = new Map();
  private relayResponseTimes: Map<string, number[]> = new Map();
  
  constructor() {
    this.initializeRelayScores();
  }
  
  /**
   * Initialize relay scores with default values
   * Higher scores are better
   */
  private initializeRelayScores(): void {
    // Popular relays get slightly higher initial scores
    const popularRelays = [
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://relay.nostr.band',
      'wss://relay.snort.social',
      'wss://nostr.wine'
    ];
    
    popularRelays.forEach(relay => {
      this.relayScores.set(relay, 70);
      this.relayResponseTimes.set(relay, []);
    });
  }
  
  /**
   * Update a relay's score based on performance metrics
   * @param relayUrl The URL of the relay
   * @param responseTime The response time in milliseconds
   * @param success Whether the request was successful
   */
  public updateRelayScore(relayUrl: string, responseTime: number, success: boolean): void {
    // Get current score or initialize with default value
    let currentScore = this.relayScores.get(relayUrl) || 50;
    
    // Update response times
    const times = this.relayResponseTimes.get(relayUrl) || [];
    times.push(responseTime);
    
    // Keep only the last 10 response times
    if (times.length > 10) {
      times.shift();
    }
    this.relayResponseTimes.set(relayUrl, times);
    
    // Calculate average response time
    const avgResponseTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    
    // Adjust score based on response time and success
    if (success) {
      // Reward fast responses: <100ms is excellent, >1000ms is poor
      if (responseTime < 100) {
        currentScore += 2;
      } else if (responseTime < 300) {
        currentScore += 1;
      } else if (responseTime > 1000) {
        currentScore -= 1;
      }
    } else {
      // Penalize failures more heavily
      currentScore -= 5;
    }
    
    // Ensure score stays within bounds
    currentScore = Math.max(0, Math.min(100, currentScore));
    this.relayScores.set(relayUrl, currentScore);
  }
  
  /**
   * Get the score for a specific relay
   * @param relayUrl The URL of the relay
   * @returns The relay's score (0-100) or undefined if not tracked
   */
  public getRelayScore(relayUrl: string): number | undefined {
    return this.relayScores.get(relayUrl);
  }
  
  /**
   * Get the average response time for a relay
   * @param relayUrl The URL of the relay
   * @returns The average response time in milliseconds or undefined
   */
  public getAverageResponseTime(relayUrl: string): number | undefined {
    const times = this.relayResponseTimes.get(relayUrl);
    if (!times || times.length === 0) return undefined;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }
  
  /**
   * Select the best relays for a specific operation
   * @param relays Array of relay URLs to choose from
   * @param options Options for selection
   * @returns Array of selected relay URLs
   */
  public selectBestRelays(
    relays: string[], 
    options: { 
      operation?: 'read' | 'write' | 'both',
      count?: number,
      minScore?: number
    } = {}
  ): string[] {
    const { operation = 'both', count = 3, minScore = 0 } = options;
    
    // Filter and sort relays by score
    return relays
      .filter(relay => {
        const score = this.relayScores.get(relay) || 50;
        return score >= minScore;
      })
      .sort((a, b) => {
        const scoreA = this.relayScores.get(a) || 50;
        const scoreB = this.relayScores.get(b) || 50;
        return scoreB - scoreA; // Sort descending by score
      })
      .slice(0, count);
  }
}
