import { SimplePool, type Event } from 'nostr-tools';
import { NostrEvent } from '../types';
import { EVENT_KINDS } from '../constants';

/**
 * Manages event publishing, subscription, and retrieval
 */
export class EventManager {
  /**
   * Publish an event to specified relays
   */
  async publishEvent(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
    event: Partial<NostrEvent>,
    relays: string[]
  ): Promise<string | null> {
    return new Promise((resolve, reject) => {
      if (!publicKey) {
        reject(new Error("Cannot publish event: No public key provided"));
        return;
      }
      
      // Ensure the event has the required fields
      const signedEvent: NostrEvent = {
        kind: event.kind || 1,
        pubkey: publicKey,
        content: event.content || '',
        created_at: Math.floor(Date.now() / 1000),
        tags: event.tags || [],
      };
      
      // Sign the event using the window.nostr extension
      window.nostr?.signEvent(signedEvent)
        .then(signed => {
          if (!signed) {
            reject(new Error("Failed to sign event"));
            return;
          }
          
          const pub = pool.publish(relays, signed);
          
          let completedRelays = 0;
          let success = false;
          
          pub.on('ok', (relay: string) => {
            console.log(`Event sent to relay ${relay}`);
            completedRelays++;
            success = true;
            if (completedRelays === relays.length) {
              resolve(signedEvent.id || null);
            }
          });
          
          pub.on('failed', (relay: string) => {
            console.log(`Failed to send to ${relay}`);
            completedRelays++;
            if (completedRelays === relays.length && !success) {
              reject(new Error("Failed to publish event to any relay"));
            }
          });
          
          // Set a timeout to resolve even if some relays fail
          setTimeout(() => {
            if (completedRelays < relays.length && success) {
              resolve(signedEvent.id || null);
            } else if (completedRelays === relays.length && !success) {
              reject(new Error("Failed to publish event to any relay"));
            }
          }, 5000);
        })
        .catch(err => {
          console.error("Error signing event:", err);
          reject(err);
        });
    });
  }
  
  /**
   * Publish profile metadata event (kind 0)
   */
  async publishProfileMetadata(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
    metadata: Record<string, any>,
    relays: string[]
  ): Promise<boolean> {
    if (!publicKey) {
      console.error("Cannot publish profile: No public key provided");
      return false;
    }
    
    const event = {
      kind: EVENT_KINDS.METADATA,
      content: JSON.stringify(metadata),
      tags: []
    };
    
    try {
      await this.publishEvent(pool, publicKey, privateKey, event, relays);
      return true;
    } catch (e) {
      console.error("Error publishing profile:", e);
      return false;
    }
  }

  /**
   * Subscribe to events using filters
   * Returns a subscription ID that can be used to unsubscribe
   */
  subscribeToEvents(pool: SimplePool, filters: any[], relays: string[]): { sub: string, unsubscribe: () => void } {
    try {
      // Fix the subscription to use proper SimplePool API
      const subscription = pool.sub(relays, filters);
      
      return {
        sub: subscription.sub,
        unsubscribe: () => subscription.unsub()
      };
    } catch (error) {
      console.error('Error subscribing to events:', error);
      return {
        sub: '',
        unsubscribe: () => {}
      };
    }
  }

  /**
   * Get profile metadata for multiple users
   */
  async getProfilesByPubkeys(pool: SimplePool, pubkeys: string[], relays: string[]): Promise<Record<string, any>> {
    return new Promise((resolve) => {
      const profiles: Record<string, any> = {};
      const sub = pool.sub(relays, [{kinds: [0], authors: pubkeys}]);
      
      sub.on('event', (event) => {
        try {
          if (event.kind === 0) {
            profiles[event.pubkey] = JSON.parse(event.content);
          }
        } catch (error) {
          console.error('Error parsing profile:', error);
        }
      });
      
      // Set timeout to resolve after 3 seconds
      setTimeout(() => {
        sub.unsub();
        resolve(profiles);
      }, 3000);
    });
  }

  /**
   * Get events by IDs
   */
  async getEvents(pool: SimplePool, ids: string[], relays: string[]): Promise<any[]> {
    return new Promise((resolve) => {
      const events: any[] = [];
      const sub = pool.sub(relays, [{ids}]);
      
      sub.on('event', (event) => {
        events.push(event);
      });
      
      // Set timeout to resolve after 3 seconds
      setTimeout(() => {
        sub.unsub();
        resolve(events);
      }, 3000);
    });
  }

  /**
   * Get a single event by ID
   */
  async getEventById(pool: SimplePool, id: string, relays: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const sub = pool.sub(relays, [{ids: [id]}]);
      
      sub.on('event', (event) => {
        if (event.id === id) {
          sub.unsub();
          resolve(event);
        }
      });
      
      // Set timeout to reject after 5 seconds
      setTimeout(() => {
        sub.unsub();
        reject(new Error(`Timeout fetching event ${id}`));
      }, 5000);
    });
  }

  /**
   * Get a user profile
   */
  async getUserProfile(pool: SimplePool, pubkey: string, relays: string[]): Promise<any> {
    const profiles = await this.getProfilesByPubkeys(pool, [pubkey], relays);
    return profiles[pubkey] || null;
  }

  /**
   * Verify a NIP-05 identifier
   */
  async verifyNip05(identifier: string, pubkey: string): Promise<boolean> {
    try {
      const [name, domain] = identifier.split('@');
      if (!name || !domain) return false;
      
      const url = `https://${domain}/.well-known/nostr.json?name=${name}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.names && data.names[name] === pubkey) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error verifying NIP-05:', error);
      return false;
    }
  }
}
