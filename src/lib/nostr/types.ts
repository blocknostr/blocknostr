
export interface NostrEvent {
  id?: string;
  pubkey?: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig?: string;
}

export interface Relay {
  url: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  read: boolean;
  write: boolean;
}

export interface NostrProfileMetadata {
  name?: string;
  display_name?: string;
  picture?: string;
  nip05?: string;
  about?: string;
  banner?: string;
  website?: string;
  lud16?: string; // Lightning address
  twitter?: string; // X (Twitter) handle
  twitter_verified?: boolean; // Track if Twitter/X account has been verified
  twitter_proof?: string; // Store proof of verification (e.g., tweet ID)
  [key: string]: any; // For any other custom fields
}

// NIP-B7 Trust-based relay schema
export interface NIPB7TrustedRelay {
  url: string;
  trust: number;  // 0 = default, 1 = untrusted, 2 = read-only, 3 = trusted, 4 = personal
  read: boolean;
  write: boolean;
}

// Add typings for the NIP-07 window extension
declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>;
      signEvent(event: object): Promise<NostrEvent>;
      // NIP-B7 Extension (may not be implemented by all extensions yet)
      getTrustedRelays?: () => Promise<NIPB7TrustedRelay[]>;
      addTrustedRelay?: (relay: NIPB7TrustedRelay) => Promise<boolean>;
      removeTrustedRelay?: (url: string) => Promise<boolean>;
      nip04?: {
        encrypt(pubkey: string, plaintext: string): Promise<string>;
        decrypt(pubkey: string, ciphertext: string): Promise<string>;
      };
    };
  }
}
