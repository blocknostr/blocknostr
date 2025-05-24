
import { BaseAdapter } from './base-adapter';
import { EVENT_KINDS } from '../constants';
import * as nip44 from '../utils/nip/nip44';

/**
 * MessagingAdapter handles encrypted direct messages
 * with support for both NIP-04 (legacy) and NIP-44 (versioned encryption)
 */
export class MessagingAdapter extends BaseAdapter {
  /**
   * Send a direct message to a user with automatic encryption selection
   * Will use NIP-44 if available, falling back to NIP-04
   */
  async sendDirectMessage(recipientPubkey: string, content: string) {
    try {
      // Get current user's public key
      const senderPubkey = this.service.publicKey;
      if (!senderPubkey) {
        throw new Error("Not logged in");
      }
      
      // Always use NIP-04 for external compatibility
      let encryptedContent: string;
      let tags = [['p', recipientPubkey]];
      let kind = EVENT_KINDS.ENCRYPTED_DM; // Default to kind 4 (NIP-04)
      
      console.log(`Sending message to ${recipientPubkey}`);
      
      if (window.nostr && window.nostr.nip04) {
        try {
          // Use NIP-04 (legacy/external)
          encryptedContent = await window.nostr.nip04.encrypt(recipientPubkey, content);
        } catch (error) {
          console.error("Error encrypting message with NIP-04:", error);
          throw new Error("Failed to encrypt message");
        }
      } else {
        // Implementation is missing or not available
        console.error("No encryption available - Nostr extension does not support nip04");
        throw new Error("Encryption not supported by your Nostr extension");
      }
      
      // Create the event
      const event = {
        kind,
        content: encryptedContent,
        tags
      };
      
      // Publish the event
      return this.service.publishEvent(event);
    } catch (error) {
      console.error("Error sending direct message:", error);
      throw error;
    }
  }
  
  /**
   * Decrypt a direct message with automatic protocol detection
   * Will detect and use NIP-44 or NIP-04 based on message kind/format
   */
  async decryptDirectMessage(senderPubkey: string, encryptedContent: string, kind: number = 4) {
    try {
      // For now, we only support NIP-04 through extensions
      if (window.nostr && window.nostr.nip04) {
        try {
          return window.nostr.nip04.decrypt(senderPubkey, encryptedContent);
        } catch (err) {
          console.error("Error with NIP-04 decryption:", err);
          throw new Error("Failed to decrypt message");
        }
      } else {
        // No encryption available through extension
        console.log("NIP-04 decryption not available in extension");
        throw new Error("Decryption not supported by your Nostr extension");
      }
    } catch (error) {
      console.error("Error decrypting direct message:", error);
      throw error;
    }
  }
}
