
export { ConnectionManager } from './connection-manager';
export { HealthManager } from './health-manager';
export { RelayInfoService, type RelayInfo } from './relay-info-service';
export { RelayManager } from './relay-manager';

// Export circuit breaker functionality
export { circuitBreaker, CircuitState } from './circuit';
export type { CircuitOptions } from './circuit/types';

// Export relay performance functionality
export { relayPerformanceTracker } from './performance';
export type { RelayPerformanceData } from './performance/types';

// Export relay selection functionality
export { relaySelector } from './selection';
export type { RelaySelectionOptions } from './selection/types';

// Import SimplePool - we need this for certain methods
import { SimplePool } from 'nostr-tools';

// Extend the RelayManager interface to include all methods needed
declare module './relay-manager' {
  interface RelayManager {
    connectToRelays(relayUrls: string[]): Promise<void>;
    connectToRelay(relayUrl: string, retryCount?: number): Promise<boolean>;
    addRelay(relayUrl: string, readWrite?: boolean): Promise<boolean>;
    removeRelay(relayUrl: string): void;
    addMultipleRelays(relayUrls: string[]): Promise<number>;
    getRelayInformation(relayUrl: string): Promise<any | null>;
    doesRelaySupport(relayUrl: string, nipNumber: number): Promise<boolean>;
  }
}
