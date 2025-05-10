
import { getEventHash, validateEvent, SimplePool, finalizeEvent, type Event, type UnsignedEvent, getPublicKey, nip19 } from 'nostr-tools';
import { NostrEvent } from './types';
import { EVENT_KINDS } from './constants';

export class EventManager {
  async publishEvent(
    pool: SimplePool, 
    publicKey: string | null, 
    privateKey: string | null, 
    event: Partial<NostrEvent>,
    relays: string[]
  ): Promise<string | null> {
    if (!publicKey) {
      console.error("Public key not available");
      return null;
    }
    
    const fullEvent: NostrEvent = {
      pubkey: publicKey,
      created_at: Math.floor(Date.now() / 1000),
      kind: event.kind || EVENT_KINDS.TEXT_NOTE,
      tags: event.tags || [],
      content: event.content || '',
    };
    
    const eventId = getEventHash(fullEvent as any);
    let signedEvent: NostrEvent;
    
    try {
      if (window.nostr) {
        // Use NIP-07 browser extension for signing
        signedEvent = await window.nostr.signEvent(fullEvent);
      } else if (privateKey) {
        // Convert privateKey string to Uint8Array if needed
        let privateKeyBytes: Uint8Array;
        
        try {
          // Handle hex private key
          if (privateKey.match(/^[0-9a-fA-F]{64}$/)) {
            privateKeyBytes = new Uint8Array(
              privateKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
            );
          } 
          // Handle nsec private key
          else if (privateKey.startsWith('nsec')) {
            const { data } = nip19.decode(privateKey);
            privateKeyBytes = data as Uint8Array;
          } 
          // Default fallback
          else {
            privateKeyBytes = new TextEncoder().encode(privateKey);
          }
          
          // Verify keypair before using
          const derivedPubkey = getPublicKey(privateKeyBytes);
          if (derivedPubkey !== publicKey) {
            console.error("Private key doesn't match public key");
            return null;
          }
          
          // Use private key for signing
          // Create a proper UnsignedEvent object without any excess properties
          const unsignedEvent: UnsignedEvent = {
            kind: fullEvent.kind,
            created_at: fullEvent.created_at,
            tags: fullEvent.tags,
            content: fullEvent.content,
            pubkey: fullEvent.pubkey
          };
          
          // Pass the correct types to finalizeEvent
          signedEvent = finalizeEvent(unsignedEvent, privateKeyBytes);
          
        } catch (keyError) {
          console.error("Invalid private key format:", keyError);
          return null;
        }
      } else {
        return null;
      }
      
      // Validate the signed event
      if (!validateEvent(signedEvent)) {
        console.error("Invalid event signature");
        return null;
      }
      
      // Publish to relays
      if (relays.length === 0) {
        console.error("No relays available");
        return null;
      }
      
      pool.publish(relays, signedEvent);
      return eventId;
      
    } catch (error) {
      console.error("Error publishing event:", error);
      return null;
    }
  }
  
  // Helper method to create profile metadata event
  async publishProfileMetadata(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null,
    metadata: Record<string, any>,
    relays: string[]
  ): Promise<boolean> {
    if (!publicKey) {
      return false;
    }
    
    try {
      const event = {
        kind: EVENT_KINDS.META,
        content: JSON.stringify(metadata),
        tags: []
      };
      
      const eventId = await this.publishEvent(pool, publicKey, privateKey, event, relays);
      return !!eventId;
    } catch (error) {
      console.error("Error publishing profile metadata:", error);
      return false;
    }
  }
}
