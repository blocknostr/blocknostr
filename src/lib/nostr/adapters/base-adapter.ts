
import { nostrService } from '../service';
import { BaseAdapterInterface } from '../types/adapter';

/**
 * Base adapter class that all other adapters extend
 * Provides common functionality and access to NostrService instance
 */
export class BaseAdapter implements BaseAdapterInterface {
  protected service: typeof nostrService;

  constructor(service: typeof nostrService) {
    this.service = service;
  }

  get publicKey(): string | null {
    return this.service.publicKey;
  }

  async login(): Promise<string | null> {
    const success = await this.service.login();
    return success ? this.service.publicKey : null;
  }

  signOut(): void {
    this.service.signOut();
  }

  formatPubkey(pubkey: string, format: 'short' | 'medium' | 'full' = 'short'): string {
    return this.service.formatPubkey(pubkey);
  }

  getNpubFromHex(hexPubkey: string): string {
    return this.service.getNpubFromHex(hexPubkey);
  }

  getHexFromNpub(npub: string): string {
    return this.service.getHexFromNpub(npub);
  }
  
  // Add required methods that were missing
  isLoggedIn(): boolean {
    return this.service.isLoggedIn();
  }
  
  hasConnectedRelays(): boolean {
    return this.service.hasConnectedRelays();
  }
}
