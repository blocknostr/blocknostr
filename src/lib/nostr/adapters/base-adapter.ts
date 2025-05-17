
import { formatPubkey, getNpubFromHex, getHexFromNpub } from '../utils/keys';
import { nostrService } from '../service';

/**
 * Base adapter class that provides core functionality
 */
export class BaseAdapter {
  protected service: typeof nostrService;
  
  constructor(service: typeof nostrService) {
    this.service = service;
  }

  // Auth methods
  get publicKey() {
    return this.service.publicKey;
  }
  
  get following() {
    // The service now has a following property
    return this.service.following;
  }
  
  async login() {
    // The service now has a login method
    return this.service.login();
  }
  
  signOut() {
    // The service now has a signOut method
    return this.service.signOut();
  }
  
  // Utilities
  formatPubkey(pubkey: string) {
    return formatPubkey(pubkey);
  }
  
  getNpubFromHex(hexPubkey: string) {
    return getNpubFromHex(hexPubkey);
  }
  
  getHexFromNpub(npub: string) {
    return getHexFromNpub(npub);
  }
  
  // Core methods
  async publishEvent(event: any) {
    // The service now has a publishEvent method
    return this.service.publishEvent(event);
  }
  
  subscribe(filters: any[], onEvent: (event: any) => void) {
    // Updated to match service signature with two parameters
    return this.service.subscribe(filters, onEvent);
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
    // The service now has a getAccountCreationDate method
    return this.service.getAccountCreationDate(pubkey);
  }
}
