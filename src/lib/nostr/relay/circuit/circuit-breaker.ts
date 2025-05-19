
/**
 * Circuit Breaker Pattern implementation for Nostr relays
 * This helps prevent repeated connection attempts to failing relays
 */

// Circuit state enum
export enum CircuitState {
  CLOSED = 'CLOSED',  // Normal operation, relay works
  OPEN = 'OPEN',      // Circuit is open, relay is failing
  HALF_OPEN = 'HALF_OPEN' // Testing if relay is back
}

interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  resetTimeout: number;     // Time in ms before attempting reconnection
  halfOpenSuccess: number;  // Number of successful ops to close circuit
}

class CircuitBreaker {
  private states: Map<string, CircuitState> = new Map();
  private failures: Map<string, number> = new Map();
  private resetTimers: Map<string, NodeJS.Timeout> = new Map();
  private halfOpenSuccesses: Map<string, number> = new Map();
  private config: CircuitBreakerConfig;
  
  constructor(config?: Partial<CircuitBreakerConfig>) {
    // Default configuration
    this.config = {
      failureThreshold: 3,         // Open after 3 failures
      resetTimeout: 30000,         // Try again after 30s
      halfOpenSuccess: 2,          // 2 successful ops to close
      ...config
    };
  }
  
  public getState(relayUrl: string): CircuitState {
    return this.states.get(relayUrl) || CircuitState.CLOSED;
  }
  
  public recordSuccess(relayUrl: string): void {
    // If circuit is half-open, increment success counter
    if (this.getState(relayUrl) === CircuitState.HALF_OPEN) {
      const successes = (this.halfOpenSuccesses.get(relayUrl) || 0) + 1;
      this.halfOpenSuccesses.set(relayUrl, successes);
      
      // If enough successes, close circuit
      if (successes >= this.config.halfOpenSuccess) {
        this.closeCircuit(relayUrl);
      }
    }
    
    // Reset failure counter on success
    this.failures.set(relayUrl, 0);
  }
  
  public recordFailure(relayUrl: string): CircuitState {
    const currentFailures = (this.failures.get(relayUrl) || 0) + 1;
    this.failures.set(relayUrl, currentFailures);
    
    // If failures exceed threshold, open circuit
    if (currentFailures >= this.config.failureThreshold) {
      return this.openCircuit(relayUrl);
    }
    
    return this.getState(relayUrl);
  }
  
  private openCircuit(relayUrl: string): CircuitState {
    console.log(`Circuit breaker opened for relay: ${relayUrl}`);
    this.states.set(relayUrl, CircuitState.OPEN);
    
    // Set timer to half-open the circuit after reset timeout
    const timer = setTimeout(() => {
      this.halfOpenCircuit(relayUrl);
    }, this.config.resetTimeout);
    
    this.resetTimers.set(relayUrl, timer);
    return CircuitState.OPEN;
  }
  
  private halfOpenCircuit(relayUrl: string): void {
    console.log(`Circuit breaker half-opened for relay: ${relayUrl}`);
    this.states.set(relayUrl, CircuitState.HALF_OPEN);
    this.halfOpenSuccesses.set(relayUrl, 0);
  }
  
  private closeCircuit(relayUrl: string): void {
    console.log(`Circuit breaker closed for relay: ${relayUrl}`);
    this.states.set(relayUrl, CircuitState.CLOSED);
    this.failures.set(relayUrl, 0);
    this.halfOpenSuccesses.delete(relayUrl);
  }
  
  public reset(relayUrl: string): void {
    // Clear any timers
    const timer = this.resetTimers.get(relayUrl);
    if (timer) {
      clearTimeout(timer);
      this.resetTimers.delete(relayUrl);
    }
    
    // Reset state
    this.states.delete(relayUrl);
    this.failures.delete(relayUrl);
    this.halfOpenSuccesses.delete(relayUrl);
  }
}

// Export singleton instance for app-wide use
export const circuitBreaker = new CircuitBreaker();
