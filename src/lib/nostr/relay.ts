
import { RelayManager } from './relay/relay-manager';

// Re-export the RelayManager
export { RelayManager };

// Re-export types
export type { RelayInfo } from './relay/relay-info-service';

// Extend the RelayManager interface with the methods needed
declare module './relay/relay-manager' {
  interface RelayManager {
    getRelayStatus(): Array<{
      url: string;
      status: 'connected' | 'connecting' | 'disconnected' | 'failed';
      read?: boolean;
      write?: boolean;
    }>;
  }
}
