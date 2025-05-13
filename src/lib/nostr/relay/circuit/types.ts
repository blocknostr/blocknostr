
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
