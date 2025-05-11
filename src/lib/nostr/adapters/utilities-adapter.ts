
import { formatPubkey, getNpubFromHex, getHexFromNpub } from '../utils/keys';
import { nostrService as originalNostrService } from '../service';

/**
 * Utility adapter methods
 */
export class UtilitiesAdapter {
  private service: typeof originalNostrService;
  
  constructor(service: typeof originalNostrService) {
    this.service = service;
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
}
