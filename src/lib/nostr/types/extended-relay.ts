
import { Relay } from '@/lib/nostr';
import { CircuitState } from '@/lib/nostr/relay/circuit/circuit-breaker';

/**
 * Extended version of the basic Relay type with additional properties
 * used by the UI components
 */
export interface ExtendedRelay extends Relay {
  // Basic status info (required by Relay interface)
  url: string;
  read?: boolean;
  write?: boolean;
  
  // Additional properties
  score?: number;
  avgResponse?: number;
  status?: string | number;
  circuitStatus?: CircuitState;
  isRequired?: boolean;
}
