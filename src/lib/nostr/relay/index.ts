
export { ConnectionManager } from './connection-manager';
export { HealthManager } from './health-manager';
export { RelayInfoService, type RelayInfo } from './relay-info-service';
export { RelayManager } from './relay-manager';

// Import SimplePool - we need this for certain methods
import { SimplePool } from 'nostr-tools';

// Extend the RelayManager interface with methods needed elsewhere
declare module './relay-manager' {
  interface RelayManager {
    connectToRelays: (relayUrls: string[]) => Promise<void>;
    connectToRelay: (relayUrl: string) => Promise<boolean>;
  }
}
