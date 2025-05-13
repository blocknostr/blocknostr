
export interface CircuitOptions {
  /**
   * Number of failures before opening circuit
   */
  failureThreshold: number;
  
  /**
   * Time in milliseconds before attempting to half-close circuit
   */
  resetTimeout: number;
}

export interface CircuitData {
  state: CircuitState;
  failureCount: number;
  lastFailure: number;
  lastSuccess: number;
}

// Add the CircuitState enum that was missing
export enum CircuitState {
  CLOSED = 0,
  OPEN = 1,
  HALF_OPEN = 2
}
