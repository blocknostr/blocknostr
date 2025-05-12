
/**
 * ProfileRelaySelector - A utility class that helps select the optimal relays
 * for a user profile based on historical performance and availability.
 */
export class ProfileRelaySelector {
  private relayScores: Map<string, number> = new Map();
  private lastSuccessful: Map<string, number> = new Map();
  
  constructor() {
    this.initializeFromStorage();
  }
  
  /**
   * Initialize relay scores from local storage if available
   */
  private initializeFromStorage(): void {
    try {
      const savedScores = localStorage.getItem('nostr_relay_scores');
      if (savedScores) {
        const parsed = JSON.parse(savedScores);
        this.relayScores = new Map(Object.entries(parsed));
      }
      
      const savedSuccessful = localStorage.getItem('nostr_relay_last_success');
      if (savedSuccessful) {
        const parsed = JSON.parse(savedSuccessful);
        this.lastSuccessful = new Map(Object.entries(parsed));
      }
    } catch (e) {
      console.error('Error loading relay scores from storage:', e);
    }
  }
  
  /**
   * Save relay scores to local storage
   */
  private saveToStorage(): void {
    try {
      const scoresToSave = Object.fromEntries(this.relayScores);
      localStorage.setItem('nostr_relay_scores', JSON.stringify(scoresToSave));
      
      const successfulToSave = Object.fromEntries(this.lastSuccessful);
      localStorage.setItem('nostr_relay_last_success', JSON.stringify(successfulToSave));
    } catch (e) {
      console.error('Error saving relay scores to storage:', e);
    }
  }
  
  /**
   * Record a successful relay interaction
   * @param url The relay URL
   * @param latency Response time in milliseconds
   */
  recordSuccess(url: string, latency: number = 0): void {
    const currentScore = this.relayScores.get(url) || 50;
    // Calculate new score based on latency (lower is better)
    let latencyBonus = 0;
    if (latency < 100) latencyBonus = 2;
    else if (latency < 300) latencyBonus = 1;
    else if (latency > 1000) latencyBonus = -1;
    
    // Update score (max 100)
    const newScore = Math.min(100, currentScore + 1 + latencyBonus);
    this.relayScores.set(url, newScore);
    this.lastSuccessful.set(url, Date.now());
    this.saveToStorage();
  }
  
  /**
   * Record a failed relay interaction
   * @param url The relay URL
   */
  recordFailure(url: string): void {
    const currentScore = this.relayScores.get(url) || 50;
    // Penalize failures more heavily
    const newScore = Math.max(0, currentScore - 5);
    this.relayScores.set(url, newScore);
    this.saveToStorage();
  }
  
  /**
   * Sort relays by their score, prioritizing those with better performance
   * @param relays Array of relay URLs
   * @returns Sorted array of relay URLs
   */
  selectOptimalRelays(relays: string[]): string[] {
    return [...relays].sort((a, b) => {
      const scoreA = this.relayScores.get(a) || 50;
      const scoreB = this.relayScores.get(b) || 50;
      return scoreB - scoreA;
    });
  }
  
  /**
   * Get the score for a specific relay
   * @param url The relay URL
   * @returns Score between 0-100
   */
  getScore(url: string): number {
    return this.relayScores.get(url) || 50;
  }
  
  /**
   * Check if a relay has been successful recently
   * @param url The relay URL
   * @returns True if relay has been successful in the last hour
   */
  isRecentlySuccessful(url: string): boolean {
    const lastSuccess = this.lastSuccessful.get(url);
    if (!lastSuccess) return false;
    
    // Check if successful in the last hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    return lastSuccess > oneHourAgo;
  }
  
  /**
   * Reset all relay scores to default
   */
  resetScores(): void {
    this.relayScores.clear();
    this.lastSuccessful.clear();
    this.saveToStorage();
  }
}
