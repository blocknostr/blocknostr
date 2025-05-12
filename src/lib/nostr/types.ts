
// Extend or create the file with necessary types

// Basic Nostr event as per NIP-01
export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

// User profile metadata as per NIP-01
export interface NostrProfileMetadata {
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  nip05?: string;
  lud16?: string;
  website?: string;
  [key: string]: any;
}

// Circuit breaker state for relay connections
export type CircuitState = 'closed' | 'open' | 'half-open';

// Relay connection information with additional performance metrics
export interface Relay {
  url: string;
  status?: 'connected' | 'connecting' | 'disconnected' | 'error' | 'unknown' | 'failed';
  read?: boolean; 
  write?: boolean;
  score?: number;
  avgResponse?: number;
  circuitStatus?: string;
  isRequired?: boolean;
}

// Subscription filters as per NIP-01 and extensions
export interface NostrFilter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  since?: number;
  until?: number;
  limit?: number;
  [key: `#${string}`]: string[]; // Tag filters like #e, #p, etc.
}

// Define types for the proposal category
export type ProposalCategory = 
  | 'general' 
  | 'governance' 
  | 'treasury' 
  | 'technical' 
  | 'marketing' 
  | 'community' 
  | 'other';

// Add any additional types needed by the application
