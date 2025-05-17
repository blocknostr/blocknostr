
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
    return []; // Return an empty array as fallback
  }
  
  async login() {
    console.log("Base adapter login called");
    return false;
  }
  
  signOut() {
    console.log("Base adapter signOut called");
    return false;
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
    console.log("Base adapter publishEvent called");
    return null;
  }
  
  subscribe(filters: any[], onEvent: (event: any) => void) {
    console.log("Base adapter subscribe called");
    return () => {}; // Return cleanup function
  }
  
  unsubscribe(subId: string) {
    return this.service.unsubscribe?.(subId) || false;
  }
  
  /**
   * Fetch user's oldest metadata event to determine account creation date (NIP-01)
   * @param pubkey User's public key
   * @returns Timestamp of the oldest metadata event or null
   */
  async getAccountCreationDate(pubkey: string): Promise<number | null> {
    console.log(`Getting account creation date for ${pubkey}`);
    return null;
  }
}
