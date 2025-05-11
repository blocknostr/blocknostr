
import { getEventHash, validateEvent, SimplePool, finalizeEvent, type Event as NostrToolsEvent, type UnsignedEvent, getPublicKey, nip19 } from 'nostr-tools';
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
        try {
          signedEvent = await window.nostr.signEvent({
            kind: fullEvent.kind,
            created_at: fullEvent.created_at,
            content: fullEvent.content,
            tags: fullEvent.tags,
            pubkey: publicKey
          });
          
          // Validate the signature from the extension
          if (!validateEvent(signedEvent)) {
            console.error("Invalid signature from extension");
            return null;
          }
        } catch (err) {
          console.error("Extension signing failed:", err);
          return null;
        }
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
          
          // Fix: Explicitly cast the result to NostrEvent to satisfy TypeScript
          signedEvent = finalizeEvent(unsignedEvent, privateKeyBytes) as NostrEvent;
          
        } catch (keyError) {
          console.error("Invalid private key format:", keyError);
          return null;
        }
      } else {
        console.error("No signing method available");
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
      
      // Explicitly cast to NostrToolsEvent to satisfy type requirements
      pool.publish(relays, signedEvent as NostrToolsEvent);
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
      // Create an event object that follows the NostrEvent structure
      const metadataEvent: Partial<NostrEvent> = {
        kind: EVENT_KINDS.META,
        content: JSON.stringify(metadata),
        tags: []
      };
      
      // Use the existing publishEvent method which handles proper event creation and signing
      const eventId = await this.publishEvent(pool, publicKey, privateKey, metadataEvent, relays);
      return !!eventId;
    } catch (error) {
      console.error("Error publishing profile metadata:", error);
      return false;
    }
  }
  
  // Method to encrypt a message using NIP-04 (can use extension or manual)
  async encryptMessage(
    recipientPubkey: string,
    message: string,
    senderPrivateKey?: string | null
  ): Promise<string | null> {
    try {
      // Try to use NIP-07 extension first
      if (window.nostr && window.nostr.nip04) {
        return await window.nostr.nip04.encrypt(recipientPubkey, message);
      } 
      // In the future, implement manual encryption with senderPrivateKey
      else {
        console.error("No encryption method available");
        return null;
      }
    } catch (error) {
      console.error("Encryption error:", error);
      return null;
    }
  }
  
  // Method to decrypt a message using NIP-04
  async decryptMessage(
    senderPubkey: string,
    encryptedMessage: string,
    recipientPrivateKey?: string | null
  ): Promise<string | null> {
    try {
      // Try to use NIP-07 extension first
      if (window.nostr && window.nostr.nip04) {
        return await window.nostr.nip04.decrypt(senderPubkey, encryptedMessage);
      } 
      // In the future, implement manual decryption with recipientPrivateKey
      else {
        console.error("No decryption method available");
        return null;
      }
    } catch (error) {
      console.error("Decryption error:", error);
      return null;
    }
  }
}
