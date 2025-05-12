
/**
 * Represents a Nostr relay with connection status
 */
export interface Relay {
  url: string;
  status?: 'connected' | 'connecting' | 'disconnected' | 'error' | 'unknown';
  read?: boolean;
  write?: boolean;
}

/**
 * Represents a standard Nostr event
 */
export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

/**
 * Represents a filter for querying Nostr events
 */
export interface NostrFilter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  '#e'?: string[];
  '#p'?: string[];
  '#t'?: string[];
  since?: number;
  until?: number;
  limit?: number;
}

/**
 * Profile metadata as used in kind 0 events
 */
export interface NostrProfileMetadata {
  name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  nip05?: string;
  lud16?: string;
  website?: string;
  display_name?: string;
  [key: string]: any; // Allow for custom fields
}
