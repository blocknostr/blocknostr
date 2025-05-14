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
 * Extended Relay interface with performance metrics
 */
export interface Relay {
  url: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'failed';
  read: boolean;
  write: boolean;
  score?: number;
  avgResponse?: number;
  supportedNips?: number[];
  load?: number;
}

export interface NostrProfileMetadata {
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  nip05?: string;
  lud16?: string;
  website?: string;
  created_at?: number; // Explicitly define created_at as number
  [key: string]: unknown; // Changed from any to unknown
}

export type NostrFilter = {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  '#e'?: string[]; // Specific tags like this are compatible with the generic signature below
  '#p'?: string[];
  '#t'?: string[];
  since?: number;
  until?: number;
  limit?: number;
  search?: string; // For NIP-50 search queries
} & {
  [key: `#${string}`]: string[] | undefined; // Allows any #<char> tag with string array value, compatible with nostr-tools
};

export interface NostrSubscription {
  sub: string;
  filters: NostrFilter[];
  relays: string[];
  callbacks: {
    onevent: (event: NostrEvent) => void;
    onclose: () => void;
  };
  unsub?: () => void;
}
