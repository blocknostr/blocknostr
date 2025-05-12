
/**
 * Implementation of the Circuit Breaker pattern for managing relay connections
 * This helps improve system resilience by preventing repeated attempts to access failing relays
 */

// Define circuit states
export type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private state: CircuitState = 'closed';
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
    if (this.state === 'half-open') {
      this.failureCount--;
      if (this.failureCount <= -this.successThreshold) {
        this.state = 'closed';
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
    
    if (this.state === 'closed') {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'open';
      }
    } else if (this.state === 'half-open') {
      this.state = 'open';
      this.failureCount = this.failureThreshold; // Reset failure count
    }
  }
  
  /**
   * Check if the circuit is allowing operations
   * If the circuit is open but the reset timeout has expired, 
   * it will transition to half-open
   */
  isAllowed(): boolean {
    if (this.state === 'closed') {
      return true;
    }
    
    if (this.state === 'open') {
      const timeElapsed = Date.now() - this.lastFailureTime;
      if (timeElapsed >= this.resetTimeout) {
        this.state = 'half-open';
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
    this.state = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
  
  /**
   * Force the circuit to open
   */
  forceOpen(): void {
    this.state = 'open';
    this.lastFailureTime = Date.now();
    this.failureCount = this.failureThreshold;
  }
  
  /**
   * Get remaining time until reset is attempted (in ms)
   * Returns 0 if circuit is closed or already eligible for reset
   */
  getRemainingTimeUntilReset(): number {
    if (this.state !== 'open') return 0;
    
    const timeElapsed = Date.now() - this.lastFailureTime;
    return Math.max(0, this.resetTimeout - timeElapsed);
  }
}
