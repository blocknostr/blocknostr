
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
      
      // Add a shorter timeout for this specific operation
      const timeoutPromise = new Promise<NostrEvent[]>(resolve => {
        setTimeout(() => resolve([]), 5000); // 5 second timeout max
      });
      
      // Race between the actual query and the timeout
      const queryPromise = this.service.queryEvents([filter]);
      const events = await Promise.race([queryPromise, timeoutPromise]);
      
      return Array.isArray(events) ? events : [];
    } catch (error) {
      console.error(`Error getting events for user ${pubkey}:`, error);
      return [];
    }
  }
}
