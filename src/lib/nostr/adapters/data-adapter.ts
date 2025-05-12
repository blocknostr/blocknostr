
import { BaseAdapter } from './base-adapter';

/**
 * Adapter for data retrieval operations
 */
export class DataAdapter extends BaseAdapter {
  // Data retrieval methods
  async getEventById(id: string) {
    return this.service.getEventById(id);
  }
  
  async getEvents(ids: string[]) {
    return this.service.getEvents(ids);
  }
  
  async getProfilesByPubkeys(pubkeys: string[]) {
    return this.service.getProfilesByPubkeys(pubkeys);
  }
  
  async getUserProfile(pubkey: string) {
    return this.service.getUserProfile(pubkey);
  }
  
  async verifyNip05(identifier: string, pubkey: string) {
    return this.service.verifyNip05(identifier, pubkey);
  }
}
