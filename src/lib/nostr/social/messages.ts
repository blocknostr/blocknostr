
import { SimplePool } from 'nostr-tools';
import { NostrEvent } from '../types';
import { EVENT_KINDS } from '../constants';
import { EventManager } from '../event';
import { toast } from 'sonner';

/**
 * MessagesManager handles encrypted direct messaging
 */
export class MessagesManager {
  private eventManager: EventManager;
  
  constructor(eventManager: EventManager) {
    this.eventManager = eventManager;
  }
  
  /**
   * Send a direct message to a user
   * NIP-04: Encrypted Direct Messages
   */
  public async sendDirectMessage(
    pool: SimplePool,
    recipientPubkey: string,
    content: string,
    senderPubkey: string | null,
    privateKey: string | null,
    relayUrls: string[]
  ): Promise<string | null> {
    if (!senderPubkey) {
      toast.error("You must be logged in to send messages");
      return null;
    }
    
    try {
      // Use NIP-04 encryption through extension (standard method)
      let encryptedContent = content;
      let encryptionSuccessful = false;
      
      if (window.nostr?.nip04) {
        // Use NIP-04 encryption through extension
        try {
          encryptedContent = await window.nostr.nip04.encrypt(recipientPubkey, content);
          encryptionSuccessful = true;
          console.log("Message encrypted with NIP-04");
        } catch (e) {
          console.error("NIP-04 encryption failed:", e);
        }
      }
      
      if (!encryptionSuccessful) {
        toast.error("Message encryption failed - install a Nostr extension with NIP-04 support");
        return null;
      }
      
      // Create the direct message event (NIP-17)
      const event = {
        kind: EVENT_KINDS.ENCRYPTED_DM, // Using kind 14 (NIP-17)
        content: encryptedContent,
        tags: [
          ['p', recipientPubkey]
        ]
      };
      
      // Publish to relays
      return await this.eventManager.publishEvent(
        pool,
        senderPubkey,
        privateKey,
        event,
        relayUrls
      );
    } catch (error) {
      console.error("Error sending direct message:", error);
      toast.error("Failed to send message");
      return null;
    }
  }
}
