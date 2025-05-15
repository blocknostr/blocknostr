
import { NostrService } from '../service';

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
}
