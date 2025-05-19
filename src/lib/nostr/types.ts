
export interface NostrProfile {
  pubkey?: string;
  name?: string;
  displayName?: string;
  display_name?: string;
  picture?: string;
  banner?: string;
  about?: string;
  website?: string;
  nip05?: string;
  lud16?: string;
  created_at?: number;
  _event?: any;
  [key: string]: any;
}

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
  read: boolean;
  write: boolean;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
}

export interface NostrProfileMetadata {
  name?: string;
  display_name?: string;
  picture?: string;
  banner?: string;
  about?: string;
  website?: string;
  nip05?: string;
  lud16?: string;
  [key: string]: any;
}
