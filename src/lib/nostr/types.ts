
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

// Complete user profile type
export interface NostrProfile extends NostrProfileMetadata {
  pubkey: string;
  created_at?: number;
  nip05Verified?: boolean;
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
  circuitStatus?: CircuitState;
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
  [key: `#${string}`]?: string[]; // Tag filters like #e, #p, etc.
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

// Note Card Props for the NoteCard component
export interface NoteCardProps {
  event: NostrEvent;
  showActionButtons?: boolean;
  profileData?: NostrProfileMetadata | null;
  isReply?: boolean;
  isDetailed?: boolean;
  inThread?: boolean;
}

// Bookmark types
export interface BookmarkCollection {
  id: string;
  name: string;
  color?: string;
  description?: string;
  count: number;
}

export interface BookmarkWithMetadata {
  eventId: string;
  title?: string;
  url?: string;
  note?: string;
  tags?: string[];
  collectionId?: string;
  addedAt: number;
}

// Add any additional types needed by the application
