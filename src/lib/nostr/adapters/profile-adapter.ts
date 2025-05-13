
import { BaseAdapter } from './base-adapter';

/**
 * Adapter for profile operations
 */
export class ProfileAdapter extends BaseAdapter {
  /**
   * Get profile information for a user
   */
  async getUserProfile(pubkey: string) {
    return this.service.getUserProfile(pubkey);
  }
  
  /**
   * Update the current user's profile
   */
  async updateProfile(metadata: Record<string, any>) {
    return this.service.publishProfileMetadata(metadata);
  }
  
  /**
   * Get profiles for multiple users
   */
  async getProfilesByPubkeys(pubkeys: string[]) {
    return this.service.getProfilesByPubkeys(pubkeys);
  }
  
  /**
   * Verify a user's NIP-05 identifier
   */
  async verifyNip05(identifier: string, pubkey: string) {
    return this.service.verifyNip05(identifier, pubkey);
  }
  
  /**
   * Fetch a user's account creation date
   */
  async getAccountCreationDate(pubkey: string) {
    return this.service.getAccountCreationDate(pubkey);
  }
}
