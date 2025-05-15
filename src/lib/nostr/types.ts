
import { Filter } from 'nostr-tools';
import { CircuitState } from './relay/circuit/circuit-breaker';

// Re-export the Filter type from nostr-tools as NostrFilter
export type NostrFilter = Filter;

export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface Relay {
  url: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'failed';
  read: boolean;
  write: boolean;
  score?: number;
  avgResponse?: number;
  circuitStatus?: CircuitState | string;
  isRequired?: boolean;
}

// Add NostrProfileMetadata type for user.ts
export interface NostrProfileMetadata {
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  website?: string;
  nip05?: string;
  lud16?: string;
  [key: string]: string | undefined;
}
