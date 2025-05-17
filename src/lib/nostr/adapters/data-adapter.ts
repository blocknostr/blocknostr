
import { BaseAdapter } from './base-adapter';
import { NostrEvent } from '@/lib/nostr';
import { Filter } from 'nostr-tools';

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
  
  /**
   * Get events authored by a specific user with proper implementation
   */
  async getEventsByUser(pubkey: string, limit: number = 20): Promise<NostrEvent[]> {
    if (!pubkey) return [];
    
    try {
      // Construct a filter to get user's notes
      const filter: Filter = { 
        authors: [pubkey],
        kinds: [1], // Notes
        limit
      };
      
      // Use the existing getEvents method with the filter
      // We need to pass an array of filters, not just a single filter
      const events = await this.service.getEvents([filter]);
      return Array.isArray(events) ? events : [];
    } catch (error) {
      console.error(`Error getting events for user ${pubkey}:`, error);
      return [];
    }
  }
}
