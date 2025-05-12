
import { BaseAdapter } from './base-adapter';
import { NostrFilter } from '../types';

export class DataAdapter extends BaseAdapter {
  /**
   * Get a specific event by ID
   */
  async getEventById(id: string) {
    return this.service.getEventById(id);
  }
  
  /**
   * Get multiple events by their IDs
   */
  async getEvents(ids: string[] | NostrFilter[]) {
    // Convert string[] to NostrFilter[] if needed
    const filters: NostrFilter[] = Array.isArray(ids) && typeof ids[0] === 'string' 
      ? [{ ids: ids as string[] }]
      : ids as NostrFilter[];
      
    return this.service.getEvents(filters);
  }
  
  /**
   * Get profiles for multiple pubkeys
   */
  async getProfilesByPubkeys(pubkeys: string[]) {
    return this.service.getProfilesByPubkeys(pubkeys);
  }
  
  /**
   * Get profile for a single pubkey
   */
  async getUserProfile(pubkey: string) {
    return this.service.getUserProfile(pubkey);
  }
  
  /**
   * Verify a NIP-05 identifier
   */
  async verifyNip05(identifier: string, pubkey: string) {
    return this.service.verifyNip05(identifier, pubkey);
  }
}
