import { RelayInfo } from './relay-info-service';

export { ConnectionManager } from './connection-manager';
export { HealthManager } from './health-manager';
export { RelayInfoService, type RelayInfo } from './relay-info-service';

// Export the RelayManager without re-declaration
export { RelayManager } from './relay-manager';

// Import SimplePool - we need this for certain methods
import { SimplePool } from 'nostr-tools';

// Extend the RelayManager interface to include all methods needed
declare module './relay-manager' {
  interface RelayManager {
    connectToRelays(relayUrls: string[]): Promise<{ success: string[]; failures: string[] }>;
    connectToRelay(relayUrl: string, retryCount?: number): Promise<boolean>;
    addRelay(relayUrl: string, readWrite?: boolean): Promise<boolean>;
    removeRelay(relayUrl: string): void;
    addMultipleRelays(relayUrls: string[]): Promise<number>;
    getRelayInformation(relayUrl: string): Promise<RelayInfo | null>;
    doesRelaySupport(relayUrl: string, nipNumber: number): Promise<boolean>;
  }
}
