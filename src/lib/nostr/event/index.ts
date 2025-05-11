
import { SimplePool, nip19, type Event, type Filter } from 'nostr-tools';
import { EVENT_KINDS } from '../constants';

// EventManager interface 
export interface EventManager {
  getEvents: (filters: any[], relays: string[]) => Promise<any[]>;
  getEventById: (id: string, relays: string[]) => Promise<any | null>;
  getProfilesByPubkeys: (pubkeys: string[], relays: string[]) => Promise<Record<string, any>>;
  getUserProfile: (pubkey: string, relays?: string[]) => Promise<Record<string, any> | null>;
  verifyNip05: (pubkey: string, nip05Identifier: string) => Promise<boolean>;
  publishEvent: (event: any) => Promise<string>;
}

/**
 * EventManager for handling Nostr events
 */
export class NostrEventManager implements EventManager {
  private pool: SimplePool;
  
  constructor() {
    this.pool = new SimplePool();
  }

  /**
   * Get events based on filters
   */
  async getEvents(filters: any[], relays: string[]): Promise<any[]> {
    try {
      // Convert array of filters to proper Filter format
      // Use the first filter or create a default one
      const filter: Filter = filters.length > 0 ? filters[0] : { kinds: [1] };
      
      return await this.pool.querySync(relays, filter);
    } catch (error) {
      console.error("Error getting events:", error);
      return [];
    }
  }

  /**
   * Get a specific event by ID
   */
  async getEventById(id: string, relays: string[]): Promise<any | null> {
    try {
      // Create a proper filter object
      const filter: Filter = { ids: [id] };
      
      const events = await this.pool.querySync(relays, filter);
      return events.length > 0 ? events[0] : null;
    } catch (error) {
      console.error(`Error fetching event ${id}:`, error);
      return null;
    }
  }

  /**
   * Get profiles for multiple pubkeys
   */
  async getProfilesByPubkeys(pubkeys: string[], relays: string[]): Promise<Record<string, any>> {
    try {
      // Create a proper filter object
      const filter: Filter = { 
        kinds: [EVENT_KINDS.META], 
        authors: pubkeys 
      };
      
      const events = await this.pool.querySync(relays, filter);
      const profiles: Record<string, any> = {};

      for (const event of events) {
        try {
          const contentJson = JSON.parse(event.content);
          profiles[event.pubkey] = contentJson;
        } catch (e) {
          console.error("Error parsing profile content:", e);
        }
      }

      return profiles;
    } catch (error) {
      console.error("Error getting profiles:", error);
      return {};
    }
  }

  /**
   * Get profile for a single user
   */
  async getUserProfile(pubkey: string, relays: string[] = []): Promise<Record<string, any> | null> {
    try {
      const profiles = await this.getProfilesByPubkeys([pubkey], relays);
      return profiles[pubkey] || null;
    } catch (error) {
      console.error(`Error getting profile for ${pubkey}:`, error);
      return null;
    }
  }

  /**
   * Verify NIP-05 identifier
   */
  async verifyNip05(pubkey: string, nip05Identifier: string): Promise<boolean> {
    try {
      if (!nip05Identifier || !nip05Identifier.includes('@')) return false;
      
      const [name, domain] = nip05Identifier.split('@');
      if (!name || !domain) return false;

      const response = await fetch(`https://${domain}/.well-known/nostr.json?name=${name}`);
      if (!response.ok) return false;

      const data = await response.json();
      return data.names?.[name] === pubkey;
    } catch (error) {
      console.error("Error verifying NIP-05:", error);
      return false;
    }
  }
  
  /**
   * Publish an event
   */
  async publishEvent(event: any): Promise<string> {
    // This is a placeholder - actual implementation would sign and publish the event
    console.log("Publishing event:", event);
    return "event_id_" + Math.random().toString(36).substring(2, 10);
  }
}

// Create and export a singleton instance
export const eventManager = new NostrEventManager();
