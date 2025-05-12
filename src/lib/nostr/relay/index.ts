
import { RelayManager } from './relay-manager';

// Re-export the RelayManager
export { RelayManager };

// Re-export types using 'export type' syntax for isolated modules compatibility
export type { RelayInfo } from './relay-info-service';

// Export the CircuitBreaker and related types
export { CircuitBreaker, CircuitStateValues, circuitBreaker } from './circuit/circuit-breaker';
export type { CircuitState } from './circuit/circuit-breaker';

// No need for declaration merging here as it's causing issues
// We'll properly implement these methods in the RelayManager class instead
