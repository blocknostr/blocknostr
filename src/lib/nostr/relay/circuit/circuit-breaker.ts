
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
  }> = new Map();
  
  private readonly DEFAULT_OPTIONS: CircuitBreakerOptions = {
    failureThreshold: 3,
    resetTimeout: 60000, // 1 minute
    halfOpenRequests: 1
  };
  
  constructor(private options: CircuitBreakerOptions = {
    failureThreshold: 3,
    resetTimeout: 60000,
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
        nextAttempt: 0
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
        nextAttempt: 0
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
      }
    } else if (circuit.state === CircuitState.CLOSED) {
      // Reset failures counter on success
      circuit.failures = Math.max(0, circuit.failures - 1);
    }
  }
  
  /**
   * Record a failed operation for a relay
   * @param relayUrl URL of the relay
   */
  recordFailure(relayUrl: string): void {
    if (!this.circuits.has(relayUrl)) {
      this.circuits.set(relayUrl, {
        state: CircuitState.CLOSED,
        failures: 1, // First failure
        successful: 0,
        lastFailure: Date.now(),
        nextAttempt: 0
      });
      return;
    }
    
    const circuit = this.circuits.get(relayUrl)!;
    circuit.failures++;
    circuit.lastFailure = Date.now();
    
    if (circuit.state === CircuitState.HALF_OPEN || 
        (circuit.state === CircuitState.CLOSED && circuit.failures >= this.options.failureThreshold)) {
      // Trip the circuit
      console.log(`Circuit for ${relayUrl} opening - too many failures`);
      circuit.state = CircuitState.OPEN;
      circuit.nextAttempt = Date.now() + this.options.resetTimeout;
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
      nextAttempt: 0
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
}

// Singleton instance
export const circuitBreaker = new CircuitBreaker();
