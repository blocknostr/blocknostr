
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
      // Check if NIP-44 is supported
      const useNip44 = typeof window.nostr?.nip44 === 'object';
      let encryptedContent: string;
      let tags = [['p', recipientPubkey]];
      let kind = EVENT_KINDS.ENCRYPTED_DM; // Default to kind 4 (NIP-04)
      
      console.log(`Sending message to ${recipientPubkey} using ${useNip44 ? 'NIP-44' : 'NIP-04'} encryption`);
      
      if (useNip44) {
        // Use NIP-44 (versioned encryption)
        try {
          // Get own private key (requires extension/wallet integration)
          const privateKey = await window.nostr?.getPrivateKey?.();
          if (!privateKey) throw new Error("Could not access private key");
          
          // Encrypt using NIP-44
          encryptedContent = nip44.encrypt({
            plaintext: content,
            privateKey: privateKey,
            publicKey: recipientPubkey
          });
          
          // Use kind 14 for NIP-44 messages
          kind = 14; // NIP-44 uses kind 14
          
          // Add subject tag for NIP-44
          tags.push(['subject', 'NIP-44 Encrypted Message']);
        } catch (err) {
          console.error("Error with NIP-44 encryption, falling back to NIP-04:", err);
          // Fall back to NIP-04
          encryptedContent = await window.nostr.nip04.encrypt(recipientPubkey, content);
        }
      } else {
        // Use NIP-04 (legacy)
        encryptedContent = await window.nostr.nip04.encrypt(recipientPubkey, content);
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
      // Try to determine encryption method
      const isNip44 = kind === 14; // NIP-44 uses kind 14
      
      if (isNip44 && typeof window.nostr?.nip44 === 'object') {
        // NIP-44 decryption
        try {
          const privateKey = await window.nostr?.getPrivateKey?.();
          if (!privateKey) throw new Error("Could not access private key");
          
          return nip44.decrypt({
            ciphertext: encryptedContent,
            privateKey: privateKey,
            publicKey: senderPubkey
          });
        } catch (err) {
          console.error("Error with NIP-44 decryption, trying NIP-04:", err);
        }
      }
      
      // Fall back to NIP-04
      return window.nostr.nip04.decrypt(senderPubkey, encryptedContent);
    } catch (error) {
      console.error("Error decrypting direct message:", error);
      throw error;
    }
  }
}
