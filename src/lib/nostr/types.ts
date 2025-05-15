import { Event } from 'nostr-tools';

/**
 * Nostr Event interface - extends the base Event interface from nostr-tools
 */
export interface NostrEvent extends Event {
  // Add any custom fields here
  [key: string]: any;
}

/**
 * Nostr Profile Metadata interface - defines the structure of profile metadata
 */
export interface NostrProfileMetadata {
  name: string;
  display_name?: string;
  picture?: string;
  about?: string;
  website?: string;
  banner?: string;
  lud16?: string;
  nip05?: string;
}

/**
 * Relay interface - defines the structure of a relay object
 */
export interface Relay {
  url: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'failed';
  read: boolean;
  write: boolean;
  score?: number;
  avgResponse?: number;
  circuitStatus?: any;
  isRequired?: boolean;
}
