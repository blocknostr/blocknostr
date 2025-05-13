
import { CircuitOptions, CircuitData } from './types';

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'closed',    // Normal operation
  OPEN = 'open',        // Circuit is open, no operations allowed
  HALF_OPEN = 'half_open' // Testing if circuit can be closed again
}

/**
 * Circuit breaker that prevents repeated attempts to connect to failing relays
 */
class CircuitBreaker {
  private circuits: Map<string, CircuitData> = new Map();
  private options: CircuitOptions = {
    failureThreshold: 3,     // 3 failures to open circuit
    resetTimeout: 60000 * 5  // 5 minutes
  };
  
  /**
   * Get circuit state for a relay
   */
  getState(relayUrl: string): CircuitState {
    const circuit = this.circuits.get(relayUrl);
    
    if (!circuit) {
      return CircuitState.CLOSED;
    }
    
    // If circuit is open but reset timeout has passed, move to half-open
    if (circuit.state === CircuitState.OPEN) {
      const now = Date.now();
      if (now - circuit.lastFailure > this.options.resetTimeout) {
        circuit.state = CircuitState.HALF_OPEN;
        this.circuits.set(relayUrl, circuit);
      }
    }
    
    return circuit.state;
  }
  
  /**
   * Record a success for a relay
   */
  recordSuccess(relayUrl: string): void {
    const circuit = this.getOrCreateCircuit(relayUrl);
    
    // Reset failure count on success
    circuit.failureCount = 0;
    circuit.lastSuccess = Date.now();
    
    // If half-open, close the circuit
    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.state = CircuitState.CLOSED;
    }
    
    this.circuits.set(relayUrl, circuit);
  }
  
  /**
   * Record a failure for a relay
   */
  recordFailure(relayUrl: string): void {
    const circuit = this.getOrCreateCircuit(relayUrl);
    const now = Date.now();
    
    circuit.failureCount++;
    circuit.lastFailure = now;
    
    // Open circuit if failure threshold reached
    if (circuit.failureCount >= this.options.failureThreshold) {
      circuit.state = CircuitState.OPEN;
    }
    
    this.circuits.set(relayUrl, circuit);
  }
  
  /**
   * Reset circuit for a relay
   */
  reset(relayUrl: string): void {
    this.circuits.delete(relayUrl);
  }
  
  /**
   * Get or create circuit data
   */
  private getOrCreateCircuit(relayUrl: string): CircuitData {
    if (!this.circuits.has(relayUrl)) {
      this.circuits.set(relayUrl, {
        state: CircuitState.CLOSED,
        failureCount: 0,
        lastFailure: 0,
        lastSuccess: 0
      });
    }
    
    return this.circuits.get(relayUrl)!;
  }
}

// Create and export singleton instance
export const circuitBreaker = new CircuitBreaker();
