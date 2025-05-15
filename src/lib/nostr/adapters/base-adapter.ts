
import { NostrService } from '../service';
import { formatPubkey, getHexFromNpub, getNpubFromHex } from '../utils/keys';

/**
 * Base adapter class that provides common functionality for all adapters
 */
export class BaseAdapter {
  protected service: NostrService;
  
  constructor(service: NostrService) {
    this.service = service;
  }
  
  /**
   * Check if the user is logged in
   */
  isLoggedIn(): boolean {
    return this.service.isLoggedIn();
  }
  
  /**
   * Get the user's public key
   */
  get publicKey(): string | null {
    return this.service.publicKey;
  }
  
  /**
   * Get account creation date
   */
  async getAccountCreationDate(pubkey: string): Promise<number | null> {
    return this.service.getAccountCreationDate(pubkey);
  }
  
  /**
   * Format a public key for display
   */
  formatPubkey(pubkey: string): string {
    return formatPubkey(pubkey);
  }
  
  /**
   * Convert a hex pubkey to npub format
   */
  getNpubFromHex(hexPubkey: string): string {
    return getNpubFromHex(hexPubkey);
  }
  
  /**
   * Convert an npub pubkey to hex format
   */
  getHexFromNpub(npub: string): string {
    return getHexFromNpub(npub);
  }
  
  /**
   * Sign out the current user
   */
  signOut(): void {
    return this.service.signOut();
  }
  
  /**
   * Login with NIP-07 extension or private key
   */
  async login(): Promise<string | null> {
    return this.service.login();
  }
}
