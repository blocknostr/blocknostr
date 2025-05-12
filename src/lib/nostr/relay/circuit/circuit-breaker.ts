
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
  private circuitStates: Map<string, CircuitState> = new Map();
  
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
   * Record success for a specific circuit by URL
   */
  recordSuccessFor(url: string): void {
    const state = this.circuitStates.get(url) || CircuitState.CLOSED;
    if (state === CircuitState.HALF_OPEN) {
      this.circuitStates.set(url, CircuitState.CLOSED);
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
   * Record failure for a specific circuit by URL
   */
  recordFailureFor(url: string): void {
    const currentState = this.circuitStates.get(url) || CircuitState.CLOSED;
    if (currentState === CircuitState.CLOSED) {
      this.circuitStates.set(url, CircuitState.HALF_OPEN);
    } else if (currentState === CircuitState.HALF_OPEN) {
      this.circuitStates.set(url, CircuitState.OPEN);
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
   * Check if operations are allowed for a specific URL
   */
  isAllowedFor(url: string): boolean {
    const state = this.circuitStates.get(url);
    if (!state || state === CircuitState.CLOSED) {
      return true;
    }
    
    if (state === CircuitState.OPEN) {
      return false;
    }
    
    // Half-open state
    return true;
  }
  
  /**
   * Get the current state of the circuit
   */
  getState(): CircuitState {
    return this.state;
  }
  
  /**
   * Get the state for a specific URL
   */
  getState(url: string): CircuitState {
    return this.circuitStates.get(url) || CircuitState.CLOSED;
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
   * Reset a specific circuit by URL
   */
  resetFor(url: string): void {
    this.circuitStates.delete(url);
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
   * Force a specific circuit to open by URL
   */
  forceOpenFor(url: string): void {
    this.circuitStates.set(url, CircuitState.OPEN);
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
