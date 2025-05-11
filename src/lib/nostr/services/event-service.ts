
import { SimplePool } from 'nostr-tools';
import { NostrEvent } from '../types';
import { EVENT_KINDS } from '../constants';

/**
 * Service for managing Nostr events
 */
export class EventService {
  constructor(
    private pool: SimplePool,
    private getPublicKey: () => string | null,
    private getConnectedRelayUrls: () => string[]
  ) {}

  /**
   * Publish a Nostr event
   */
  async publishEvent(event: Partial<NostrEvent>, relays?: string[]): Promise<string | null> {
    const publicKey = this.getPublicKey();
    if (!publicKey) return null;
    
    try {
      const relayUrls = relays || this.getConnectedRelayUrls();
      if (relayUrls.length === 0) {
        throw new Error('No connected relays available for publishing');
      }
      
      // Use NIP-07 extension for signing
      const signedEvent = await window.nostr.signEvent({
        kind: event.kind || EVENT_KINDS.TEXT_NOTE,
        created_at: Math.floor(Date.now() / 1000),
        tags: event.tags || [],
        content: event.content || '',
        ...event
      });
      
      // Publish to all connected relays
      const pubs = relayUrls.map(relay => {
        return this.pool.publish([relay], signedEvent);
      });
      
      await Promise.all(pubs);
      return signedEvent.id;
    } catch (error) {
      console.error('Error publishing event:', error);
      return null;
    }
  }

  /**
   * Publish profile metadata
   */
  async publishProfileMetadata(metadata: Record<string, any>, relays?: string[]): Promise<boolean> {
    try {
      const eventId = await this.publishEvent({
        kind: EVENT_KINDS.META,
        content: JSON.stringify(metadata)
      }, relays);
      
      return !!eventId;
    } catch (error) {
      console.error('Error publishing profile metadata:', error);
      return false;
    }
  }
  
  /**
   * Get a single event by ID
   */
  async getEventById(id: string, relays?: string[]): Promise<NostrEvent | null> {
    const relayUrls = relays || this.getConnectedRelayUrls();
    if (relayUrls.length === 0) return null;
    
    try {
      const events = await this.pool.get(relayUrls, {
        ids: [id]
      });
      
      return events || null;
    } catch (error) {
      console.error(`Error getting event ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Get multiple events by ID
   */
  async getEvents(ids: string[], relays?: string[]): Promise<NostrEvent[]> {
    const relayUrls = relays || this.getConnectedRelayUrls();
    if (relayUrls.length === 0 || ids.length === 0) return [];
    
    try {
      const events = await this.pool.list(relayUrls, [{
        ids: ids
      }]);
      
      return events || [];
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }
}
