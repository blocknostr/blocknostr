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
  lud16?: string;
  website?: string;
  [key: string]: any;
}

export type NostrFilter = {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  '#e'?: string[];
  '#p'?: string[];
  '#t'?: string[];
  since?: number;
  until?: number;
  limit?: number;
  [key: string]: any;
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

