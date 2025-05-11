
import { SimplePool, Event as NostrToolsEvent } from 'nostr-tools';
import { nip05 } from 'nostr-tools';
import { NostrEvent } from '../types';

/**
 * Manages Nostr events
 */
export class EventManager {
  /**
   * Publishes an event to relays
   */
  async publishEvent(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
    event: any,
    relays: string[]
  ): Promise<string | null> {
    if (!publicKey) {
      throw new Error("Cannot publish event: No public key provided");
    }
    
    // Ensure we have at least one relay to publish to
    if (relays.length === 0) {
      throw new Error("No relays available to publish to");
    }
    
    try {
      // If no private key provided (browser extension handles signing)
      if (!privateKey || privateKey === undefined) {
        // Check if window.nostr is available
        if (!window.nostr) {
          throw new Error("No private key and no Nostr extension available for signing");
        }
        
        // Prepare the event
        const unsignedEvent: any = {
          kind: event.kind,
          content: event.content || '',
          tags: event.tags || [],
          created_at: event.created_at || Math.floor(Date.now() / 1000),
          pubkey: publicKey
        };
        
        // Sign with extension
        const signedEvent = await window.nostr.signEvent(unsignedEvent);
        
        // Publish to relays
        const pubs = pool.publish(relays, signedEvent);
        
        // Wait for at least one OK response
        let published = false;
        const promises = pubs.map(pub => {
          return new Promise<boolean>((resolve) => {
            // Use subscribe instead of direct event handling
            const timeout = setTimeout(() => resolve(false), 5000);
            
            pub.then(() => {
              clearTimeout(timeout);
              published = true;
              resolve(true);
            }).catch(() => {
              resolve(false);
            });
          });
        });
        
        await Promise.all(promises);
        return published ? signedEvent.id : null;
      } else {
        // Private key is provided, but we don't handle this case in the browser
        throw new Error("Direct private key signing not implemented for security reasons");
      }
    } catch (error) {
      console.error("Error publishing event:", error);
      throw error;
    }
  }
  
  /**
   * Publishes profile metadata
   */
  async publishProfileMetadata(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
    metadata: Record<string, any>,
    relays: string[]
  ): Promise<boolean> {
    try {
      const event = {
        kind: 0,
        content: JSON.stringify(metadata),
        tags: []
      };
      
      const result = await this.publishEvent(pool, publicKey, privateKey, event, relays);
      return !!result;
    } catch (error) {
      console.error("Error publishing profile metadata:", error);
      return false;
    }
  }

  /**
   * Gets an event by ID
   */
  async getEventById(
    pool: SimplePool,
    id: string,
    relays: string[]
  ): Promise<any | null> {
    return new Promise((resolve) => {
      let event = null;
      
      // Create a subscription for this event
      const subscription = pool.subscribe(relays, [{ ids: [id] }]);
      
      subscription.on('event', (e) => {
        event = e;
        subscription.close(); // Close the subscription once we have the event
        resolve(event);
      });
      
      setTimeout(() => {
        subscription.close(); // Close after timeout
        resolve(event);
      }, 5000);
    });
  }

  /**
   * Gets multiple events by IDs
   */
  async getEvents(
    pool: SimplePool,
    ids: string[],
    relays: string[]
  ): Promise<any[]> {
    return new Promise((resolve) => {
      const events: any[] = [];
      
      // Create a subscription for these events
      const subscription = pool.subscribe(relays, [{ ids }]);
      
      subscription.on('event', (e) => {
        events.push(e);
      });
      
      setTimeout(() => {
        subscription.close(); // Close after timeout
        resolve(events);
      }, 5000);
    });
  }

  /**
   * Gets profiles for a list of pubkeys
   */
  async getProfilesByPubkeys(
    pool: SimplePool,
    pubkeys: string[],
    relays: string[]
  ): Promise<Record<string, any>> {
    return new Promise((resolve) => {
      const profiles: Record<string, any> = {};
      
      // Create a subscription for these profiles
      const subscription = pool.subscribe(relays, [
        { kinds: [0], authors: pubkeys }
      ]);
      
      subscription.on('event', (event) => {
        try {
          const profile = JSON.parse(event.content);
          profiles[event.pubkey] = profile;
        } catch (e) {
          console.error("Failed to parse profile:", e);
        }
      });
      
      setTimeout(() => {
        subscription.close(); // Close after timeout
        resolve(profiles);
      }, 5000);
    });
  }

  /**
   * Gets profile data for a specific pubkey
   */
  async getUserProfile(
    pool: SimplePool,
    pubkey: string,
    relays: string[]
  ): Promise<any> {
    const profiles = await this.getProfilesByPubkeys(pool, [pubkey], relays);
    return profiles[pubkey] || null;
  }

  /**
   * Verifies a NIP-05 identifier against an expected pubkey
   */
  async verifyNip05(identifier: string, expectedPubkey: string): Promise<boolean> {
    try {
      const result = await nip05.queryProfile(identifier);
      return result?.pubkey === expectedPubkey;
    } catch (error) {
      console.error("Error verifying NIP-05:", error);
      return false;
    }
  }
}
