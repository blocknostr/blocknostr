
import { getEventHash } from 'nostr-tools';
import * as secp from '@noble/secp256k1';
import { bytesToHex } from '@noble/hashes/utils';

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
    pool: any,
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
      
      // Sign the event using noble-secp256k1
      const sig = await this.signEvent(eventWithMeta, privateKey);
      eventWithMeta.sig = sig;
      
      // Publish to relays
      const pubs = pool.publish(relays, eventWithMeta);
      
      // Wait for at least one relay to accept
      if (pubs.length > 0) {
        try {
          await Promise.race(pubs); // Use Promise.race instead of Promise.any for better compatibility
        } catch (e) {
          console.warn("Some relays failed to publish event:", e);
        }
      }
      
      return eventWithMeta.id;
    } catch (error) {
      console.error("Error publishing event:", error);
      return null;
    }
  }

  /**
   * Sign an event with a private key
   * @param event Event to sign
   * @param privateKey Private key in hex format
   * @returns Promise resolving to signature
   */
  async signEvent(event: any, privateKey: string): Promise<string> {
    const eventHash = getEventHash(event);
    // Generate the signature using the basic sign method without recovery parameter
    const signatureBytes = await secp.sign(eventHash, privateKey);
    return bytesToHex(signatureBytes);
  }
}
