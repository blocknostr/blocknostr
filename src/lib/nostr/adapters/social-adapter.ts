
import { BaseAdapter } from './base-adapter';
import { encrypt, decrypt } from '../utils/nip/nip44';
import { EVENT_KINDS } from '../constants';
import { NostrEvent } from '../types';

export class SocialAdapter extends BaseAdapter {
  isFollowing(pubkey: string) {
    return this.service.isFollowing ? this.service.isFollowing(pubkey) : false;
  }
  
  async followUser(pubkey: string) {
    return this.service.followUser ? this.service.followUser(pubkey) : false;
  }
  
  async unfollowUser(pubkey: string) {
    return this.service.unfollowUser ? this.service.unfollowUser(pubkey) : false;
  }
  
  async sendDirectMessage(recipientPubkey: string, content: string) {
    try {
      // Check for required functionality
      if (!this.service.publishEvent || !this.publicKey) {
        console.error("Missing required functionality or not logged in");
        return false;
      }

      const senderPrivateKey = localStorage.getItem('nostr_private_key');
      if (!senderPrivateKey) {
        console.error("Private key not available for encryption");
        return false;
      }

      // Encrypt content using NIP-44 (XChaCha20-Poly1305)
      const encryptedContent = encrypt(content, senderPrivateKey, recipientPubkey);

      // Create the direct message event according to NIP-04/NIP-44 specs
      const dmEvent = {
        kind: EVENT_KINDS.DIRECT_MESSAGE,
        content: encryptedContent,
        tags: [
          ['p', recipientPubkey]
        ]
      };

      // Publish the event
      const publishResult = await this.service.publishEvent(dmEvent);
      return !!publishResult;
    } catch (error) {
      console.error("Error sending direct message:", error);
      return false;
    }
  }
  
  async decryptDirectMessage(event: NostrEvent): Promise<string | null> {
    try {
      // Get the sender's public key
      const senderPubkey = event.pubkey;
      
      // Get recipient's private key from local storage
      const recipientPrivateKey = localStorage.getItem('nostr_private_key');
      if (!recipientPrivateKey) {
        console.error("Private key not available for decryption");
        return null;
      }

      // Decrypt the content - NIP-44 will fallback to NIP-04 if needed
      return decrypt(event.content, recipientPrivateKey, senderPubkey);
    } catch (error) {
      console.error("Error decrypting direct message:", error);
      return null;
    }
  }
  
  get socialManager() {
    return this.service.socialManager;
  }
}
