
import { formatPubkey, getNpubFromHex, getHexFromNpub } from '../utils/keys';
import { nostrService } from '../service';
import { NostrServiceInterface } from '../types/service-interface';

/**
 * Base adapter class that provides core functionality
 */
export class BaseAdapter {
  protected service: NostrServiceInterface;
  
  constructor(service: NostrServiceInterface) {
    this.service = service;
  }

  // Auth methods
  get publicKey() {
    return this.service.publicKey;
  }
  
  get following() {
    return this.service.following;
  }
  
  async login() {
    return this.service.login();
  }
  
  signOut() {
    return this.service.signOut();
  }
  
  // Utilities
  formatPubkey(pubkey: string) {
    if (this.service.formatPubkey) {
      return this.service.formatPubkey(pubkey);
    }
    return formatPubkey(pubkey);
  }
  
  getNpubFromHex(hexPubkey: string) {
    if (this.service.getNpubFromHex) {
      return this.service.getNpubFromHex(hexPubkey);
    }
    return getNpubFromHex(hexPubkey);
  }
  
  getHexFromNpub(npub: string) {
    if (this.service.getHexFromNpub) {
      return this.service.getHexFromNpub(npub);
    }
    return getHexFromNpub(npub);
  }
  
  // Core methods
  async publishEvent(event: any) {
    return this.service.publishEvent(event);
  }
  
  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]) {
    return this.service.subscribe(filters, onEvent, relays);
  }
  
  unsubscribe(subId: string) {
    return this.service.unsubscribe(subId);
  }
  
  /**
   * Fetch user's oldest metadata event to determine account creation date (NIP-01)
   * @param pubkey User's public key
   * @returns Timestamp of the oldest metadata event or null
   */
  async getAccountCreationDate(pubkey: string): Promise<number | null> {
    // Delegate to the underlying service implementation
    if (this.service.getAccountCreationDate) {
      return this.service.getAccountCreationDate(pubkey);
    }
    
    // Fallback implementation if the service doesn't have this method
    console.warn('getAccountCreationDate not implemented in underlying service');
    return null;
  }
}
