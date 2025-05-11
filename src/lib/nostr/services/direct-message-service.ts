
import { SimplePool } from 'nostr-tools';
import { nip04 } from 'nostr-tools';
import { EVENT_KINDS } from '../constants';
import { EventService } from './event-service';

/**
 * Service for encrypted direct messages (NIP-04)
 */
export class DirectMessageService {
  constructor(
    private pool: SimplePool,
    private eventService: EventService,
    private getPublicKey: () => string | null,
    private getConnectedRelayUrls: () => string[]
  ) {}
  
  /**
   * Send an encrypted direct message
   */
  async sendDirectMessage(recipientPubkey: string, content: string, relays?: string[]): Promise<string | null> {
    const senderPubkey = this.getPublicKey();
    if (!senderPubkey) return null;
    
    try {
      // Encrypt the content using NIP-04
      const encryptedContent = await window.nostr.nip04.encrypt(recipientPubkey, content);
      
      // Create the direct message event
      return this.eventService.publishEvent({
        kind: EVENT_KINDS.DIRECT_MESSAGE,
        content: encryptedContent,
        tags: [
          ['p', recipientPubkey]
        ]
      }, relays);
    } catch (error) {
      console.error('Error sending direct message:', error);
      return null;
    }
  }
  
  /**
   * Get direct messages between the current user and another user
   */
  async getDirectMessages(otherPubkey: string): Promise<any[]> {
    const currentPubkey = this.getPublicKey();
    if (!currentPubkey) return [];
    
    const relays = this.getConnectedRelayUrls();
    if (relays.length === 0) return [];
    
    try {
      // Get messages sent to the current user
      const receivedEvents = await this.pool.list(relays, [{
        kinds: [EVENT_KINDS.DIRECT_MESSAGE],
        authors: [otherPubkey],
        '#p': [currentPubkey]
      }]);
      
      // Get messages sent by the current user
      const sentEvents = await this.pool.list(relays, [{
        kinds: [EVENT_KINDS.DIRECT_MESSAGE],
        authors: [currentPubkey],
        '#p': [otherPubkey]
      }]);
      
      // Combine and sort by timestamp
      const allEvents = [...receivedEvents, ...sentEvents].sort((a, b) => a.created_at - b.created_at);
      
      // Process the events to decrypt the content
      const processedEvents = await Promise.all(allEvents.map(async event => {
        try {
          let decryptedContent = '';
          
          // Determine the pubkey to use for decryption
          const pubkeyToUse = event.pubkey === currentPubkey ? otherPubkey : event.pubkey;
          
          // Decrypt the content
          decryptedContent = await window.nostr.nip04.decrypt(pubkeyToUse, event.content);
          
          return {
            ...event,
            decryptedContent
          };
        } catch (e) {
          console.error('Error decrypting message:', e);
          return {
            ...event,
            decryptedContent: '[Encryption error]'
          };
        }
      }));
      
      return processedEvents;
    } catch (error) {
      console.error('Error getting direct messages:', error);
      return [];
    }
  }
}
