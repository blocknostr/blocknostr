
import { SimplePool, Event as NostrEvent } from 'nostr-tools';
import { EVENT_KINDS } from '../constants';

// EventManager interface 
export interface EventManager {
  getEvents: (filters: any[], relays: string[]) => Promise<NostrEvent[]>;
  getEventById: (id: string, relays: string[]) => Promise<NostrEvent | null>;
  getProfilesByPubkeys: (pubkeys: string[], relays: string[]) => Promise<Record<string, any>>;
  getUserProfile: (pubkey: string, relays?: string[]) => Promise<Record<string, any> | null>;
  verifyNip05: (pubkey: string, nip05Identifier: string) => Promise<boolean>;
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
  async getEvents(filters: any[], relays: string[]): Promise<NostrEvent[]> {
    try {
      return await this.pool.list(relays, filters);
    } catch (error) {
      console.error("Error getting events:", error);
      return [];
    }
  }

  /**
   * Get a specific event by ID
   */
  async getEventById(id: string, relays: string[]): Promise<NostrEvent | null> {
    try {
      const events = await this.pool.list(relays, [{ ids: [id] }]);
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
      // Use KIND.META (0) to fetch profile information
      const events = await this.pool.list(relays, [{ 
        kinds: [EVENT_KINDS.META], 
        authors: pubkeys 
      }]);

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
}

// Create and export a singleton instance
export const eventManager = new NostrEventManager();
