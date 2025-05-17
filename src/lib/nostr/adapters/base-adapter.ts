
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
    return this.service.publishEvent(event);
  }
  
  subscribe(filters: any[], onEvent: (event: any) => void) {
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
    // Delegate to the underlying service implementation
    if (typeof this.service.getAccountCreationDate === 'function') {
      return this.service.getAccountCreationDate(pubkey);
    }
    
    // Fallback implementation if the service doesn't have this method
    console.warn('getAccountCreationDate not implemented in underlying service');
    return null;
  }
  
  // Add additional adapter methods that might be needed
  async reactToPost(postId: string, reaction: string): Promise<boolean> {
    if (typeof this.service.reactToPost === 'function') {
      const result = await this.service.reactToPost(postId, reaction);
      // Convert string result to boolean
      return result ? true : false;
    }
    console.warn('reactToPost not implemented in underlying service');
    return false;
  }
  
  async repostNote(postId: string): Promise<boolean> {
    if (typeof this.service.repostNote === 'function') {
      const result = await this.service.repostNote(postId);
      // Convert string result to boolean
      return result ? true : false;
    }
    console.warn('repostNote not implemented in underlying service');
    return false;
  }
  
  async publishProfileMetadata(metadata: any): Promise<boolean> {
    if (typeof this.service.publishProfileMetadata === 'function') {
      return this.service.publishProfileMetadata(metadata);
    }
    console.warn('publishProfileMetadata not implemented in underlying service');
    return false;
  }
}
