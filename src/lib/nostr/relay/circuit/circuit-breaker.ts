
/**
 * Circuit breaker pattern for relay connections to prevent repeated attempts to failing relays
 */
class CircuitBreaker {
  private circuitState: Map<string, {
    state: 'closed' | 'open' | 'half-open';
    failCount: number;
    lastFailure: number;
    cooldownPeriod: number;
  }> = new Map();
  
  // Configuration
  private readonly FAILURE_THRESHOLD = 3;
  private readonly MIN_COOLDOWN = 30000; // 30 seconds
  private readonly MAX_COOLDOWN = 3600000; // 1 hour
  
  /**
   * Record a failure for a relay
   */
  recordFailure(relayUrl: string): void {
    const now = Date.now();
    const current = this.circuitState.get(relayUrl) || {
      state: 'closed',
      failCount: 0,
      lastFailure: now,
      cooldownPeriod: this.MIN_COOLDOWN
    };
    
    current.failCount++;
    current.lastFailure = now;
    
    // Open circuit if threshold reached
    if (current.failCount >= this.FAILURE_THRESHOLD) {
      current.state = 'open';
      // Exponential backoff for cooldown period
      current.cooldownPeriod = Math.min(
        current.cooldownPeriod * 2, 
        this.MAX_COOLDOWN
      );
    }
    
    this.circuitState.set(relayUrl, current);
  }
  
  /**
   * Record a success for a relay
   */
  recordSuccess(relayUrl: string): void {
    const current = this.circuitState.get(relayUrl);
    
    if (!current) return;
    
    // Reset failure count on success
    current.failCount = 0;
    current.cooldownPeriod = this.MIN_COOLDOWN;
    current.state = 'closed';
    
    this.circuitState.set(relayUrl, current);
  }
  
  /**
   * Check if circuit is open (relay should be avoided)
   */
  isCircuitOpen(relayUrl: string): boolean {
    const current = this.circuitState.get(relayUrl);
    
    if (!current) return false;
    if (current.state !== 'open') return false;
    
    // Check if cooldown period has passed
    const now = Date.now();
    const cooldownElapsed = now - current.lastFailure > current.cooldownPeriod;
    
    if (cooldownElapsed) {
      // Move to half-open state after cooldown
      current.state = 'half-open';
      this.circuitState.set(relayUrl, current);
      return false;
    }
    
    return true;
  }
  
  /**
   * Get current state for a relay
   */
  getState(relayUrl: string): 'closed' | 'open' | 'half-open' {
    return this.circuitState.get(relayUrl)?.state || 'closed';
  }
  
  /**
   * Save circuit state to local storage
   */
  saveState(): void {
    try {
      localStorage.setItem('circuit-breaker-state', 
        JSON.stringify(Array.from(this.circuitState.entries()))
      );
    } catch (error) {
      console.warn('Failed to save circuit breaker state', error);
    }
  }
  
  /**
   * Load circuit state from local storage
   */
  loadState(): void {
    try {
      const stored = localStorage.getItem('circuit-breaker-state');
      if (stored) {
        this.circuitState = new Map(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load circuit breaker state', error);
    }
  }
}

// Export singleton instance
export const circuitBreaker = new CircuitBreaker();
circuitBreaker.loadState();

// Save state before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    circuitBreaker.saveState();
  });
}
