
import { SimplePool } from 'nostr-tools';
import { EventManager } from '../event';
import { EVENT_KINDS } from '../constants';

export class MessagesManager {
  private eventManager: EventManager;
  
  constructor(eventManager: EventManager) {
    this.eventManager = eventManager;
  }
  
  /**
   * Send a direct message to a user
   * NIP-04: Encrypted Direct Messages (kind 4)
   */
  async sendDirectMessage(
    pool: SimplePool,
    recipientPubkey: string,
    content: string,
    senderPubkey: string | null,
    privateKey: string | null,
    relayUrls: string[]
  ): Promise<string | null> {
    if (!senderPubkey) return null;
    
    try {
      let encryptedContent = content;
      
      // Encrypt message using NIP-04 if browser extension is available
      if (window.nostr?.nip04) {
        try {
          encryptedContent = await window.nostr.nip04.encrypt(recipientPubkey, content);
        } catch (e) {
          console.error("Failed to encrypt message:", e);
          return null;
        }
      } else {
        console.warn("No encryption available, sending plaintext message");
      }
      
      // Create direct message event (kind 4)
      const event = {
        kind: EVENT_KINDS.ENCRYPTED_DIRECT_MESSAGE,
        content: encryptedContent,
        tags: [
          ["p", recipientPubkey] // Tag recipient
        ]
      };
      
      return this.eventManager.publishEvent(pool, senderPubkey, privateKey, event, relayUrls);
    } catch (error) {
      console.error("Error sending direct message:", error);
      return null;
    }
  }
}
