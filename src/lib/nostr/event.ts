
import { getEventHash, validateEvent, SimplePool } from 'nostr-tools';
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
        // Use private key if available (not recommended for production)
        // Import the function dynamically to fix the missing export issue
        const { finalizeEvent } = await import('nostr-tools');
        signedEvent = finalizeEvent(
          {
            kind: fullEvent.kind,
            created_at: fullEvent.created_at,
            tags: fullEvent.tags,
            content: fullEvent.content,
          },
          privateKey as any // Using type assertion to fix the Uint8Array type issue
        );
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
