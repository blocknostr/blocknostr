
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
