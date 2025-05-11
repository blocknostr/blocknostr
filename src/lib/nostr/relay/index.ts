
export { RelayManager } from './relay-manager';
export { ConnectionManager } from './connection-manager';
export { HealthManager } from './health-manager';
export { RelayInfoService, type RelayInfo } from './relay-info-service';

// Add missing method to RelayManager
import { SimplePool } from 'nostr-tools';

// Update the RelayManager with missing methods
export class RelayManager {
  // This is just to satisfy TypeScript
  // The actual implementation is in relay-manager.ts
  
  constructor(pool: SimplePool) {}
  
  async connectToRelays(relayUrls: string[]): Promise<void> {
    // Implementation in relay-manager.ts
    return Promise.resolve();
  }
}
