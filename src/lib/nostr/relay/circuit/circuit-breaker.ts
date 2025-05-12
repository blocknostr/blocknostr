
/**
 * Circuit states for the circuit breaker pattern
 */
export enum CircuitState {
  CLOSED = 'closed',   // Normal operation, requests allowed
  OPEN = 'open',       // Failure threshold exceeded, requests blocked
  HALF_OPEN = 'half-open' // Testing if system is recovered
}

/**
 * Simple circuit breaker implementation for relay connectivity
 * Helps prevent repeated connection attempts to failing relays
 */
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: CircuitState = CircuitState.CLOSED;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  
  /**
   * Create a new circuit breaker
   * @param failureThreshold Number of failures before opening the circuit
   * @param resetTimeout Time in milliseconds to wait before attempting reset
   */
  constructor(failureThreshold: number = 3, resetTimeout: number = 60000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
  }
  
  /**
   * Record a successful operation
   */
  recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.reset();
    }
  }
  
  /**
   * Record a failed operation
   */
  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }
  
  /**
   * Check if the circuit allows operations
   * @returns boolean indicating if operations are allowed
   */
  isAllowed(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return true;
    }
    
    if (this.state === CircuitState.OPEN) {
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeout) {
        // Try half-open state after timeout
        this.state = CircuitState.HALF_OPEN;
        return true;
      }
      return false;
    }
    
    // In HALF_OPEN state, allow one request to test
    return true;
  }
  
  /**
   * Get the current state of the circuit
   */
  getState(): CircuitState {
    return this.state;
  }
  
  /**
   * Reset the circuit to closed state
   */
  reset(): void {
    this.failures = 0;
    this.state = CircuitState.CLOSED;
  }
}

// Create exported instance
export const circuitBreaker = new CircuitBreaker();
