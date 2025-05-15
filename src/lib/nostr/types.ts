
import { Filter } from 'nostr-tools';

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
  circuitStatus?: string;
  isRequired?: boolean;
}
