
import { nostrService } from "../nostr";

/**
 * Nostr-specific encryption utilities using NIP-04
 */
export const nostrEncryption = {
  /**
   * Encrypt content using the user's own pubkey (self-encryption)
   */
  async encryptContent(content: string): Promise<string | null> {
    try {
      const publicKey = nostrService.publicKey;
      
      if (!publicKey) {
        throw new Error("User must be logged in to encrypt content");
      }
      
      // Use the NIP-04 method from the Nostr extension
      if (window.nostr?.nip04) {
        // Self-encrypt: use our own pubkey as the recipient
        const encrypted = await window.nostr.nip04.encrypt(publicKey, content);
        return encrypted;
      } else {
        throw new Error("NIP-04 encryption not available");
      }
    } catch (error) {
      console.error("Encryption error:", error);
      return null;
    }
  },
  
  /**
   * Decrypt content using the user's private key
   */
  async decryptContent(encryptedContent: string, senderPubkey: string): Promise<string | null> {
    try {
      // Use the NIP-04 method from the Nostr extension
      if (window.nostr?.nip04) {
        const decrypted = await window.nostr.nip04.decrypt(senderPubkey, encryptedContent);
        return decrypted;
      } else {
        throw new Error("NIP-04 decryption not available");
      }
    } catch (error) {
      console.error("Decryption error:", error);
      return null;
    }
  }
};
