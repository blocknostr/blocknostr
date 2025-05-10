
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

// Update the SubCloser type to match what nostr-tools returns (a function that closes the subscription)
export type SubCloser = () => void;

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

// Add typings for the NIP-07 window extension
declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>;
      signEvent(event: object): Promise<NostrEvent>;
      nip04?: {
        encrypt(pubkey: string, plaintext: string): Promise<string>;
        decrypt(pubkey: string, ciphertext: string): Promise<string>;
      };
    };
  }
}
