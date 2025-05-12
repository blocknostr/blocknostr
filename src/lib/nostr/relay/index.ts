
import { RelayManager } from './relay-manager';

// Re-export the RelayManager
export { RelayManager };

// Re-export types
export type { RelayInfo } from './relay-info-service';

// Export the CircuitBreaker and related types
export { CircuitBreaker, CircuitState, CircuitStateValues, circuitBreaker } from './circuit/circuit-breaker';

// No need for declaration merging here as it's causing issues
// We'll properly implement these methods in the RelayManager class instead
