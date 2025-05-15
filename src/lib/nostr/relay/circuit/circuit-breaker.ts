
/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED, // Normal operation (allowing requests)
  OPEN,   // Blocking requests due to failures
  HALF_OPEN // Testing if service has recovered
}

/**
 * Circuit breaker options
 */
export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenRequests: number;
}

/**
 * Implementation of the Circuit Breaker pattern for relay operations
 * Prevents repeated requests to failing relays
 */
export class CircuitBreaker {
  private circuits: Map<string, {
    state: CircuitState;
    failures: number;
    successful: number;
    lastFailure: number;
    nextAttempt: number;
    recentFailureTimestamps: number[];
  }> = new Map();
  
  private readonly DEFAULT_OPTIONS: CircuitBreakerOptions = {
    failureThreshold: 3,    // 3 failures trips the breaker
    resetTimeout: 30000,    // 30 seconds in OPEN state (reduced from 60s)
    halfOpenRequests: 1     // Allow 1 request when testing
  };
  
  private readonly FAILURE_WINDOW_MS = 300000; // 5 minutes
  
  constructor(private options: CircuitBreakerOptions = {
    failureThreshold: 3,
    resetTimeout: 30000,
    halfOpenRequests: 1
  }) {
    this.options = { ...this.DEFAULT_OPTIONS, ...options };
  }
  
  /**
   * Check if requests are allowed to the specified relay
   * @param relayUrl URL of the relay
   * @returns Boolean indicating if requests are allowed
   */
  isAllowed(relayUrl: string): boolean {
    if (!this.circuits.has(relayUrl)) {
      this.circuits.set(relayUrl, {
        state: CircuitState.CLOSED,
        failures: 0,
        successful: 0,
        lastFailure: 0,
        nextAttempt: 0,
        recentFailureTimestamps: []
      });
      return true;
    }
    
    const circuit = this.circuits.get(relayUrl)!;
    const now = Date.now();
    
    switch (circuit.state) {
      case CircuitState.OPEN:
        // Check if reset timeout has elapsed
        if (now >= circuit.nextAttempt) {
          console.log(`Circuit for ${relayUrl} transitioning from OPEN to HALF_OPEN`);
          circuit.state = CircuitState.HALF_OPEN;
          circuit.successful = 0;
          return true;
        }
        return false;
        
      case CircuitState.HALF_OPEN:
        // Only allow a limited number of requests in half-open state
        return circuit.successful < this.options.halfOpenRequests;
        
      case CircuitState.CLOSED:
      default:
        return true;
    }
  }
  
  /**
   * Record a successful operation for a relay
   * @param relayUrl URL of the relay
   */
  recordSuccess(relayUrl: string): void {
    if (!this.circuits.has(relayUrl)) {
      this.circuits.set(relayUrl, {
        state: CircuitState.CLOSED,
        failures: 0,
        successful: 0,
        lastFailure: 0,
        nextAttempt: 0,
        recentFailureTimestamps: []
      });
      return;
    }
    
    const circuit = this.circuits.get(relayUrl)!;
    
    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.successful++;
      
      // If we've had enough successful requests, close the circuit
      if (circuit.successful >= this.options.halfOpenRequests) {
        console.log(`Circuit for ${relayUrl} closing - service recovered`);
        circuit.state = CircuitState.CLOSED;
        circuit.failures = 0;
        // Clear recent failures on recovery
        circuit.recentFailureTimestamps = [];
      }
    } else if (circuit.state === CircuitState.CLOSED) {
      // Reset failures counter on success (gradual recovery)
      circuit.failures = Math.max(0, circuit.failures - 1);
      
      // Remove old failure timestamps that are outside the window
      const now = Date.now();
      circuit.recentFailureTimestamps = circuit.recentFailureTimestamps.filter(
        timestamp => now - timestamp < this.FAILURE_WINDOW_MS
      );
    }
  }
  
  /**
   * Record a failed operation for a relay
   * @param relayUrl URL of the relay
   */
  recordFailure(relayUrl: string): void {
    const now = Date.now();
    
    if (!this.circuits.has(relayUrl)) {
      this.circuits.set(relayUrl, {
        state: CircuitState.CLOSED,
        failures: 1, // First failure
        successful: 0,
        lastFailure: now,
        nextAttempt: 0,
        recentFailureTimestamps: [now]
      });
      return;
    }
    
    const circuit = this.circuits.get(relayUrl)!;
    circuit.failures++;
    circuit.lastFailure = now;
    
    // Add timestamp to recent failures list
    circuit.recentFailureTimestamps.push(now);
    
    // Remove old failure timestamps that are outside the window
    circuit.recentFailureTimestamps = circuit.recentFailureTimestamps.filter(
      timestamp => now - timestamp < this.FAILURE_WINDOW_MS
    );
    
    // Calculate failure rate in the window
    const recentFailureCount = circuit.recentFailureTimestamps.length;
    
    // Trip circuit if we have enough recent failures or if in HALF_OPEN and had a failure
    if (circuit.state === CircuitState.HALF_OPEN || 
        (circuit.state === CircuitState.CLOSED && 
         (circuit.failures >= this.options.failureThreshold || recentFailureCount >= this.options.failureThreshold * 2))) {
      
      // Trip the circuit
      console.log(`Circuit for ${relayUrl} opening - too many failures (${circuit.failures} direct, ${recentFailureCount} recent)`);
      circuit.state = CircuitState.OPEN;
      
      // Set dynamic timeout based on failure rate
      const failureRate = recentFailureCount / (this.options.failureThreshold * 2);
      const dynamicTimeout = Math.min(this.options.resetTimeout * Math.max(failureRate, 0.5), this.options.resetTimeout);
      
      circuit.nextAttempt = now + dynamicTimeout;
    }
  }
  
  /**
   * Reset the circuit for a relay
   * @param relayUrl URL of the relay
   */
  reset(relayUrl: string): void {
    this.circuits.set(relayUrl, {
      state: CircuitState.CLOSED,
      failures: 0,
      successful: 0,
      lastFailure: 0,
      nextAttempt: 0,
      recentFailureTimestamps: []
    });
  }
  
  /**
   * Get the circuit state for a relay
   * @param relayUrl URL of the relay
   * @returns CircuitState or undefined if no data
   */
  getState(relayUrl: string): CircuitState | undefined {
    return this.circuits.get(relayUrl)?.state;
  }
  
  /**
   * Get all circuit data
   * @returns Map of relay URLs to circuit data
   */
  getAllCircuits() {
    return this.circuits;
  }
  
  /**
   * Get the count of failures for a relay
   * @param relayUrl URL of the relay
   * @returns Number of failures
   */
  getFailureCount(relayUrl: string): number {
    return this.circuits.get(relayUrl)?.failures || 0;
  }
  
  /**
   * Reset all circuits
   */
  resetAll(): void {
    this.circuits.clear();
  }
}

// Singleton instance
export const circuitBreaker = new CircuitBreaker();
