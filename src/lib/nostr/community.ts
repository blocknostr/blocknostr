
import { SimplePool } from 'nostr-tools';
import { EventManager } from './event';
import { NostrEvent } from './types';
import { EVENT_KINDS } from './constants';

/**
 * Community Manager class for handling community-related operations
 * Implementation following NIP-172 for community and group events
 */
export class CommunityManager {
  private eventManager: EventManager;

  constructor(eventManager: EventManager) {
    this.eventManager = eventManager;
  }

  /**
   * Publish a Nostr event
   * Helper method for other components to publish events
   */
  async publishEvent(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null,
    event: any,
    relays: string[]
  ): Promise<string | null> {
    console.log("CommunityManager.publishEvent called with:", { 
      event, 
      publicKey: publicKey ? publicKey.slice(0, 8) + '...' : null,
      hasPrivateKey: !!privateKey,
      relaysCount: relays.length
    });
    
    if (!publicKey) {
      console.error("Cannot publish event: missing publicKey");
      throw new Error("Public key required to publish event");
    }
    
    if (relays.length === 0) {
      console.warn("No relays provided for publishing, using default relays");
      relays = [
        'wss://relay.damus.io',
        'wss://nos.lol',
        'wss://relay.nostr.band',
        'wss://nostr.bitcoiner.social'
      ];
    }
    
    try {
      // Ensure we're connected to at least some of these relays
      const connectedRelays = [];
      for (const relay of relays) {
        try {
          await pool.ensureRelay(relay);
          connectedRelays.push(relay);
        } catch (err) {
          console.warn(`Failed to connect to relay ${relay}:`, err);
        }
      }
      
      if (connectedRelays.length === 0) {
        console.error("Failed to connect to any relays");
        throw new Error("Unable to connect to any relays");
      }
      
      console.log(`Connected to ${connectedRelays.length} relays for publishing`);
      
      // Now publish using the event manager
      return this.eventManager.publishEvent(pool, publicKey, privateKey, event, connectedRelays);
    } catch (error) {
      console.error("Error in CommunityManager.publishEvent:", error);
      throw error;
    }
  }
}
