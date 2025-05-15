
import { NostrService } from '../service';

/**
 * Base adapter class that other adapters extend from
 * Provides access to the NostrService instance
 */
export class BaseAdapter {
  protected service: NostrService;
  
  constructor(service: NostrService) {
    this.service = service;
  }
  
  // Common properties from service
  get publicKey(): string | null {
    return this.service.publicKey;
  }
  
  get following(): string[] {
    return this.service.following;
  }
  
  get relays(): any[] {
    return this.service.relays;
  }
  
  // Common methods from service
  async login() {
    return this.service.login();
  }
  
  async signOut() {
    return this.service.signOut();
  }
  
  formatPubkey(pubkey: string, format?: 'short' | 'medium' | 'full') {
    return this.service.formatPubkey(pubkey, format);
  }
  
  getNpubFromHex(hex: string) {
    return this.service.getNpubFromHex(hex);
  }
  
  getHexFromNpub(npub: string) {
    return this.service.getHexFromNpub(npub);
  }
  
  // Fixed signature for subscribe
  subscribe(filters: any[], onEvent: (event: any) => void, options: any = {}) {
    return this.service.subscribe(filters, onEvent, options);
  }
  
  unsubscribe(subId: string) {
    return this.service.unsubscribe(subId);
  }
  
  publishEvent(event: any) {
    return this.service.publishEvent(event);
  }
}
