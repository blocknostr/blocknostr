
/**
 * Implementation of the Circuit Breaker pattern for managing relay connections
 * This helps improve system resilience by preventing repeated attempts to access failing relays
 */

// Define circuit states
export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open'
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successThreshold: number = 3;
  private failureThreshold: number = 5;
  private resetTimeout: number = 60000; // 1 minute in ms
  
  constructor(
    failureThreshold?: number,
    resetTimeout?: number, 
    successThreshold?: number
  ) {
    if (failureThreshold) this.failureThreshold = failureThreshold;
    if (resetTimeout) this.resetTimeout = resetTimeout;
    if (successThreshold) this.successThreshold = successThreshold;
  }
  
  /**
   * Track a successful operation
   */
  recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.failureCount--;
      if (this.failureCount <= -this.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.lastFailureTime = 0;
      }
    }
  }
  
  /**
   * Track a failed operation
   */
  recordFailure(): void {
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.CLOSED) {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.state = CircuitState.OPEN;
      }
    } else if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.failureCount = this.failureThreshold; // Reset failure count
    }
  }
  
  /**
   * Check if the circuit is allowing operations
   * If the circuit is open but the reset timeout has expired, 
   * it will transition to half-open
   */
  isAllowed(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return true;
    }
    
    if (this.state === CircuitState.OPEN) {
      const timeElapsed = Date.now() - this.lastFailureTime;
      if (timeElapsed >= this.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        return true;
      }
      return false;
    }
    
    // Half-open state allows limited operations
    return true;
  }
  
  /**
   * Get the current state of the circuit
   */
  getState(): CircuitState {
    return this.state;
  }
  
  /**
   * Reset the circuit to its initial state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
  
  /**
   * Force the circuit to open
   */
  forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.lastFailureTime = Date.now();
    this.failureCount = this.failureThreshold;
  }
  
  /**
   * Get remaining time until reset is attempted (in ms)
   * Returns 0 if circuit is closed or already eligible for reset
   */
  getRemainingTimeUntilReset(): number {
    if (this.state !== CircuitState.OPEN) return 0;
    
    const timeElapsed = Date.now() - this.lastFailureTime;
    return Math.max(0, this.resetTimeout - timeElapsed);
  }
}

// Create and export a singleton instance for global use
export const circuitBreaker = new CircuitBreaker();
