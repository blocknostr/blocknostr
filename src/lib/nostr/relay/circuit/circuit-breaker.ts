
import { CircuitState } from "../../types";

/**
 * Circuit breaker implementation for handling relay connections
 * This helps prevent repeated connection attempts to failing relays
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private resetTimeout: number = 30000; // 30 seconds
  private failureThreshold: number = 3;
  
  /**
   * Get the current state of the circuit
   */
  getState(): CircuitState {
    this.checkReset();
    return this.state;
  }
  
  /**
   * Record a success, potentially closing the circuit
   */
  recordSuccess(): void {
    if (this.state === 'half-open') {
      this.state = 'closed';
    }
    
    this.failureCount = 0;
  }
  
  /**
   * Record a failure, potentially opening the circuit
   */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold && this.state === 'closed') {
      this.state = 'open';
    }
  }
  
  /**
   * Check if the circuit should be reset from open to half-open
   */
  private checkReset(): void {
    if (this.state === 'open' && Date.now() > this.lastFailureTime + this.resetTimeout) {
      this.state = 'half-open';
    }
  }
  
  /**
   * Check if a request should be allowed through
   * @returns Boolean indicating if request should proceed
   */
  canRequest(): boolean {
    this.checkReset();
    
    if (this.state === 'open') {
      return false;
    }
    
    // In half-open state, allow a single request through
    return true;
  }
}
