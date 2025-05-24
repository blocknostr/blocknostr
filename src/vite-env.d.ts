
/// <reference types="vite/client" />

// Add custom type definitions for nostr extension
interface Window {
  nostr?: {
    getPublicKey(): Promise<string>;
    signEvent(event: any): Promise<any>;
    getRelays?(): Promise<Record<string, {read: boolean, write: boolean}>>;
    // Add nip04 encryption/decryption methods
    nip04?: {
      encrypt(pubkey: string, plaintext: string): Promise<string>;
      decrypt(pubkey: string, ciphertext: string): Promise<string>;
    }
  }
}

// Extend NostrService interface to support profile operations
interface NostrService {
  publicKey: string | null;
  isLoggedIn(): boolean;
  login(): Promise<boolean>;
  signOut(): Promise<boolean>;
  logout(): Promise<boolean>;
  getNpubFromHex(hex: string): string;
  getHexFromNpub(npub: string): string;
  getUserProfile(pubkey: string): Promise<any>;
  updateProfile(profileData: Record<string, string>): Promise<boolean>;
}
