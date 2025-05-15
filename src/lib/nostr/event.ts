
import { SimplePool, getEventHash, signEvent } from 'nostr-tools';

export class EventManager {
  /**
   * Publish an event using the provided public key, private key, and event data
   * @param pool SimplePool to use for publishing
   * @param publicKey Public key of the signer
   * @param privateKey Private key to sign with
   * @param event Event data to publish
   * @param relays Relays to publish to
   * @returns Promise resolving to event ID or null
   */
  async publishEvent(
    pool: SimplePool,
    publicKey: string,
    privateKey: string,
    event: any,
    relays: string[]
  ): Promise<string | null> {
    try {
      const now = Math.floor(Date.now() / 1000);
      
      // Create the event object
      const eventWithMeta = {
        ...event,
        pubkey: publicKey,
        created_at: now,
        id: '',
        sig: ''
      };
      
      // Calculate the event hash
      eventWithMeta.id = getEventHash(eventWithMeta);
      
      // Sign the event
      eventWithMeta.sig = signEvent(eventWithMeta, privateKey);
      
      // Publish to relays
      const pubs = pool.publish(relays, eventWithMeta);
      
      // Wait for at least one relay to accept
      await Promise.any(pubs);
      
      return eventWithMeta.id;
    } catch (error) {
      console.error("Error publishing event:", error);
      return null;
    }
  }
}
